"use client"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"

interface ForecastDataPoint {
    date: string
    type: 'historical' | 'forecast'
    value: number
}

interface ForecastChartProps {
    data: ForecastDataPoint[]
}

export function ForecastChart({ data }: ForecastChartProps) {
    // Transform data for Recharts (separate series for styling)
    // We need to connect the last historical point to the first forecast point
    // to avoid a gap in the line.

    // 1. Find the crossover point (last historical)
    const lastHistoricalIndex = data.findLastIndex(d => d.type === 'historical')
    const lastHistorical = data[lastHistoricalIndex]

    const chartData = data.map((d, index) => {
        const isHistorical = d.type === 'historical'
        // If this is the first forecast point, we also want to show it as connected to historical
        // But Recharts handles nulls by breaking the line.
        // Strategy:
        // - 'historical' series has value for historical points AND the first forecast point (overlap)
        // - 'forecast' series has value for forecast points AND the last historical point (overlap)

        return {
            date: d.date,
            historical: isHistorical ? d.value : (index === lastHistoricalIndex + 1 ? d.value : null), // Overlap 1 point forward? No, easier to overlap from other side
            forecast: !isHistorical ? d.value : (index === lastHistoricalIndex ? d.value : null),
            fullValue: d.value // For tooltip
        }
    })

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Proyección de Ventas (IA)</h3>
                <p className="text-sm text-slate-500">
                    Basado en Regresión Lineal de los últimos 3 meses
                </p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="date"
                            fontSize={12}
                            tickMargin={10}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return `${date.getDate()}/${date.getMonth() + 1}`
                            }}
                            stroke="#94a3b8"
                        />
                        <YAxis
                            fontSize={12}
                            tickFormatter={(value) => `$${value}`}
                            stroke="#94a3b8"
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            formatter={(value: any, name: any) => [
                                value ? `$${Number(value).toFixed(2)}` : '$0.00',
                                name === 'historical' ? 'Histórico' : (name === 'forecast' ? 'Proyección' : 'Valor')
                            ]}
                        />
                        <Legend />

                        {/* Historical Line (Solid) */}
                        <Line
                            type="monotone"
                            dataKey="historical"
                            stroke="#4f46e5"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                            name="historical"
                            connectNulls // Critical to join segments if needed, though our overlap strategy avoids gaps
                        />

                        {/* Forecast Line (Dotted) */}
                        <Line
                            type="monotone"
                            dataKey="forecast"
                            stroke="#8b5cf6" // Violet
                            strokeWidth={2}
                            strokeDasharray="5 5" // Dotted effect
                            dot={false}
                            name="forecast"
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex gap-4 text-xs text-slate-500 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                    <span>Datos Reales</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-violet-500 rounded-full opacity-50"></div>
                    <span>Tendencia Futura</span>
                </div>
            </div>
        </div>
    )
}
