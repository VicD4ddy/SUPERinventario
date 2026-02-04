"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Product, StockMovement } from "@/types"
import { Save, AlertTriangle, ArrowLeft, Search, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function InventoryAuditPage() {
    const supabase = createClient()
    const router = useRouter()

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // Map of productId -> physical count
    const [counts, setCounts] = useState<Record<string, number>>({})

    // Filtered products
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

    // Audit Note
    const [auditNote, setAuditNote] = useState("")

    useEffect(() => {
        fetchProducts()
    }, [])

    useEffect(() => {
        if (!searchTerm) {
            setFilteredProducts(products)
        } else {
            const lower = searchTerm.toLowerCase()
            setFilteredProducts(products.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                (p.sku && p.sku.toLowerCase().includes(lower))
            ))
        }
    }, [searchTerm, products])

    async function fetchProducts() {
        setLoading(true)
        const { data } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true })

        if (data) {
            const mapped: Product[] = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                sku: item.sku,
                stock: item.stock,
                costUSD: item.cost_usd,
                priceUSD: item.price_usd,
                category: item.category,
                createdAt: new Date(item.created_at),
                updatedAt: new Date(item.updated_at),
            }))
            setProducts(mapped)
            setFilteredProducts(mapped)
        }
        setLoading(false)
    }

    const handleCountChange = (productId: string, value: string) => {
        const val = parseInt(value)
        if (!isNaN(val)) {
            setCounts(prev => ({ ...prev, [productId]: val }))
        } else if (value === '') {
            setCounts(prev => {
                const next = { ...prev }
                delete next[productId]
                return next
            })
        }
    }

    const getDiscrepancy = (product: Product) => {
        const physical = counts[product.id]
        if (physical === undefined) return 0
        return physical - product.stock
    }

    const handleSaveAudit = async () => {
        // 1. Identify changes
        const changes = products.filter(p => counts[p.id] !== undefined && counts[p.id] !== p.stock)

        if (changes.length === 0) {
            alert("No hay diferencias registradas para guardar.")
            return
        }

        if (!confirm(`Se van a actualizar ${changes.length} productos. ¿Continuar?`)) return

        setSaving(true)

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            const auditRef = `AUDIT-${new Date().toISOString().split('T')[0]}`

            for (const p of changes) {
                const newStock = counts[p.id]
                const diff = newStock - p.stock

                // Update Product
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ stock: newStock, updated_at: new Date() })
                    .eq('id', p.id)

                if (updateError) {
                    console.error("Error updating product:", updateError)
                    throw updateError
                }

                // Log Movement
                const movementData: any = {
                    product_id: p.id,
                    type: 'ADJUSTMENT',
                    quantity: diff,
                    previous_stock: p.stock,
                    new_stock: newStock,
                    reference: auditRef,
                    user_id: user?.id,
                    unit_cost: p.costUSD,
                    notes: auditNote || "Ajuste de inventario manual"
                }

                const { error: moveError } = await supabase
                    .from('stock_movements')
                    .insert(movementData)

                if (moveError) {
                    console.error("Error creating movement:", moveError)
                    throw moveError
                }
            }

            alert("Auditoría guardada exitosamente.")
            router.push('/inventory')

        } catch (error) {
            console.error("Audit Save Failed:", error)
            alert("Ocurrió un error al guardar la auditoría. Revisa la consola.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/inventory" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-500" />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Toma de Inventario</h2>
                        <p className="text-slate-600">Ajusta el stock real. Los cambios se registrarán como "ADJUSTMENT".</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Nota opcional (ej. Auditoría Mensual)"
                        value={auditNote}
                        onChange={e => setAuditNote(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--primary)] outline-none"
                    />
                    <button
                        onClick={handleSaveAudit}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 min-w-[140px]"
                    >
                        {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                        Finalizar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Cargando inventario...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Producto</th>
                                    <th className="px-6 py-4 text-center">Stock Sistema</th>
                                    <th className="px-6 py-4 text-center w-32">Físico</th>
                                    <th className="px-6 py-4 text-center">Diferencia</th>
                                    <th className="px-6 py-4 text-right">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.map(product => {
                                    const physical = counts[product.id]
                                    const hasEntry = physical !== undefined
                                    const diff = hasEntry ? physical - product.stock : 0
                                    const isMatch = hasEntry && diff === 0
                                    const isDiscrepancy = hasEntry && diff !== 0

                                    return (
                                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{product.name}</div>
                                                <div className="text-xs text-slate-500">SKU: {product.sku || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium text-slate-700">
                                                {product.stock}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="-"
                                                    className={`w-20 text-center border rounded py-1 px-2 focus:ring-2 outline-none transition-colors ${isDiscrepancy
                                                        ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-200'
                                                        : isMatch
                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 focus:ring-emerald-200'
                                                            : 'border-slate-200 focus:ring-indigo-200'
                                                        }`}
                                                    value={physical ?? ''}
                                                    onChange={e => handleCountChange(product.id, e.target.value)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold">
                                                {hasEntry ? (
                                                    <span className={diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                        {diff > 0 ? `+${diff}` : diff}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {hasEntry ? (
                                                    diff === 0 ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                                                            <CheckCircle size={12} /> Correcto
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded-full">
                                                            <AlertTriangle size={12} /> Ajuste
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-slate-400">Pendiente</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-slate-500">
                                            No se encontraron productos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
