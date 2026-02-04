"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Product } from "@/types"
import { useCart } from "@/contexts/CartContext"

export default function ShopPage() {
    const supabase = createClient()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const { addItem } = useCart()

    useEffect(() => {
        async function loadProducts() {
            setLoading(true)
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .gt('stock', 0) // Only show items in stock
                .order('name')

            if (data) {
                // Map snake_case to camelCase
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
                    description: item.description,
                }))
                setProducts(mapped)
            } else if (error) {
                console.error("Error loading products:", error)
            }
            setLoading(false)
        }
        loadProducts()
    }, [])

    const [selectedCategory, setSelectedCategory] = useState("Todos")

    // Extract categories
    const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category || "Sin Categoría"))).filter(Boolean)]

    const filteredProducts = selectedCategory === "Todos"
        ? products
        : products.filter(p => (p.category || "Sin Categoría") === selectedCategory)

    return (
        <div className="container px-4 md:px-6 py-8">
            <section className="mb-12 text-center space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Nuestros Productos
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Explora nuestra selección de productos de alta calidad. Haz tu pedido y te contactaremos por WhatsApp.
                </p>

                {/* Category Filter */}
                {!loading && categories.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-8">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat
                                        ? 'text-white shadow-md'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                style={selectedCategory === cat ? { backgroundColor: 'var(--primary)' } : {}}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <div key={n} className="h-80 bg-slate-200 animate-pulse rounded-xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-slate-100 flex flex-col">
                            {/* Placeholder Image */}
                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-4xl font-bold bg-slate-50">
                                        {product.name.charAt(0)}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-900 group-hover:text-[var(--primary)] transition-colors line-clamp-1">{product.name}</h3>
                                    {product.stock <= 5 && (
                                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                            Quedan {product.stock}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{product.description || "Sin descripción"}</p>

                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-lg font-bold text-slate-900">${product.priceUSD.toFixed(2)}</span>
                                    <button
                                        onClick={() => addItem(product)}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-95"
                                        style={{ backgroundColor: 'var(--primary)' }}
                                    >
                                        Agregar +
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
