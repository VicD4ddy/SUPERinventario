"use client"

import { Medal } from "lucide-react"

interface TopProductsProps {
    products: {
        name: string
        quantity: number
        total: number
    }[]
}

export function TopProducts({ products }: TopProductsProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Productos Más Vendidos</h3>
                <Medal className="h-5 w-5 text-amber-500" />
            </div>

            <div className="space-y-4">
                {products.length === 0 ? (
                    <div className="text-center text-slate-400 py-4">No hay datos suficientes</div>
                ) : (
                    products.map((product, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`
                                    flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold
                                    ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                        index === 1 ? 'bg-slate-200 text-slate-700' :
                                            index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-50 text-slate-500'}
                                `}>
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 line-clamp-1">{product.name}</p>
                                    <p className="text-xs text-slate-500">{product.quantity} unidades</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-900">${product.total.toFixed(2)}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
