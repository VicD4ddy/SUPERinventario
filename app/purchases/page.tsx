"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { PurchaseOrder } from "@/types"
import { Plus, Search, ShoppingBag, Calendar, Truck, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function PurchasesPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        setLoading(true)
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                suppliers (name)
            `)
            .order('created_at', { ascending: false })

        if (data) {
            const mapped: PurchaseOrder[] = data.map((item: any) => ({
                id: item.id,
                supplierId: item.supplier_id,
                supplier: { name: item.suppliers?.name || 'Desconocido' } as any,
                date: new Date(item.date),
                status: item.status,
                totalAmount: item.total_amount,
                notes: item.notes,
                createdAt: new Date(item.created_at)
            }))
            setOrders(mapped)
        }
        setLoading(false)
    }

    const filteredOrders = orders.filter(o =>
        o.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <ShoppingBag className="h-8 w-8 text-slate-400" />
                        Compras y Pedidos
                    </h2>
                    <p className="text-slate-500">Gestiona tus órdenes de compra y reposición de inventario.</p>
                </div>
                <Link
                    href="/purchases/new"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                >
                    <Plus size={20} /> Nueva Orden
                </Link>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                <Search className="text-slate-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="Buscar por proveedor o notas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 outline-none text-sm text-slate-600 placeholder:text-slate-400"
                />
            </div>

            {loading ? (
                <div className="py-12 text-center text-slate-500 animate-pulse">Cargando órdenes...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                    <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No hay órdenes registradas.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOrders.map((order) => (
                        <Link
                            href={`/purchases/${order.id}`}
                            key={order.id}
                            className="block bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Calendar size={14} />
                                    {order.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center gap-1
                                    ${order.status === 'received' ? 'bg-emerald-100 text-emerald-700' :
                                        order.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                                            'bg-amber-100 text-amber-700'}
                                `}>
                                    {order.status === 'received' && <CheckCircle2 size={12} />}
                                    {order.status === 'pending' && <AlertCircle size={12} />}
                                    {order.status === 'received' ? 'Recibido' :
                                        order.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                                </span>
                            </div>

                            <div className="mb-4">
                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                    <Truck size={12} /> Proveedor
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {order.supplier?.name}
                                </h3>
                            </div>

                            <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                                <div>
                                    <div className="text-xs text-slate-500">Total Orden</div>
                                    <div className="text-xl font-black text-slate-900">
                                        ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded group-hover:bg-indigo-100 transition-colors">
                                    Ver Detalle →
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )
            }
        </div >
    )
}
