
import { Supplier } from "@/types"
import { Phone, Mail, MapPin, Edit, Trash2, MessageCircle } from "lucide-react"

interface SupplierTableProps {
    suppliers: Supplier[]
    onEdit: (supplier: Supplier) => void
    onDelete: (id: string) => void
}

export function SupplierTable({ suppliers, onEdit, onDelete }: SupplierTableProps) {
    if (suppliers.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <p className="text-sm text-slate-500">No hay proveedores registrados.</p>
            </div>
        )
    }

    return (
        <div>
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Empresa / Contacto</th>
                            <th className="px-6 py-3 font-semibold">Contacto</th>
                            <th className="px-6 py-3 font-semibold">Notas</th>
                            <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {suppliers.map((supplier) => (
                            <tr key={supplier.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-3">
                                    <div className="font-medium text-slate-900">{supplier.name}</div>
                                    {supplier.contactPerson && (
                                        <div className="text-xs text-slate-400 mt-0.5">{supplier.contactPerson}</div>
                                    )}
                                </td>
                                <td className="px-6 py-3 space-y-1">
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <Phone size={14} className="text-slate-400" />
                                            {supplier.phone}
                                            {/* WhatsApp Quick Link */}
                                            <a href={`https://wa.me/${supplier.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-[#25D366] hover:scale-110 transition-transform" title="Enviar WhatsApp">
                                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="fill-current"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                            </a>
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                                            <Mail size={14} className="text-slate-400" /> {supplier.email}
                                        </div>
                                    )}
                                    {supplier.address && (
                                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                                            <MapPin size={14} className="text-slate-400" /> {supplier.address}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-3">
                                    <p className="text-xs text-slate-500 max-w-[200px] truncate">{supplier.notes}</p>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(supplier)}
                                            className="p-1.5 text-slate-400 rounded-lg transition-colors hover:bg-[var(--primary)]/10"
                                            style={{ color: 'var(--primary)' }}
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(supplier.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar"
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
            <div className="md:hidden space-y-4">
                {suppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{supplier.name}</h3>
                                {supplier.contactPerson && (
                                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">
                                            {supplier.contactPerson}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => onEdit(supplier)}
                                    className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => onDelete(supplier.id)}
                                    className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            {supplier.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                        <Phone size={14} />
                                    </div>
                                    <span className="font-medium">{supplier.phone}</span>
                                </div>
                            )}
                            {supplier.email && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                        <Mail size={14} />
                                    </div>
                                    <span className="truncate">{supplier.email}</span>
                                </div>
                            )}
                            {supplier.address && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                        <MapPin size={14} />
                                    </div>
                                    <span className="truncate">{supplier.address}</span>
                                </div>
                            )}
                        </div>

                        {supplier.notes && (
                            <div className="text-xs text-slate-400 italic">
                                Note: {supplier.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
