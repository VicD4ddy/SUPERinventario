
import { Search, Plus } from "lucide-react"
import { Product } from "@/types"

interface ProductSearchProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    products: Product[]
    onAddToCart: (product: Product) => void
}

export function ProductSearch({ searchTerm, onSearchChange, products, onAddToCart }: ProductSearchProps) {
    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
                <div className="relative">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 cursor-pointer hover:text-slate-700 transition-colors"
                        onClick={() => onSearchChange("")}
                    />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, SKU o Barcode..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onClick={() => onSearchChange("")}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm text-slate-900 placeholder:text-slate-500 font-medium"
                        autoFocus
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {products.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        {searchTerm ? "No se encontraron productos." : "Comienza a buscar para agregar al carrito."}
                    </div>
                ) : (
                    products.map((product) => (
                        <div
                            key={product.id}
                            onClick={() => product.stock > 0 && onAddToCart(product)}
                            className={`flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-[var(--primary)] transition-colors cursor-pointer ${product.stock === 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                            style={{ '--hover-bg': 'rgba(var(--primary-rgb), 0.05)' } as React.CSSProperties}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(var(--primary-rgb), 0.05)'} // fallback or use opacity
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                        >
                            <div>
                                <h4 className="font-medium text-slate-900">{product.name}</h4>
                                <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-slate-900">${product.priceUSD.toFixed(2)}</div>
                                <div className="text-xs text-slate-500">Stock: {product.stock}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
