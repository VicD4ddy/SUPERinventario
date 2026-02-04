"use client"

import { Product } from "@/types"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { useSortableTable } from "@/hooks/useSortableTable"
import { SortableHeader } from "@/components/ui/SortableHeader"
import { Edit, Trash2, Tag, Box } from "lucide-react"

interface ProductTableProps {
    products: Product[]
    onEdit: (product: Product) => void
    onDelete: (id: string) => void
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
    const { rate } = useExchangeRate()
    const { sortedData, sortKey, sortDirection, handleSort } = useSortableTable({
        data: products,
        initialSortKey: 'name'
    })

    if (products.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                <Box className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No hay productos</h3>
                <p className="mt-1 text-sm text-slate-500">Agrega productos para verlos aquí.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <SortableHeader
                                label="Producto"
                                sortKey="name"
                                currentSortKey={sortKey as string}
                                currentDirection={sortDirection}
                                onSort={handleSort as (key: string) => void}
                            />
                            <SortableHeader
                                label="SKU"
                                sortKey="sku"
                                currentSortKey={sortKey as string}
                                currentDirection={sortDirection}
                                onSort={handleSort as (key: string) => void}
                            />
                            <SortableHeader
                                label="Categoría"
                                sortKey="category"
                                currentSortKey={sortKey as string}
                                currentDirection={sortDirection}
                                onSort={handleSort as (key: string) => void}
                            />
                            <SortableHeader
                                label="Stock"
                                sortKey="stock"
                                currentSortKey={sortKey as string}
                                currentDirection={sortDirection}
                                onSort={handleSort as (key: string) => void}
                            />
                            <SortableHeader
                                label="Costo ($)"
                                sortKey="costUSD"
                                currentSortKey={sortKey as string}
                                currentDirection={sortDirection}
                                onSort={handleSort as (key: string) => void}
                            />
                            <SortableHeader
                                label="Precio ($)"
                                sortKey="priceUSD"
                                currentSortKey={sortKey as string}
                                currentDirection={sortDirection}
                                onSort={handleSort as (key: string) => void}
                            />
                            <th className="px-6 py-4 text-xs uppercase tracking-wider font-semibold text-slate-500" style={{ color: 'var(--primary)' }}>Precio (Bs)</th>
                            <th className="px-6 py-4 text-xs uppercase tracking-wider font-semibold text-slate-500 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {sortedData.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                                <td className="px-6 py-4">{product.sku}</td>
                                <td className="px-6 py-4">
                                    {product.category ? (
                                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                            {product.category}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic">Sin categoría</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.stock > 10 ? "bg-emerald-100 text-emerald-800" :
                                        product.stock >= 5 ? "bg-amber-100 text-amber-800" :
                                            "bg-red-100 text-red-800 animate-pulse font-bold"
                                        }`}>
                                        {product.stock}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">${product.costUSD.toFixed(2)}</td>
                                <td className="px-6 py-4 font-semibold text-slate-900">${product.priceUSD.toFixed(2)}</td>
                                <td className="px-6 py-4 font-bold" style={{ color: 'var(--primary)' }}>
                                    {(product.priceUSD * rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => onEdit(product)}
                                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                                            style={{ '--hover-color': 'var(--primary)' } as React.CSSProperties}
                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = ''}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(product.id)}
                                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-3">
                                <h3 className="font-bold text-slate-900 text-lg leading-snug break-words">{product.name}</h3>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded-md border border-slate-200">{product.sku}</span>
                                    {product.category && (
                                        <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 font-medium">
                                            <Tag size={10} /> {product.category}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${product.stock > 10 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                product.stock >= 5 ? "bg-amber-50 text-amber-700 border-amber-100" :
                                    "bg-red-50 text-red-700 border-red-100 animate-pulse"
                                }`}>
                                Stock: {product.stock}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-sm">
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Costo</span>
                                <span className="font-semibold text-slate-600">${product.costUSD.toFixed(1)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center border-l border-slate-200/60">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Precio $</span>
                                <span className="font-bold text-slate-800 text-lg">${product.priceUSD.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center border-l border-slate-200/60">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Precio Bs</span>
                                <span className="font-bold text-blue-600">
                                    {(product.priceUSD * rate).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => onEdit(product)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
                            >
                                <Edit size={16} /> Editar
                            </button>
                            <button
                                onClick={() => onDelete(product.id)}
                                className="flex items-center justify-center w-12 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-100 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
