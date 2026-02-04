
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Supplier } from "@/types"
import { SupplierPaymentModal } from "@/components/suppliers/SupplierPaymentModal"
import { SupplierForm } from "@/components/suppliers/SupplierForm"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { Plus, Search, Truck, Phone, Mail, Edit, Trash2, DollarSign } from "lucide-react"
import { FloatingActionButton } from "@/components/ui/FloatingActionButton"

export default function SuppliersPage() {
    const { rate } = useExchangeRate()
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Modal State
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null)

    useEffect(() => {
        fetchSuppliers()
    }, [])

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredSuppliers(suppliers)
        } else {
            const lower = searchTerm.toLowerCase()
            setFilteredSuppliers(suppliers.filter(s =>
                s.name.toLowerCase().includes(lower) ||
                (s.contactPerson && s.contactPerson.toLowerCase().includes(lower))
            ))
        }
    }, [searchTerm, suppliers])

    async function fetchSuppliers() {
        setLoading(true)
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name', { ascending: true })

        if (data) {
            const mapped: Supplier[] = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                contactPerson: item.contact_person,
                phone: item.phone,
                email: item.email,
                address: item.address,
                notes: item.notes,
                totalDebt: item.total_debt || 0,
                createdAt: new Date(item.created_at)
            }))
            setSuppliers(mapped)
            setFilteredSuppliers(mapped)
        }
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este proveedor?")) return

        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', id)

        if (!error) fetchSuppliers()
    }

    const handleRegisterPayment = (supplier: Supplier) => {
        setPayingSupplier(supplier)
        setIsPaymentOpen(true)
    }

    const onSavePayment = async (amountUSD: number, method: string, details?: Record<string, number>) => {
        if (!payingSupplier) return

        try {
            const { error: payError } = await supabase
                .from('supplier_payments')
                .insert([{
                    supplier_id: payingSupplier.id,
                    amount: amountUSD,
                    date: new Date().toISOString(),
                    payment_method: method,
                    payment_details: details || {},
                    notes: `Pago a proveedor ${payingSupplier.name}`
                }])

            if (payError) throw payError

            const newDebt = (payingSupplier.totalDebt || 0) - amountUSD
            const { error: updateError } = await supabase
                .from('suppliers')
                .update({ total_debt: newDebt })
                .eq('id', payingSupplier.id)

            if (updateError) throw updateError

            alert("Pago registrado exitosamente")
            setIsPaymentOpen(false)
            fetchSuppliers()
        } catch (e: any) {
            console.error("Error saving payment:", e)
            alert("Error al registrar pago: " + e.message)
        }
    }

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier)
        setIsFormOpen(true)
    }

    const handleAddNew = () => {
        setEditingSupplier(null)
        setIsFormOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Truck className="h-8 w-8 text-slate-400" />
                        Proveedores
                    </h2>
                    <p className="text-slate-500">Gestiona tu lista de contactos y distribuidores.</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg items-center gap-2 font-medium shadow-sm transition-colors"
                >
                    <Plus size={20} /> Nuevo Proveedor
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                <Search className="text-slate-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o contacto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 outline-none text-sm text-slate-600 placeholder:text-slate-400"
                />
            </div>

            {loading ? (
                <div className="py-12 text-center text-slate-500 animate-pulse">Cargando proveedores...</div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold">
                                    <th className="px-6 py-4">Proveedor</th>
                                    <th className="px-6 py-4">Contacto</th>
                                    <th className="px-6 py-4 text-right">Deuda</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{supplier.name}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex flex-col">
                                                <span>{supplier.contactPerson}</span>
                                                <span className="text-xs text-slate-400">{supplier.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {(supplier.totalDebt || 0) > 0 ? (
                                                <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                                    ${supplier.totalDebt?.toFixed(2)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleRegisterPayment(supplier)}
                                                className="text-emerald-600 hover:text-emerald-800 font-medium text-xs uppercase tracking-wide px-2 py-1 hover:bg-emerald-50 rounded"
                                                title="Registrar Pago"
                                            >
                                                Pagar
                                            </button>
                                            <button
                                                onClick={() => handleEdit(supplier)}
                                                className="text-indigo-600 hover:text-indigo-800 font-medium"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier.id)}
                                                className="text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSuppliers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                            No se encontraron proveedores.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {filteredSuppliers.map((supplier) => (
                            <div key={supplier.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                                {/* Debt Status Strip */}
                                <div className={`absolute top-0 bottom-0 left-0 w-1 ${(supplier.totalDebt || 0) > 0 ? 'bg-red-500' : 'bg-slate-200'}`} />

                                <div className="pl-2 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">{supplier.name}</h3>
                                        {supplier.contactPerson && (
                                            <p className="text-sm text-slate-600 mt-1">{supplier.contactPerson}</p>
                                        )}
                                    </div>
                                    {(supplier.totalDebt || 0) > 0 && (
                                        <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100">
                                            Debe: ${supplier.totalDebt?.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {/* Contact Info */}
                                <div className="pl-2 flex flex-col gap-2 text-sm">
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Phone size={14} className="text-slate-400" />
                                            <span>{supplier.phone}</span>
                                        </div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Mail size={14} className="text-slate-400" />
                                            <span className="text-xs">{supplier.email}</span>
                                        </div>
                                    )}
                                </div>

                                {supplier.notes && (
                                    <div className="pl-2 text-xs text-slate-400 italic bg-slate-50 p-2 rounded-lg">
                                        "{supplier.notes}"
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="pl-2 flex gap-2 pt-2 border-t border-slate-50">
                                    {(supplier.totalDebt || 0) > 0 && (
                                        <button
                                            onClick={() => handleRegisterPayment(supplier)}
                                            className="flex-1 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-sm border border-emerald-100 flex items-center justify-center gap-2"
                                        >
                                            <DollarSign size={16} /> Pagar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(supplier)}
                                        className="flex-1 py-2 bg-slate-100 text-slate-600 font-medium rounded-xl text-sm flex items-center justify-center gap-2"
                                    >
                                        <Edit size={16} /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(supplier.id)}
                                        className="w-10 py-2 bg-white border border-slate-200 text-red-500 rounded-xl flex items-center justify-center"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredSuppliers.length === 0 && (
                            <div className="text-center py-12 text-slate-400 italic">
                                No se encontraron proveedores.
                            </div>
                        )}
                    </div>
                </>
            )}

            <SupplierForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSaved={fetchSuppliers}
                editingSupplier={editingSupplier}
            />

            <SupplierPaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                supplier={payingSupplier}
                onSave={onSavePayment}
            />

            {/* Mobile FAB */}
            <FloatingActionButton
                onClick={handleAddNew}
                icon={Plus}
                label="Proveedor"
            />
        </div>
    )
}
