"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { ArrowLeft, History, ArrowDownLeft, ArrowUpRight, ShoppingCart, RefreshCw } from "lucide-react"
import Link from "next/link"
import { StockMovement } from "@/types"

// DB Response Shape - IMPORTED FROM TYPES
// (Interface removed as it is now in types/index.ts)

export default function MovementsPage() {
    const supabase = createClient()
    const [movements, setMovements] = useState<StockMovement[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMovements()
        }, 500) // Debounce

        return () => clearTimeout(timer)
    }, [searchTerm])

    async function fetchMovements() {
        setLoading(true)
        try {
            let query = supabase
                .from('stock_movements')
                .select(`
                    *,
                    products!inner (
                        name,
                        sku
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(100)

            if (searchTerm) {
                const term = searchTerm.trim()
                // Filter by Product Name or SKU matching the term
                query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`, { foreignTable: 'products' })
            }

            const { data, error } = await query

            if (error) {
                console.error("Error fetching movements:", error)
            } else if (data) {
                setMovements(data as unknown as StockMovement[])
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'IN': return <ArrowDownLeft className="text-emerald-500" />
            case 'OUT': return <ArrowUpRight className="text-red-500" />
            case 'SALE': return <ShoppingCart className="text-blue-500" />
            case 'ADJUSTMENT': return <RefreshCw className="text-amber-500" />
            default: return <History className="text-slate-500" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'IN': return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">Entrada</span>
            case 'OUT': return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">Salida</span>
            case 'SALE': return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Venta</span>
            case 'ADJUSTMENT': return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">Ajuste</span>
            default: return <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs">{type}</span>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/inventory" className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Kardex de Movimientos</h2>
                    <p className="text-slate-600">Historial de entradas y salidas de inventario.</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    placeholder="Buscar por producto o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 max-w-sm px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder:text-slate-500"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Cargando movimientos...</div>
                ) : movements.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No hay movimientos registrados aún.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-6 py-3 font-medium">Fecha</th>
                                <th className="px-6 py-3 font-medium">Producto</th>
                                <th className="px-6 py-3 font-medium">Usuario</th>
                                <th className="px-6 py-3 font-medium">Tipo</th>
                                <th className="px-6 py-3 font-medium">Detalles</th>
                                <th className="px-6 py-3 font-medium text-right">Costo</th>
                                <th className="px-6 py-3 font-medium text-right">Cantidad</th>
                                <th className="px-6 py-3 font-medium text-right">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {movements.map((move) => (
                                <tr key={move.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                        {new Date(move.created_at).toLocaleString('es-VE')}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        <div className="flex flex-col">
                                            <span>{move.products?.name || "Eliminado"}</span>
                                            <span className="text-xs text-slate-400">{move.products?.sku}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {move.user_id ? "Usuario App" : "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(move.type)}
                                            {getTypeLabel(move.type)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 max-w-xs">
                                        <div className="text-xs font-semibold text-slate-800">{move.reference}</div>
                                        {move.notes && <div className="text-xs text-slate-500 italic">"{move.notes}"</div>}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-600">
                                        {move.unit_cost ? `$${move.unit_cost}` : '-'}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${(move.type === 'OUT' || move.type === 'SALE' || (move.type === 'ADJUSTMENT' && move.new_stock < move.previous_stock))
                                            ? 'text-red-600' : 'text-emerald-600'
                                        }`}>
                                        {
                                            (move.type === 'OUT' || move.type === 'SALE' || (move.type === 'ADJUSTMENT' && move.new_stock < move.previous_stock))
                                                ? '-' : '+'
                                        }
                                        {Math.abs(move.quantity)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500">
                                        {move.new_stock}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
