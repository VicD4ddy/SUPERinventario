
interface TopProduct {
    id: string
    name: string
    quantity: number
    totalRevenue: number
}

interface TopProductsProps {
    products: TopProduct[]
}

export function TopProducts({ products }: TopProductsProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Productos Más Vendidos</h3>
            <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead>
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Producto</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Cant.</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-3 py-4 text-center text-sm text-slate-500">
                                    Sin datos.
                                </td>
                            </tr>
                        ) : (
                            products.slice(0, 5).map((product) => (
                                <tr key={product.id}>
                                    <td className="px-3 py-3 text-sm font-medium text-slate-900 truncate max-w-[150px]">
                                        {product.name}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-slate-600 text-right">
                                        {product.quantity}
                                    </td>
                                    <td className="px-3 py-3 text-sm font-semibold text-indigo-600 text-right">
                                        ${product.totalRevenue.toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
