"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Supplier, Product } from "@/types"
import { ArrowLeft, Save, Plus, Trash2, Search, Package } from "lucide-react"
import Link from "next/link"

interface PurchaseItemInput {
    productId: string
    quantity: number
    unitCost: number
    productName: string // For display
    stock: number // For reference
}

export default function NewPurchasePage() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Form State
    const [supplierId, setSupplierId] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [paymentDueDate, setPaymentDueDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() + 15) // Default 15 days
        return d.toISOString().split('T')[0]
    })
    const [notes, setNotes] = useState("")
    const [items, setItems] = useState<PurchaseItemInput[]>([])

    // Data Sources
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [products, setProducts] = useState<Product[]>([])

    // Product Search Modal/Autocomplete
    const [productSearch, setProductSearch] = useState("")
    const [showProductSearch, setShowProductSearch] = useState(false)

    useEffect(() => {
        async function loadData() {
            const [supRes, prodRes] = await Promise.all([
                supabase.from('suppliers').select('*').order('name'),
                supabase.from('products').select('*').order('name')
            ])

            if (supRes.data) {
                setSuppliers(supRes.data.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    createdAt: new Date(s.created_at)
                })))
            }

            if (prodRes.data) {
                setProducts(prodRes.data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    stock: p.stock,
                    costUSD: p.cost_usd,
                    priceUSD: p.price_usd,
                    createdAt: new Date(p.created_at),
                    updatedAt: new Date(p.updated_at)
                })))
            }
        }
        loadData()
    }, [])

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
    )

    const handleAddProduct = (product: Product) => {
        const existing = items.find(i => i.productId === product.id)
        if (existing) {
            alert("El producto ya está en la lista")
            return
        }

        setItems([...items, {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitCost: product.costUSD || 0,
            stock: product.stock
        }])
        setShowProductSearch(false)
        setProductSearch("")
    }

    const handleUpdateItem = (index: number, field: keyof PurchaseItemInput, value: number) => {
        const newItems = [...items]
        // @ts-ignore
        newItems[index][field] = value
        setItems(newItems)
    }

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)

    const handleSubmit = async (status: 'pending' | 'received') => {
        if (!supplierId) return alert("Selecciona un proveedor")
        if (items.length === 0) return alert("Agrega al menos un producto")
        if (!confirm(`¿Confirmar orden como ${status === 'received' ? 'RECIBIDA (Afectará Stock)' : 'PENDIENTE'}?`)) return

        setLoading(true)
        try {
            // 1. Create Purchase Order
            const { data: order, error: orderError } = await supabase
                .from('purchase_orders')
                .insert([{
                    supplier_id: supplierId,
                    date: date,
                    payment_due_date: paymentDueDate,
                    status: status,
                    total_amount: totalAmount,
                    notes: notes
                }])
                .select()
                .single()

            if (orderError) throw orderError

            // 2. Create Items
            const itemsData = items.map(item => ({
                purchase_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_cost: item.unitCost
            }))

            const { error: itemsError } = await supabase
                .from('purchase_items')
                .insert(itemsData)

            if (itemsError) throw itemsError

            // 3. If Received, Update Stock & Costs
            if (status === 'received') {
                for (const item of items) {
                    // Update Product Stock & Cost
                    // We also Record a Stock Movement
                    await supabase.from('products')
                        .update({
                            stock: item.stock + item.quantity,
                            cost_usd: item.unitCost, // Update cost to latest purchase price
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', item.productId)

                    await supabase.from('stock_movements').insert([{
                        product_id: item.productId,
                        type: 'PURCHASE',
                        quantity: item.quantity,
                        previous_stock: item.stock,
                        new_stock: item.stock + item.quantity,
                        reference: `Compra #${order.id.slice(0, 8)}`,
                        created_at: new Date().toISOString()
                    }])
                }
            }

            router.push('/purchases')
        } catch (error: any) {
            console.error(error)
            alert("Error al guardar la orden: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/purchases" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft size={20} />
                </Link>
                <h2 className="text-2xl font-bold text-slate-900">Nueva Orden de Compra</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="md:col-span-2 space-y-6">
                    {/* Products List */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-slate-900">Productos</h3>
                            <button
                                onClick={() => setShowProductSearch(true)}
                                className="text-sm text-indigo-600 font-medium flex items-center gap-1 hover:underline"
                            >
                                <Plus size={16} /> Agregar Producto
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p>No hay productos en la orden</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {items.map((item, index) => (
                                    <div key={item.productId} className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-900">{item.productName}</div>
                                            <div className="text-xs text-slate-500">Stock actual: {item.stock}</div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Cant.</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={e => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-center font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Costo ($)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitCost}
                                                    onChange={e => handleUpdateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                                    className="w-24 px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-center font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div className="text-right w-20">
                                                <label className="block text-xs text-slate-500 mb-1">Total</label>
                                                <div className="text-sm font-bold text-slate-900">
                                                    ${(item.quantity * item.unitCost).toFixed(2)}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(index)}
                                                className="text-slate-400 hover:text-red-600"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Totals Footer */}
                        {items.length > 0 && (
                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">Total Orden</div>
                                    <div className="text-2xl font-black text-slate-900">
                                        ${totalAmount.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
                        <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Información</h3>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Proveedor *</label>
                            <select
                                value={supplierId}
                                onChange={e => setSupplierId(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                            >
                                <option value="">Seleccionar...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha Emisión</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-red-500 mb-1">Fecha Vencimiento (Pago)</label>
                            <input
                                type="date"
                                value={paymentDueDate}
                                onChange={e => setPaymentDueDate(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-red-200 bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Notas</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none text-slate-900 placeholder:text-slate-400"
                                placeholder="Notas internas..."
                            />
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <button
                            onClick={() => handleSubmit('pending')}
                            disabled={loading || items.length === 0}
                            className="w-full py-3 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-xl font-bold transition-colors shadow-sm"
                        >
                            Guardar como Pendiente
                        </button>
                        <button
                            onClick={() => handleSubmit('received')}
                            disabled={loading || items.length === 0}
                            className="w-full py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-200"
                        >
                            {loading ? "Procesando..." : "Recibir e Ingresar Stock"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Search Modal Overlay */}
            {showProductSearch && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm" onClick={() => setShowProductSearch(false)}>
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar producto..."
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                                className="w-full text-lg outline-none placeholder:text-slate-300 text-slate-900"
                            />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => handleAddProduct(product)}
                                    className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 transition-colors flex justify-between items-center group"
                                >
                                    <div>
                                        <div className="font-medium text-slate-900">{product.name}</div>
                                        <div className="text-xs text-slate-500">Exp: {product.stock} | Costo: ${product.costUSD}</div>
                                    </div>
                                    <Plus size={18} className="text-slate-300 group-hover:text-indigo-600" />
                                </button>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-sm">No se encontraron productos</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
