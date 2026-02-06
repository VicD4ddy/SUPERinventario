import { useState, useEffect } from "react"
import { Customer } from "@/types"
import { X, Save } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface CustomerFormProps {
    isOpen: boolean
    onClose: () => void
    onSaved: () => void
    editingCustomer: Customer | null
}

export function CustomerForm({ isOpen, onClose, onSaved, editingCustomer }: CustomerFormProps) {
    const supabase = createClient() // Initialize supabase client
    const { user, business } = useAuth() // Add useAuth hook

    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [address, setAddress] = useState("")
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (editingCustomer) {
            setName(editingCustomer.name)
            setPhone(editingCustomer.phone || "")
            setEmail(editingCustomer.email || "")
            setAddress(editingCustomer.address || "")
            setNotes(editingCustomer.notes || "")
        } else {
            // Reset
            setName("")
            setPhone("")
            setEmail("")
            setAddress("")
            setNotes("")
        }
    }, [editingCustomer, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const customerData = {
            name,
            phone,
            email,
            address,
            notes
        }

        try {
            if (editingCustomer) {
                const { error } = await supabase
                    .from('customers')
                    .update(customerData)
                    .eq('id', editingCustomer.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('customers')
                    .insert([customerData])
                if (error) throw error
            }

            onSaved()
            onClose()
        } catch (error: any) {
            console.error("Error saving customer:", error)
            alert(`Error al guardar el cliente: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">
                        {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre Completo *</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 placeholder:text-slate-400"
                            placeholder="Ej. Maria Gonzalez"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Teléfono</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 placeholder:text-slate-400"
                                placeholder="Ej. +58 412 1234567"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 placeholder:text-slate-400"
                                placeholder="cliente@correo.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Dirección</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 placeholder:text-slate-400"
                            placeholder="Ubicación o dirección de entrega"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Notas Adicionales</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-slate-900 placeholder:text-slate-400"
                            placeholder="Preferencias, cumpleaños, crédito autorizado..."
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                        >
                            <Save size={16} />
                            {loading ? "Guardando..." : "Guardar Cliente"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
