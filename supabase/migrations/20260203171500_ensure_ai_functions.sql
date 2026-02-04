-- Drop conflicting functions first to allow return type changes
drop function if exists get_financial_metrics(date, date);
drop function if exists get_stock_predictions(int, int);

-- Function to get financial summary (Sales, COGS, Expenses, Profit)
create or replace function get_financial_metrics(
  p_start_date date,
  p_end_date date
)
returns json
language plpgsql
security definer
as $$
declare
  v_total_sales numeric;
  v_total_cogs numeric;
  v_total_expenses numeric;
  v_net_profit numeric;
  v_margin numeric;
begin
  -- 1. Calculate Total Sales (USD)
  select coalesce(sum(total_amount_usd), 0)
  into v_total_sales
  from sales
  where date(created_at) between p_start_date and p_end_date
  and payment_status != 'cancelled'; 

  -- 2. Calculate COGS (Cost of Goods Sold)
  select coalesce(sum(quantity * unit_cost), 0)
  into v_total_cogs
  from stock_movements
  where type = 'SALE'
  and date(created_at) between p_start_date and p_end_date;

  -- 3. Calculate Total Operating Expenses
  select coalesce(sum(amount), 0)
  into v_total_expenses
  from expenses
  where date between p_start_date and p_end_date;

  -- 4. Calculate Net Profit
  v_net_profit := v_total_sales - v_total_cogs - v_total_expenses;

  -- 5. Calculate Margin %
  if v_total_sales > 0 then
    v_margin := round((v_net_profit / v_total_sales) * 100, 2);
  else
    v_margin := 0;
  end if;

  return json_build_object(
    'sales', v_total_sales,
    'cogs', v_total_cogs,
    'expenses', v_total_expenses,
    'profit', v_net_profit,
    'margin', v_margin
  );
end;
$$;

-- Function to predict stock depletion based on sales velocity
create or replace function get_stock_predictions(
    p_days_analysis int default 30, -- Analyze last X days
    p_threshold_days int default 14  -- Warn if stock lasts less than X days
)
returns table (
    product_id uuid,
    product_name text,
    current_stock numeric,
    total_sold_period numeric,
    daily_velocity numeric,
    days_remaining numeric,
    status text
)
language plpgsql
security definer
as $$
begin
    return query
    with sales_stats as (
        select 
            si.product_id,
            sum(si.quantity) as sold_qty
        from sale_items si
        join sales s on si.sale_id = s.id
        where s.created_at >= (now() - (p_days_analysis || ' days')::interval)
        group by si.product_id
    ),
    predictions as (
        select
            p.id as pid,
            p.name as pname,
            p.stock as pstock,
            coalesce(ss.sold_qty, 0) as period_sold,
            round((coalesce(ss.sold_qty, 0) / p_days_analysis::numeric), 2) as velocity
        from products p
        left join sales_stats ss on p.id = ss.product_id
        where p.stock > 0
    )
    select
        pid,
        pname,
        pstock,
        period_sold,
        velocity,
        case 
            when velocity = 0 then 999 
            else round((pstock / velocity), 1) 
        end as days_left,
        case
            when velocity > 0 and (pstock / velocity) < 3 then 'CRITICAL'
            when velocity > 0 and (pstock / velocity) < 7 then 'WARNING'
            else 'NOTICE'
        end as status_label
    from predictions
    where velocity > 0
    and (pstock / velocity) <= p_threshold_days
    order by (pstock / velocity) asc
    limit 10;
end;
$$;
