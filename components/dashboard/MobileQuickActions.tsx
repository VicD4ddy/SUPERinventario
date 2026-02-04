"use client"
import Link from "next/link"
import { ShoppingCart, ScanBarcode, PlusCircle, DollarSign, RefreshCw, TrendingUp } from "lucide-react"
import { useExchangeRate } from "@/hooks/useExchangeRate"

export function MobileQuickActions() {
    const { rate, loading, refreshRate } = useExchangeRate()

    return (
        <div className="md:hidden flex flex-col gap-4 mb-6">

            {/* Currency Rate Banner */}
            <div className="bg-slate-900 rounded-xl p-4 text-white shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                        <DollarSign size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Tasa BCV del Día</p>
                        <div className="flex items-end gap-1.5">
                            <h3 className="text-2xl font-bold leading-none tracking-tight">
                                {loading ? "..." : rate.toFixed(2)}
                            </h3>
                            <span className="text-sm font-medium text-slate-400 mb-0.5">Bs/$</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => refreshRate()}
                    disabled={loading}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={18} className={`text-slate-300 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Quick Sale - Primary Action */}
                <Link
                    href="/sales"
                    className="col-span-2 bg-[var(--primary)] text-white p-4 rounded-xl shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-between group relative overflow-hidden"
                >
                    <div className="relative z-10 flex flex-col">
                        <span className="text-xs font-medium opacity-90 uppercase tracking-wider">Venta Rápida</span>
                        <span className="text-xl font-bold">Nueva Venta</span>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full relative z-10">
                        <ShoppingCart size={24} className="group-hover:-rotate-12 transition-transform" />
                    </div>

                    {/* Decorative background shapes */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -left-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                </Link>

                {/* Secondary Actions */}
                <Link
                    href="/inventory"
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all flex flex-col gap-3 group"
                >
                    <div className="bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                        <ScanBarcode size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Inventario</span>
                </Link>

                <Link
                    href="/expenses"
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all flex flex-col gap-3 group"
                >
                    <div className="bg-rose-50 w-10 h-10 rounded-full flex items-center justify-center text-rose-600 group-hover:bg-rose-100 transition-colors">
                        <TrendingUp size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Gastos</span>
                </Link>
            </div>
        </div>
    )
}
