"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Sparkles, Plus, Loader2 } from "lucide-react"

interface RecommendedProduct {
    id: string
    name: string
    price_usd: number
    image_url: string | null
    stock: number
    frequency: number
}

interface RecommendationCarouselProps {
    cartProductIds: string[]
    onAdd: (product: any) => void
}

export function RecommendationCarousel({ cartProductIds, onAdd }: RecommendationCarouselProps) {
    const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        // Debounce fetching to avoid spamming while typing/scanning
        const fetchRecommendations = async () => {
            if (cartProductIds.length === 0) {
                // Optional: Don't show anything empty, or show trending?
                // RPC handles empty array by showing trending, so let's fetch
            }

            setLoading(true)
            const { data, error } = await supabase.rpc('get_pos_recommendations', {
                p_cart_product_ids: cartProductIds
            })

            if (data) setRecommendations(data)
            setLoading(false)
        }

        const timeoutId = setTimeout(fetchRecommendations, 500)
        return () => clearTimeout(timeoutId)
    }, [cartProductIds]) // Deep comparison might be needed if array ref changes often, but simplified here

    if (recommendations.length === 0 && !loading) return null

    return (
        <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 mb-3 px-1">
                <Sparkles size={16} className="text-purple-600" />
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {cartProductIds.length === 0 ? "Tendencias" : "Sugerencias Smart"}
                </h4>
            </div>

            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-slate-300" size={20} />
                </div>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 px-1 custom-scrollbar snap-x">
                    {recommendations.map((product) => (
                        <div
                            key={product.id}
                            className="flex-shrink-0 w-32 bg-white border border-slate-200 rounded-lg p-2 shadow-sm snap-start flex flex-col items-center text-center relative group hover:border-purple-300 transition-colors"
                        >
                            <div className="w-12 h-12 bg-slate-50 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-slate-300">Img</span>
                                )}
                            </div>

                            <h5 className="text-xs font-medium text-slate-800 line-clamp-2 h-8 leading-tight w-full">
                                {product.name}
                            </h5>

                            <div className="mt-1 text-xs text-slate-500 mb-2">
                                ${product.price_usd}
                            </div>

                            <button
                                onClick={() => onAdd(product)}
                                className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold py-1 rounded flex items-center justify-center gap-1 transition-colors"
                            >
                                <Plus size={12} />
                                Agregar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
