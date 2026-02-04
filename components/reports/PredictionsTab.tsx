"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { ScenarioSimulator } from "@/components/reports/ScenarioSimulator"
import { FinancialAdvisorWidget } from "@/components/reports/FinancialAdvisorWidget"
// We will lazy load the chart inside this component if needed, 
// but for the V1 split, simply moving it here is a big win.
import { ForecastChart } from "@/components/reports/ForecastChart"
import dynamic from 'next/dynamic'
import { Sparkles, Loader2 } from "lucide-react"

// Lazy load Recharts (it's heavy)
const ForecastChartLazy = dynamic(
    () => import('@/components/reports/ForecastChart').then(mod => mod.ForecastChart),
    {
        loading: () => <div className="h-[300px] bg-slate-50 rounded-xl animate-pulse flex items-center justify-center text-slate-400">Cargando Gráfica...</div>,
        ssr: false
    }
)

export function PredictionsTab() {
    const supabase = createClient()
    const [forecastData, setForecastData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Optional: Fetch sales here to seed the simulator default values
    // For now we'll hardcode or fetch a summary for simulator
    const [simulatorDefaults, setSimulatorDefaults] = useState({ revenue: 0, cost: 0, expenses: 500 })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        // 1. Fetch Forecast
        const { data: forecast } = await supabase.rpc('get_sales_forecast', { months_back: 3, days_forward: 30 })
        if (forecast) setForecastData(forecast)

        // 2. Fetch basic KPI for simulator defaults (Optional optimization: reusing existing RPC)
        // Let's use get_financial_metrics for last 30 days
        const today = new Date().toISOString()
        const lastMonth = new Date()
        lastMonth.setDate(lastMonth.getDate() - 30)

        const { data: metrics } = await supabase.rpc('get_financial_metrics', {
            p_start_date: lastMonth.toISOString(),
            p_end_date: today
        })

        if (metrics && metrics[0]) {
            // metrics returns summary. Revenue is total_revenue.
            // We estimate cost as 60% of revenue if not available, OR fetch from expenses?
            // Simplest: Use logic provided in previous page.tsx
            const rev = metrics[0].total_revenue || 0
            setSimulatorDefaults({
                revenue: rev,
                cost: rev * 0.6, // Rough estimate
                expenses: 500 // Placeholder
            })
        }

        setLoading(false)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {loading && forecastData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
                    <p className="text-slate-500">Consultando la bola de cristal...</p>
                </div>
            ) : (
                <>
                    <ForecastChartLazy data={forecastData} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <ScenarioSimulator
                                currentMonthlyRevenue={simulatorDefaults.revenue}
                                currentMonthlyCost={simulatorDefaults.cost}
                                currentMonthlyExpenses={simulatorDefaults.expenses}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <FinancialAdvisorWidget />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
