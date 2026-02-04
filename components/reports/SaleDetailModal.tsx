
import { Sale, SaleItem } from "@/types"
import { X, Calendar, User, Receipt, DollarSign, Printer } from "lucide-react"

interface SaleDetailModalProps {
    sale: Sale | null
    isOpen: boolean
    onClose: () => void
}

export function SaleDetailModal({ sale, isOpen, onClose }: SaleDetailModalProps) {
    if (!isOpen || !sale) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden scale-100 transition-all flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Receipt style={{ color: 'var(--primary)' }} />
                            Detalle de Venta
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">ID: {sale.id.slice(0, 8)}...</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg p-1 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Meta Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border" style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.05)', borderColor: 'rgba(var(--primary-rgb), 0.2)' }}>
                            <div className="flex items-center gap-2 font-medium mb-1" style={{ color: 'var(--primary)' }}>
                                <Calendar size={16} /> Fecha
                            </div>
                            <div className="text-slate-900 font-semibold">
                                {new Date(sale.date).toLocaleDateString("es-VE")}
                            </div>
                            <div className="text-xs text-slate-500">
                                {new Date(sale.date).toLocaleTimeString("es-VE")}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-600 font-medium mb-1">
                                <User size={16} /> Cliente
                            </div>
                            <div className="text-slate-900 font-semibold truncate">
                                {sale.customerName || "Cliente General"}
                            </div>
                            <div className="text-xs text-slate-500">
                                {sale.customerPhone || "Sin teléfono"}
                            </div>
                        </div>

                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-2 text-emerald-700 font-medium mb-1">
                                <DollarSign size={16} /> Total USD
                            </div>
                            <div className="text-emerald-900 font-bold text-lg">
                                ${sale.totalUSD.toFixed(2)}
                            </div>
                            <div className="text-xs text-emerald-600">
                                Tasa: {sale.exchangeRate.toFixed(2)} Bs/$
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Productos</h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-2">Producto</th>
                                        <th className="px-4 py-2 text-right">Cant.</th>
                                        <th className="px-4 py-2 text-right">Precio Unit.</th>
                                        <th className="px-4 py-2 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sale.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2 font-medium text-slate-900">{item.productName}</td>
                                            <td className="px-4 py-2 text-right text-slate-600">{item.quantity}</td>
                                            <td className="px-4 py-2 text-right text-slate-600">
                                                <div>${(item.priceAtSale || 0).toFixed(2)}</div>
                                                <div className="text-xs text-slate-400">
                                                    {((item.priceAtSale || 0) * sale.exchangeRate).toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-right font-semibold text-slate-900">
                                                <div>${(item.quantity * (item.priceAtSale || 0)).toFixed(2)}</div>
                                                <div className="text-xs text-slate-500 font-normal">
                                                    {((item.quantity * (item.priceAtSale || 0)) * sale.exchangeRate).toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Totals */}
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <div className="text-right space-y-1">
                            <div className="text-sm text-slate-500">Total en Bolívares</div>
                            <div className="text-2xl font-black text-slate-900">
                                {sale.totalVES.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs
                            </div>
                        </div>
                    </div>
                    {/* Mixed Payment Details */}
                    {sale.paymentDetails && Object.keys(sale.paymentDetails).length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Desglose de Pago</h3>
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
                                {Object.entries(sale.paymentDetails).map(([key, value]) => {
                                    if (value <= 0) return null;
                                    let label = key;
                                    if (key === 'cash_usd') label = 'Efectivo USD';
                                    if (key === 'zelle') label = 'Zelle';
                                    if (key === 'pago_movil') label = 'Pago Móvil';
                                    if (key === 'cash_ves') label = 'Efectivo Bs';
                                    if (key === 'point') label = 'Punto de Venta';

                                    const isVes = ['pago_movil', 'cash_ves', 'point', 'transfer', 'biopago'].includes(key);

                                    // Heuristic for bug fix: If value is ~equal to totalUSD, it was likely stored as USD but tagged as VES method
                                    const valDiffTotal = Math.abs(value - sale.totalUSD);
                                    const valDiffPaid = Math.abs(value - (sale.amountPaidUSD || 0));
                                    const isLikelyUSD = isVes && (valDiffTotal < 0.5 || (sale.amountPaidUSD && valDiffPaid < 0.5));

                                    let displayValue = value;
                                    let displayUSD = 0;

                                    if (isLikelyUSD) {
                                        // It's actually USD stored in a VES field
                                        displayUSD = value;
                                        displayValue = value * sale.exchangeRate;
                                    } else {
                                        // Normal VES
                                        displayValue = value;
                                        displayUSD = value / (sale.exchangeRate || 1);
                                    }

                                    return (
                                        <div key={key} className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600 font-medium">{label}</span>
                                            <div className="text-right">
                                                <span className="font-semibold text-slate-900">
                                                    {isVes
                                                        ? `${displayValue.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs`
                                                        : `$${value.toFixed(2)}`
                                                    }
                                                </span>
                                                {isVes && (
                                                    <span className="text-xs text-slate-400 ml-1">
                                                        (${displayUSD.toFixed(2)})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="bg-slate-50 p-4 flex justify-end gap-3 shrink-0 border-t border-slate-100">
                    <button
                        onClick={() => {
                            import('@/utils/pdfGenerator').then(mod => {
                                if (sale) mod.generateSaleReceipt(sale)
                            })
                        }}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <Printer size={16} />
                        Imprimir Recibo
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-white rounded-lg font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: 'var(--primary)' }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}
