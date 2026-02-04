import { Customer } from "@/types"
import { Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react"

interface CustomerTableProps {
    customers: Customer[]
    onEdit: (customer: Customer) => void
    onDelete: (id: string) => void
    onRegisterPayment: (customer: Customer) => void
}

export function CustomerTable({ customers, onEdit, onDelete, onRegisterPayment }: CustomerTableProps) {
    if (customers.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <p className="text-sm text-slate-500">No hay clientes registrados.</p>
            </div>
        )
    }

    return (
        <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-white border-b border-slate-100 text-xs uppercase text-slate-400 tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Cliente</th>
                            <th className="px-6 py-4 font-semibold">Contacto</th>
                            <th className="px-6 py-4 font-semibold text-right">Deuda</th>
                            <th className="px-6 py-4 font-semibold text-center">Puntos</th>
                            <th className="px-6 py-4 font-semibold">Notas</th>
                            <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {customers.map((customer, idx) => (
                            <tr
                                key={customer.id}
                                className="hover:bg-indigo-50/50 transition-all duration-200 group animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                            >
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-800">{customer.name}</div>
                                </td>
                                <td className="px-6 py-4 space-y-1">
                                    {customer.phone && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <div className="p-1 bg-slate-100 rounded-full text-slate-400">
                                                <Phone size={12} />
                                            </div>
                                            {customer.phone}
                                            {/* WhatsApp Quick Link */}
                                            <a href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-[#25D366] hover:scale-125 transition-transform" title="Enviar WhatsApp">
                                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="fill-current"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                            </a>
                                        </div>
                                    )}
                                    {customer.email && (
                                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                                            <Mail size={12} className="text-slate-400" /> {customer.email}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {customer.totalDebt && customer.totalDebt > 0 ? (
                                        <div className="flex flex-col items-end">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                                ${customer.totalDebt.toFixed(2)}
                                            </span>
                                            {customer.debtSince && (
                                                <span className="text-[10px] text-slate-400 mt-1">
                                                    {customer.debtSince.toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-slate-200">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {customer.loyaltyPoints && customer.loyaltyPoints > 0 ? (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                                            {customer.loyaltyPoints} pts
                                        </span>
                                    ) : (
                                        <span className="text-slate-200">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-xs text-slate-400 max-w-[150px] truncate">{customer.notes}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {customer.totalDebt && customer.totalDebt > 0 && (
                                            <button
                                                onClick={() => onRegisterPayment(customer)}
                                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors mr-1 shadow-sm"
                                                title="Registrar Abono"
                                            >
                                                <span className="font-bold text-xs">$</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onEdit(customer)}
                                            className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                                            title="Editar"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(customer.id)}
                                            className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-lg transition-all shadow-sm"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {customers.map((customer) => (
                    <div key={customer.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                        {/* Debt Status Strip */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1 ${customer.totalDebt && customer.totalDebt > 0 ? 'bg-rose-500' : 'bg-slate-200'
                            }`} />

                        <div className="pl-2 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{customer.name}</h3>
                                {customer.phone && (
                                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                                        <Phone size={14} /> {customer.phone}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {customer.totalDebt && customer.totalDebt > 0 && (
                                    <span className="px-2 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-100">
                                        Debe: ${customer.totalDebt.toFixed(2)}
                                    </span>
                                )}
                                {customer.loyaltyPoints && customer.loyaltyPoints > 0 && (
                                    <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100 flex items-center gap-1">
                                        ★ {customer.loyaltyPoints}
                                    </span>
                                )}
                            </div>
                        </div>

                        {customer.notes && (
                            <div className="pl-2 text-xs text-slate-400 italic bg-slate-50 p-2 rounded-lg">
                                "{customer.notes}"
                            </div>
                        )}

                        <div className="pl-2 flex gap-2 pt-2 border-t border-slate-50">
                            {customer.totalDebt && customer.totalDebt > 0 && (
                                <button
                                    onClick={() => onRegisterPayment(customer)}
                                    className="flex-1 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-sm border border-emerald-100 flex items-center justify-center gap-2"
                                >
                                    <span className="font-bold">$</span> Abonar
                                </button>
                            )}
                            <button
                                onClick={() => onEdit(customer)}
                                className="flex-1 py-2 bg-slate-100 text-slate-600 font-medium rounded-xl text-sm flex items-center justify-center gap-2"
                            >
                                <Edit size={16} /> Editar
                            </button>
                            <button
                                onClick={() => onDelete(customer.id)}
                                className="w-10 py-2 bg-white border border-slate-200 text-red-500 rounded-xl flex items-center justify-center"
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
