
interface SalesData {
    date: string
    amount: number
}

interface SalesChartProps {
    data: SalesData[]
}

export function SalesChart({ data }: SalesChartProps) {
    const maxAmount = Math.max(...data.map(d => d.amount), 1)

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Ventas Recientes (USD)</h3>

            <div className="flex items-end space-x-4 h-64">
                {data.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        No hay datos de ventas
                    </div>
                ) : (
                    data.map((item, index) => {
                        const heightPercentage = (item.amount / maxAmount) * 100
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center group relative">
                                <div
                                    className="w-full bg-indigo-100 rounded-t-lg transition-all duration-500 hover:bg-indigo-600 relative"
                                    style={{ height: `${heightPercentage}%` }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                        ${item.amount.toFixed(2)}
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 mt-2 rotate-0 truncate w-full text-center">
                                    {item.date}
                                </span>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
