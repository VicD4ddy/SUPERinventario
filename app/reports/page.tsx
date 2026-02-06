"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Sparkles } from "lucide-react"
import { SalesTab } from "@/components/reports/SalesTab"
import { PredictionsTab } from "@/components/reports/PredictionsTab"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<'sales' | 'predictions'>('sales')
    const { role, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && role !== 'admin') {
            router.push('/sales')
        }
    }, [role, loading, router])

    if (loading || role !== 'admin') return <div className="p-8 text-center text-slate-500">Cargando...</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center flex-wrap gap-4">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Historial de Ventas</h2>
                    <Link href="/reports/advanced">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-indigo-100 transition-colors border border-indigo-200">
                            <TrendingUp size={14} />
                            Ver Dashboard Avanzado
                        </button>
                    </Link>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sales'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <BarChart3 size={16} />
                        Historial de Ventas
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('predictions')}
                    className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'predictions'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-indigo-600 font-bold">
                            Crystal Ball (IA)
                        </span>
                    </div>
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'sales' ? <SalesTab /> : <PredictionsTab />}
        </div>
    )
}
