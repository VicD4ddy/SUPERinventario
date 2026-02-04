"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Sparkles, AlertTriangle, BatteryWarning, TrendingDown, ArrowRight } from "lucide-react"

interface Prediction {
    product_id: string
    product_name: string
    current_stock: number
    daily_velocity: number
    days_remaining: number
    status: 'CRITICAL' | 'WARNING' | 'NOTICE'
}

export function StockPredictionWidget() {
    const [predictions, setPredictions] = useState<Prediction[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchPredictions() {
            const { data, error } = await supabase.rpc('get_stock_predictions')
            if (data) setPredictions(data)
            setLoading(false)
        }
        fetchPredictions()
    }, [])

    if (loading) return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex items-center justify-center min-h-[300px]">
            <div className="animate-pulse flex flex-col items-center text-slate-400">
                <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm">Consultando la bola de cristal...</span>
            </div>
        </div>
    )

    if (predictions.length === 0) return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg h-full text-white flex flex-col items-center justify-center text-center min-h-[300px]">
            <Sparkles className="w-12 h-12 mb-4 text-yellow-300" />
            <h3 className="text-xl font-bold mb-2">Inventario Saludable</h3>
            <p className="text-indigo-100 text-sm max-w-[200px]">
                Nuestra IA no detecta riesgos de ruptura de stock en los próximos 14 días.
            </p>
        </div>
    )

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Predicción de Stock</h3>
                        <p className="text-xs text-slate-500">Basado en velocidad de ventas</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {predictions.map((item) => {
                    const isCritical = item.status === 'CRITICAL'
                    return (
                        <div key={item.product_id} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:shadow-sm transition-all bg-slate-50/50 hover:bg-white">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                    {isCritical ? <BatteryWarning size={18} /> : <AlertTriangle size={18} />}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-slate-900 truncate text-sm">{item.product_name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>Stock: {item.current_stock}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span className="flex items-center gap-1 text-purple-600 font-medium">
                                            <TrendingDown size={12} />
                                            {item.daily_velocity} / día
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right pl-3 flex-shrink-0">
                                <span className={`block text-lg font-bold ${isCritical ? 'text-red-600' : 'text-amber-600'
                                    }`}>
                                    {item.days_remaining} días
                                </span>
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Restantes</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 italic">
                    "Se recomiendan reabastecimientos urgentes para items en rojo"
                </p>
            </div>
        </div>
    )
}
