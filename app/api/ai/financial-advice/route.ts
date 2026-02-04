import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
    try {
        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ advice: "Error: Configure PERPLEXITY_API_KEY" });
        }

        // 1. Fetch Financial Context
        const today = new Date().toISOString().split('T')[0];

        const results = await Promise.allSettled([
            // A. Sales Forecast and History (Last 3 months, Next 1 month)
            supabase.rpc('get_sales_forecast', { months_back: 3, days_forward: 30 }),
            // B. Expenses Last 30 Days
            supabase.from('expenses').select('amount, category, description').gte('date', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()),
            // C. Top Selling Products (Velocity)
            supabase.rpc('get_stock_predictions', { p_days_analysis: 30 })
        ]);

        const forecastData = results[0].status === 'fulfilled' ? results[0].value.data : [];
        const expensesData = results[1].status === 'fulfilled' ? results[1].value.data : [];
        const topProducts = results[2].status === 'fulfilled' ? results[2].value.data : [];

        // Calculate Summaries
        const totalExpenses30d = expensesData?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0;

        // Split historical vs forecast
        const historical = forecastData?.filter((d: any) => d.type === 'historical') || [];
        const forecast = forecastData?.filter((d: any) => d.type === 'forecast') || [];

        // Sums
        // Sums
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
        - Top Products (Velocity/day): ${topProducts?.slice(0, 5).map((p: any) => `${p.product_name} (${Number(p.daily_velocity).toFixed(1)})`).join(', ')}

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
        return NextResponse.json({ advice: "Error analizando datos financieros." });
    }
}
