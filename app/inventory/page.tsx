"use client"

import { useState, useEffect } from "react"
import { Product } from "@/types"
import { ProductTable } from "@/components/inventory/ProductTable"
import { ProductForm } from "@/components/inventory/ProductForm"
import { ImportProductModal } from "@/components/inventory/ImportProductModal" // NEW
import { Modal } from "@/components/ui/Modal"
import { Plus, Tag, History, Upload, ClipboardCheck, ArrowDownToLine, Filter as FilterIcon } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { FloatingActionButton } from "@/components/ui/FloatingActionButton"
import { FilterChip } from "@/components/ui/FilterChip"
import { useTableFilters, Filter } from "@/hooks/useTableFilters"
import { exportInventoryExcel, exportInventoryPDF } from "@/utils/export"
import { useSettings } from "@/contexts/SettingsContext"

export default function InventoryPage() {
    const supabase = createClient()
    const { businessName, phoneNumber } = useSettings()
    const [products, setProducts] = useState<Product[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false) // NEW
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)

    // Quick Filters
    const inventoryFilters: Filter<Product>[] = [
        {
            id: 'low-stock',
            label: 'Stock Bajo',
            predicate: (p) => p.stock <= 5,
            color: 'danger'
        },
        {
            id: 'no-category',
            label: 'Sin Categoría',
            predicate: (p) => !p.category || p.category === '',
            color: 'warning'
        },
        {
            id: 'high-value',
            label: 'Alto Valor',
            predicate: (p) => p.priceUSD >= 100,
            color: 'success'
        },
        {
            id: 'out-of-stock',
            label: 'Agotado',
            predicate: (p) => p.stock === 0,
            color: 'danger'
        }
    ]

    const {
        filteredData,
        activeFilters,
        toggleFilter,
        clearFilters,
        getFilterCount,
        hasActiveFilters
    } = useTableFilters({ data: products, filters: inventoryFilters })

    const fetchProducts = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            if (error.code !== '20') { // 20 is 'AbortError' code usually, or check message
                console.error('Error fetching products:', JSON.stringify(error, null, 2))
            }
            // Check if error is RLS related or table missing
        } else if (data) {
            // Map snake_case to camelCase
            const mappedProducts: Product[] = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                sku: item.sku,
                stock: item.stock,
                costUSD: item.cost_usd,
                priceUSD: item.price_usd,
                category: item.category,
                createdAt: new Date(item.created_at),
                updatedAt: new Date(item.updated_at),
                description: item.description,
            }))
            setProducts(mappedProducts)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleCreate = () => {
        setEditingProduct(null)
        setIsModalOpen(true)
    }

    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este producto?")) {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)

            if (!error) {
                setProducts(products.filter(p => p.id !== id))
            } else {
                alert("Error al eliminar el producto")
                console.error(error)
            }
        }
    }

    const handleExport = (type: 'excel' | 'pdf') => {
        // Calculate Totals
        const totalItems = products.length
        const totalPurchase = products.reduce((sum, p) => sum + (p.stock * p.costUSD), 0)
        const estimatedValue = products.reduce((sum, p) => sum + (p.stock * p.priceUSD), 0)
        const difference = estimatedValue - totalPurchase // Potential Profit

        const exportData = products.map(p => ({
            Nombre: p.name,
            Categoria: p.category || '',
            SKU: p.sku || '',
            Stock: p.stock,
            Costo: p.costUSD,
            Precio: p.priceUSD,
            StockValue: p.stock * p.costUSD
        }))

        const companyInfo = { name: businessName, phone: phoneNumber }
        const filename = `inventario-${new Date().toISOString().split('T')[0]}`

        if (type === 'excel') {
            exportInventoryExcel(
                exportData,
                { totalItems, totalPurchase, estimatedValue, difference },
                companyInfo,
                `${filename}.xlsx`
            )
        } else {
            exportInventoryPDF(
                exportData,
                { totalItems, totalPurchase, estimatedValue, difference },
                companyInfo,
                `${filename}.pdf`
            )
        }
        setIsExportMenuOpen(false)
    }

    const handleFormSubmit = async (data: Partial<Product>) => {
        // Map camelCase to snake_case for DB
        const dbData = {
            name: data.name,
            sku: data.sku,
            stock: data.stock,
            cost_usd: data.costUSD,
            price_usd: data.priceUSD,
            category: data.category,
            updated_at: new Date(),
        }

        // Get User for logging
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id

        if (editingProduct) {
            // Update Metadata FIRST (excluding stock)
            const { stock, ...metaData } = dbData

            const { error: updateError } = await supabase
                .from('products')
                .update(metaData)
                .eq('id', editingProduct.id)

            if (updateError) {
                console.error(updateError)
                alert("Error al actualizar producto")
                return
            }

            // Update Stock ATOMICALLY via RPC if changed
            const oldStock = editingProduct.stock
            const newStock = Number(data.stock)
            const diff = newStock - oldStock

            if (diff !== 0) {
                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('update_stock', {
                        p_product_id: editingProduct.id,
                        p_quantity_change: diff,
                        p_user_id: userId,
                        p_reference: 'Ajuste Manual (Edición)',
                        p_notes: 'Actualización desde inventario'
                    })

                if (rpcError) {
                    console.error("Error updating stock RPC:", rpcError)
                    alert("Producto actualizado, PERO falló la actualización de stock.")
                } else if (!rpcData.success) {
                    alert(`Error de stock: ${rpcData.error}`)
                }
            }

            fetchProducts() // Refresh list
        } else {
            // Create
            const { data: newProds, error } = await supabase
                .from('products')
                .insert([{ ...dbData }]) // created_at defaults to now()
                .select()

            if (!error && newProds && newProds.length > 0) {
                const newProduct = newProds[0]
                // Log Initial Stock
                if (Number(data.stock) > 0) {
                    await supabase.from('stock_movements').insert({
                        product_id: newProduct.id,
                        type: 'IN',
                        quantity: Number(data.stock),
                        previous_stock: 0,
                        new_stock: Number(data.stock),
                        reference: 'Stock Inicial (Manual)',
                        user_id: userId,
                        unit_cost: Number(data.costUSD),
                        notes: 'Creación de producto'
                    })
                }

                fetchProducts()
            } else {
                console.error(error)
                alert("Error al crear producto")
            }
        }
        setIsModalOpen(false)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Inventario</h2>
                    <p className="text-slate-600">Gestiona tus productos y existencias.</p>
                </div>
                <div className="flex gap-2 p-1 overflow-x-auto pb-2 -mb-2 no-scrollbar scroll-smooth">
                    <Link
                        href="/inventory/categories"
                        className="shrink-0 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 transition-opacity shadow-sm hover:opacity-90"
                    >
                        <Tag className="mr-2 h-4 w-4" />
                        Categorías
                    </Link>
                    <Link
                        href="/inventory/movements"
                        className="shrink-0 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 transition-opacity shadow-sm hover:opacity-90"
                    >
                        <History className="mr-2 h-4 w-4" />
                        Kardex
                    </Link>
                    <Link
                        href="/inventory/audit"
                        className="shrink-0 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 transition-opacity shadow-sm hover:opacity-90"
                    >
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Auditoría
                    </Link>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="shrink-0 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 transition-opacity shadow-sm hover:opacity-90"
                    >
                        <ArrowDownToLine className="mr-2 h-4 w-4" />
                        Importar
                    </button>
                    <Link
                        href="/inventory/labels"
                        className="shrink-0 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 transition-opacity shadow-sm hover:opacity-90"
                    >
                        <Tag className="mr-2 h-4 w-4" />
                        Etiquetas
                    </Link>
                    {/* Export Dropdown */}
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            className="flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200 transition-opacity shadow-sm hover:opacity-90"
                        >
                            <Upload className="mr-2 h-4 w-4 rotate-180" />
                            Exportar
                        </button>

                        {isExportMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                    onClick={() => handleExport('excel')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <span className="text-green-600 font-bold text-xs uppercase w-8">XLS</span> Exportar Excel
                                </button>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <span className="text-red-600 font-bold text-xs uppercase w-8">PDF</span> Exportar PDF
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleCreate}
                        className="hidden md:flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity shadow-sm hover:opacity-90"
                        style={{ backgroundColor: 'var(--primary)' }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Quick Filters - Desktop Only */}
                    <div className="hidden md:flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <FilterIcon size={16} className="text-slate-500" />
                            Filtros:
                        </div>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {inventoryFilters.map(filter => (
                                <FilterChip
                                    key={filter.id}
                                    label={filter.label}
                                    active={activeFilters.has(filter.id)}
                                    onClick={() => toggleFilter(filter.id)}
                                    count={getFilterCount(filter.id)}
                                    color={filter.color}
                                />
                            ))}
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                            >
                                Limpiar
                            </button>
                        )}
                        <div className="text-sm text-slate-500">
                            {filteredData.length} de {products.length}
                        </div>
                    </div>

                    <ProductTable
                        products={filteredData}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
            >
                <ProductForm
                    initialData={editingProduct}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            <ImportProductModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    fetchProducts() // Refresh list after import
                    alert("Importación exitosa")
                }}
            />

            {/* Mobile FAB */}
            <FloatingActionButton
                onClick={handleCreate}
                icon={Plus}
                label="Nuevo"
            />
        </div>
    )
}
