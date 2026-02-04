"use client"

import { Sale, SaleItem } from "@/types"
import { Eye, FileText, Printer } from "lucide-react"

interface SalesHistoryTableProps {
    sales: Sale[]
    onViewDetail: (sale: Sale) => void
    loading?: boolean
    page?: number
    totalPages?: number
    onPageChange?: (page: number) => void
}

export function SalesHistoryTable({
    sales,
    onViewDetail,
    loading,
    page = 1,
    totalPages = 1,
    onPageChange
}: SalesHistoryTableProps) {

    // Helper: Render Payment Method Badge
    const renderPaymentBadge = (sale: Sale) => {
        // Robust check for mixed payment
        const isMixed = sale.paymentMethod === 'mixed' ||
            (sale.paymentDetails && (
                Object.keys(sale.paymentDetails).length > 1 ||
                'cash_usd' in sale.paymentDetails ||
                'cash_ves' in sale.paymentDetails ||
                'point' in sale.paymentDetails
            ));

        const className = isMixed ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100' :
            sale.paymentMethod === 'zelle' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                sale.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    sale.paymentMethod === 'pago_movil' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        sale.paymentMethod === 'transfer' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            (sale.paymentMethod === 'point' || sale.paymentMethod === 'Point') ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                                'bg-slate-50 text-slate-700 border-slate-200';

        const label = isMixed ? 'Mixto' :
            sale.paymentMethod === 'pago_movil' ? 'Pago Móvil' :
                sale.paymentMethod === 'cash' ? 'Efectivo' :
                    sale.paymentMethod === 'transfer' ? 'Transferencia' :
                        (sale.paymentMethod === 'point' || sale.paymentMethod === 'Point') ? 'Punto de Venta' :
                            sale.paymentMethod || 'Efectivo';

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize border ${className}`}>
                {label}
            </span>
        )
    }

    // Helper: Render Status Badge
    const renderStatusBadge = (sale: Sale) => {
        if (sale.type === 'payment') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Pago Recibido
                </span>
            )
        }

        if (sale.paymentStatus === 'pending') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Crédito
                </span>
            )
        }

        if (sale.paymentStatus === 'partial' && (sale.amountPaidUSD || 0) < (sale.totalUSD - 0.01)) {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    Abono
                </span>
            )
        }

        // Treat 'partial' as 'paid' if amount is within epsilon of total, or explicity 'paid'
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                Pagado
            </span>
        )
    }

    if (sales.length === 0 && !loading) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No hay ventas registradas</h3>
                <p className="mt-1 text-sm text-slate-500">Las ventas que realices aparecerán aquí.</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 animate-pulse">
                <div className="h-8 w-8 bg-slate-200 rounded-full mx-auto mb-4"></div>
                <div className="h-4 w-32 bg-slate-200 rounded mx-auto"></div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Fecha</th>
                            <th className="px-6 py-3 font-semibold">Cliente</th>
                            <th className="px-6 py-3 font-semibold text-center">Método</th>
                            <th className="px-6 py-3 font-semibold text-center">Estado</th>
                            <th className="px-6 py-3 font-semibold text-right">Total ($)</th>
                            <th className="px-6 py-3 font-semibold text-right">Abonado ($)</th>
                            <th className="px-6 py-3 font-semibold text-right">Debe ($)</th>
                            <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3 whitespace-nowrap">
                                    {new Date(sale.date).toLocaleDateString("es-VE", {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                                <td className="px-6 py-3 font-medium text-slate-900">
                                    {sale.customerName || "Cliente General"}
                                    {sale.customerPhone && (
                                        <span className="block text-xs text-slate-400 font-normal">{sale.customerPhone}</span>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    {renderPaymentBadge(sale)}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    {renderStatusBadge(sale)}
                                </td>

                                {/* Total Column */}
                                <td className="px-6 py-3 text-right font-semibold text-slate-700">
                                    {sale.type === 'sale' ? `$${sale.totalUSD.toFixed(2)}` : '-'}
                                </td>

                                {/* Abonado Column */}
                                <td className="px-6 py-3 text-right font-medium text-emerald-600">
                                    {sale.type === 'sale'
                                        ? `$${(sale.amountPaidUSD || 0).toFixed(2)}`
                                        : `$${sale.totalUSD.toFixed(2)}` // For payments, totalUSD is the amount paid
                                    }
                                </td>

                                {/* Debe Column */}
                                <td className="px-6 py-3 text-right font-medium text-red-600">
                                    {sale.type === 'sale' ? (
                                        (sale.totalUSD - (sale.amountPaidUSD || 0)) > 0
                                            ? `$${(sale.totalUSD - (sale.amountPaidUSD || 0)).toFixed(2)}`
                                            : <span className="text-slate-300">-</span>
                                    ) : (
                                        sale.customerDebt !== undefined && sale.customerDebt > 0
                                            ? `$${sale.customerDebt.toFixed(2)}`
                                            : <span className="text-slate-300">-</span>
                                    )}
                                </td>

                                <td className="px-6 py-3 text-right">
                                    {sale.type === 'sale' && (
                                        <button
                                            onClick={() => onViewDetail(sale)}
                                            className="text-indigo-600 hover:text-indigo-900 font-medium inline-flex items-center gap-1 hover:underline"
                                        >
                                            <Eye size={16} /> Ver
                                        </button>
                                    )}
                                    {sale.type === 'payment' && sale.note && (
                                        <span className="text-xs text-slate-400 italic">
                                            {sale.note}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {sales.map((sale) => (
                    <div key={sale.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        {/* Decorative side bar based on status */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1 ${sale.paymentStatus === 'paid' ? 'bg-emerald-500' :
                                sale.paymentStatus === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />

                        <div className="pl-3">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold text-slate-900 text-lg">{sale.customerName || "Cliente General"}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                                            {new Date(sale.date).toLocaleDateString("es-VE", {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {renderStatusBadge(sale)}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 mb-4 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">Método:</span>
                                    {renderPaymentBadge(sale)}
                                </div>
                                {sale.type === 'payment' && sale.note && (
                                    <span className="italic truncate max-w-[120px] text-slate-400">"{sale.note}"</span>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="flex flex-col bg-slate-50 p-2 rounded-lg items-center justify-center">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                                    <span className="font-bold text-slate-800 text-lg">
                                        {sale.type === 'sale' ? `$${sale.totalUSD.toFixed(2)}` : '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col bg-emerald-50/50 p-2 rounded-lg items-center justify-center border border-emerald-100">
                                    <span className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-wider">Pagado</span>
                                    <span className="font-bold text-emerald-700 text-lg">
                                        {sale.type === 'sale'
                                            ? `$${(sale.amountPaidUSD || 0).toFixed(2)}`
                                            : `$${sale.totalUSD.toFixed(2)}`
                                        }
                                    </span>
                                </div>
                                <div className="flex flex-col bg-red-50/50 p-2 rounded-lg items-center justify-center border border-red-100">
                                    <span className="text-[10px] text-red-600/70 font-bold uppercase tracking-wider">Debe</span>
                                    <span className="font-bold text-red-700 text-lg">
                                        {sale.type === 'sale' ? (
                                            (sale.totalUSD - (sale.amountPaidUSD || 0)) > 0
                                                ? `$${(sale.totalUSD - (sale.amountPaidUSD || 0)).toFixed(2)}`
                                                : '-'
                                        ) : (
                                            sale.customerDebt !== undefined && sale.customerDebt > 0
                                                ? `$${sale.customerDebt.toFixed(2)}`
                                                : '-'
                                        )}
                                    </span>
                                </div>
                            </div>

                            {sale.type === 'sale' && (
                                <button
                                    onClick={() => onViewDetail(sale)}
                                    className="w-full mt-4 py-2.5 flex items-center justify-center gap-2 text-white bg-slate-900 overflow-hidden relative rounded-xl text-sm font-semibold active:scale-[0.98] transition-all shadow-lg shadow-slate-900/10 group"
                                >
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                                    <Eye size={18} /> Ver Detalle
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {onPageChange && totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 text-sm border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
