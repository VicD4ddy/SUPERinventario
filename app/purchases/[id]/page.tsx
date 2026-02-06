"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { PurchaseOrder, PurchaseItem } from "@/types"
import { ArrowLeft, Printer, Download, CreditCard, Calendar, User, Package, DollarSign, Truck, AlertCircle, CheckCircle2 } from "lucide-react"
import { useSettings } from "@/contexts/SettingsContext"
import { generatePurchasePDF } from "@/utils/printPurchaseOrder"
import Link from "next/link"

export default function PurchaseDetailsPage() {
    const supabase = createClient()
    const { id } = useParams()
    const router = useRouter()
    const { businessName, phoneNumber } = useSettings()
    const [order, setOrder] = useState<PurchaseOrder | null>(null)
    const [items, setItems] = useState<PurchaseItem[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchOrderDetails()
    }, [])

    async function fetchOrderDetails() {
        if (!id) return
        setLoading(true)

        // Fetch Order
        const { data: orderData } = await supabase
            .from('purchase_orders')
            .select(`*, suppliers (name, phone, email)`)
            .eq('id', id)
            .single()

        // Fetch Items
        const { data: itemsData } = await supabase
            .from('purchase_items')
            .select(`*, products (name, stock)`)
            .eq('purchase_id', id)

        if (orderData) {
            setOrder({
                id: orderData.id,
                supplierId: orderData.supplier_id,
                supplier: orderData.suppliers,
                date: new Date(orderData.date),
                status: orderData.status,
                totalAmount: orderData.total_amount,
                notes: orderData.notes,
                paymentDueDate: orderData.payment_due_date,
                createdAt: new Date(orderData.created_at)
            })
        }

        if (itemsData) {
            setItems(itemsData.map((item: any) => ({
                id: item.id,
                purchaseId: item.purchase_id,
                productId: item.product_id,
                product: item.products,
                quantity: item.quantity,
                unitCost: item.unit_cost,
                totalCost: item.total_cost
            })))
        }

        setLoading(false)
    }

    const handleReceiveOrder = async () => {
        if (!order || !confirm("¿Confirmar recepción de mercancía? Esto aumentará el stock de los productos.")) return

        setProcessing(true)
        try {
            // Update items stock (similar to new purchase logic)
            for (const item of items) {
                // Determine current stock from product snapshot we fetched (careful, might be stale, but good reference)
                // Better to fetch current product stock in real time or just increment using sql increment if possible
                // But we need to update cost too.

                // Fetch latest product data to be safe
                const { data: currentProd } = await supabase.from('products').select('stock').eq('id', item.productId).single()
                const currentStock = currentProd?.stock || 0

                // Update Product
                await supabase.from('products')
                    .update({
                        stock: currentStock + item.quantity,
                        cost_usd: item.unitCost, // Update latest cost
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', item.productId)

                // Record Movement
                await supabase.from('stock_movements').insert([{
                    product_id: item.productId,
                    type: 'PURCHASE',
                    quantity: item.quantity,
                    previous_stock: currentStock,
                    new_stock: currentStock + item.quantity,
                    reference: `Compra #${order.id.slice(0, 8)}`,
                    created_at: new Date().toISOString()
                }])
            }

            // Update Order Status
            await supabase
                .from('purchase_orders')
                .update({ status: 'received' })
                .eq('id', order.id)

            // Increment Supplier Debt
            if (order.supplierId && order.totalAmount > 0) {
                const { data: supplierData } = await supabase
                    .from('suppliers')
                    .select('total_debt')
                    .eq('id', order.supplierId)
                    .single()

                const currentDebt = supplierData?.total_debt || 0
                await supabase
                    .from('suppliers')
                    .update({ total_debt: currentDebt + order.totalAmount })
                    .eq('id', order.supplierId)
            }

            alert("Orden recibida exitosamente")
            fetchOrderDetails() // Reload
        } catch (e: any) {
            console.error(e)
            alert("Error al recibir orden: " + e.message)
        } finally {
            setProcessing(false)
        }
    }

    if (loading) return <div className="text-center py-12 text-slate-500">Cargando detalles...</div>
    if (!order) return <div className="text-center py-12 text-slate-500">Orden no encontrada</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/purchases" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-slate-900">Orden #{order.id.slice(0, 8)}</h2>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center gap-1
                            ${order.status === 'received' ? 'bg-emerald-100 text-emerald-700' :
                                order.status === 'cancelled' ? 'bg-slate-100 text-slate-600' :
                                    'bg-amber-100 text-amber-700'}
                        `}>
                            {order.status === 'received' ? 'Recibido' :
                                order.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm">Created {order.createdAt.toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-900">
                            Productos
                        </div>
                        <div className="divide-y divide-slate-100">
                            {items.map(item => (
                                <div key={item.id} className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{item.product?.name || 'Desconocido'}</div>
                                            <div className="text-xs text-slate-500">
                                                {item.quantity} x ${item.unitCost.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-900">
                                        ${item.totalCost.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <div className="text-right">
                                <div className="text-xs text-slate-500">Total</div>
                                <div className="text-2xl font-black text-slate-900">
                                    ${order.totalAmount.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                        <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Detalles</h3>

                        <div>
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                <Truck size={12} /> Proveedor
                            </div>
                            <div className="font-medium text-slate-900">{order.supplier?.name}</div>
                            {order.supplier?.phone && <div className="text-xs text-slate-500">{order.supplier.phone}</div>}
                        </div>

                        <div>
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                <Calendar size={12} /> Fecha Esperada
                            </div>
                            <div className="font-medium text-slate-900">{order.date.toLocaleDateString()}</div>
                        </div>

                        {order.paymentDueDate && (
                            <div>
                                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                    <AlertCircle size={12} className="text-red-500" /> Fecha de Pago (Venc.)
                                </div>
                                <div className="font-medium text-red-700">{new Date(order.paymentDueDate).toLocaleDateString()}</div>
                            </div>
                        )}

                        {order.notes && (
                            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 italic">
                                "{order.notes}"
                            </div>
                        )}
                    </div>

                    {order.status === 'pending' && (
                        <button
                            onClick={handleReceiveOrder}
                            disabled={processing}
                            className="w-full py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                        >
                            {processing ? "Procesando..." : (
                                <>
                                    <CheckCircle2 size={20} /> Recibir Mercancía
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
