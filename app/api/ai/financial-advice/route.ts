import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication & Role
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ advice: "Unauthorized" }, { status: 401 });
        }

        // Check if Admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, business_id')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ advice: "Acceso denegado: Solo administradores." }, { status: 403 });
        }

        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ advice: "Error: Configure PERPLEXITY_API_KEY" });
        }

        // 2. Fetch Financial Context

        // A. Sales Forecast (RPC)
        const { data: forecastData, error: forecastError } = await supabase.rpc('get_sales_forecast', { months_back: 3, days_forward: 30 });

        // B. Expenses Last 30 Days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('amount, category, description')
            .gte('date', thirtyDaysAgo.toISOString())
            .eq('business_id', profile.business_id || await getBusinessId(supabase, user.id)); // Fallback or strict

        // C. Top Selling Products
        const { data: topProducts, error: productsError } = await supabase.rpc('get_stock_predictions', { p_days_analysis: 30 });

        // Calculate Summaries
        const safeExpenses = expensesData || [];
        const safeForecast = forecastData || [];
        const safeProducts = topProducts || [];

        const totalExpenses30d = safeExpenses.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

        // Split historical vs forecast
        const historical = safeForecast.filter((d: any) => d.type === 'historical');
        const forecast = safeForecast.filter((d: any) => d.type === 'forecast');

        const totalSalesLast3Months = historical.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);
        const projectedSalesNext30Days = forecast.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);

        // Trend Analysis
        const trendDirection = projectedSalesNext30Days > (totalSalesLast3Months / 3) ? "UP" : "DOWN";

        const systemPrompt = `
        You are an elite Financial Advisor for a retail business.
        
        FINANCIAL DATA:
        - Total Sales (Last 3 Months): $${totalSalesLast3Months.toFixed(2)}
        - Projected Sales (Next 30 Days): $${projectedSalesNext30Days.toFixed(2)}
        - Trend Direction: ${trendDirection}
        - Total Expenses (Last 30 Days): $${totalExpenses30d.toFixed(2)}
        - Top Products (Velocity/day): ${safeProducts.slice(0, 5).map((p: any) => `${p.product_name} (${Number(p.daily_velocity).toFixed(1)})`).join(', ')}

        INSTRUCTIONS:
        - Analyze the data and provide 3 key insights/recommendations.
        - Focus on Profitability, Cash Flow, and Growth.
        - Be concise and direct. Bullet points only.
        - If expenses are high relative to sales, warn the user.
        - If sales are trending up, suggest restocking or marketing.
        - Language: Spanish.
        - Tone: Professional but encouraging.
        `;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey} `,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "sonar-pro",
                messages: [
                    { role: "system", content: "You are a helpful financial analyst." },
                    { role: "user", content: systemPrompt }
                ],
                temperature: 0.2
            })
        });

        const data = await response.json();
        const advice = data.choices?.[0]?.message?.content || "No se pudo generar el consejo financiero.";

        return NextResponse.json({ advice });

    } catch (error: any) {
        console.error("Financial Advisor Error:", error);
        return NextResponse.json({ advice: "Error analizando datos financieros." }, { status: 500 });
    }
}

// Helper to get business_id if not in profile (redundant but safe)
async function getBusinessId(supabase: any, userId: string) {
    const { data } = await supabase.from('profiles').select('business_id').eq('id', userId).single();
    return data?.business_id;
}
