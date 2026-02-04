"use client"

import { useState, useEffect } from "react"
import { Sparkles, Loader2, RefreshCcw } from "lucide-react"

export function FinancialAdvisorWidget() {
    const [advice, setAdvice] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const fetchAdvice = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ai/financial-advice', { method: 'POST' })
            const data = await res.json()
            setAdvice(data.advice)
        } catch (error) {
            console.error(error)
            setAdvice("No pude conectar con el analista financiero.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAdvice()
    }, [])

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-xl border border-indigo-700/50 shadow-lg relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/20 rounded-lg animate-pulse">
                        <Sparkles className="text-indigo-300 w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Asesor Financiero AI</h3>
                        <p className="text-xs text-indigo-300">Análisis en tiempo real</p>
                    </div>
                </div>
                <button
                    onClick={fetchAdvice}
                    disabled={loading}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />}
                </button>
            </div>

            <div className="relative z-10 min-h-[100px] text-sm leading-relaxed text-indigo-50/90 whitespace-pre-wrap">
                {loading && !advice ? (
                    <div className="flex flex-col items-center justify-center py-8 opacity-70">
                        <Loader2 className="animate-spin w-8 h-8 mb-2" />
                        <p>Analizando tendencias de mercado...</p>
                    </div>
                ) : (
                    advice
                )}
            </div>
        </div>
    )
}
