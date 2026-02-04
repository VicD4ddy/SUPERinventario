"use client"

import { useState, useEffect } from "react"
import { Customer } from "@/types"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { createClient } from "@/utils/supabase/client"
import { CustomerTable } from "@/components/customers/CustomerTable"
import { CustomerForm } from "@/components/customers/CustomerForm"
import { PaymentModal } from "@/components/customers/PaymentModal"
import { Plus, Search, Users } from "lucide-react"
import { FloatingActionButton } from "@/components/ui/FloatingActionButton"

export default function CustomersPage() {
    const supabase = createClient()
    const { rate } = useExchangeRate()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchCustomers = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('name')

        if (error) {
            console.error('Error fetching customers:', JSON.stringify(error, null, 2))
        } else if (data) {
            const mappedCustomers: Customer[] = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                phone: item.phone,
                email: item.email,
                address: item.address,
                notes: item.notes,
                totalDebt: item.total_debt,
                debtSince: item.debt_since ? new Date(item.debt_since) : undefined,
                loyaltyPoints: item.loyalty_points,
                createdAt: new Date(item.created_at)
            }))
            setCustomers(mappedCustomers)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchCustomers()
    }, [])

    const handleCreate = () => {
        setEditingCustomer(null)
        setIsFormOpen(true)
    }

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer)
        setIsFormOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este cliente?")) {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id)

            if (!error) {
                setCustomers(customers.filter(c => c.id !== id))
            } else {
                if (error.code === '23503') {
                    alert("No se puede eliminar este cliente porque tiene ventas registradas en el historial.")
                } else {
                    alert(`Error al eliminar cliente: ${error.message}`)
                }
            }
        }
    }

    const handlePayment = (customer: Customer) => {
        setPayingCustomer(customer)
        setIsPaymentOpen(true)
    }

    const onSavePayment = async (amount: number, method: string, details?: Record<string, number>) => {
        if (!payingCustomer) return

        // 1. Record Transaction
        const { error: txError } = await supabase
            .from('payment_transactions')
            .insert([{
                customer_id: payingCustomer.id,
                amount_usd: amount,
                amount_ves: amount * rate,
                exchange_rate: rate,
                transaction_date: new Date().toISOString(),
                note: 'Abono a deuda',
                payment_details: details || {}
            }])

        if (txError) {
            console.error("Error creating transaction", txError)
            alert("Error al registrar la transacción")
            return
        }

        const newDebt = Math.max(0, (payingCustomer.totalDebt || 0) - amount)

        const updates: any = { total_debt: newDebt }
        if (newDebt === 0) updates.debt_since = null

        const { error } = await supabase
            .from('customers')
            .update(updates)
            .eq('id', payingCustomer.id)

        if (!error) {
            // Optimistic update
            setCustomers(customers.map(c =>
                c.id === payingCustomer.id
                    ? { ...c, totalDebt: newDebt, debtSince: newDebt === 0 ? undefined : c.debtSince }
                    : c
            ))
            setIsPaymentOpen(false)
        } else {
            console.error(error)
            alert("Error al registrar pago")
        }
    }

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Users className="text-indigo-600" />
                        Clientes
                    </h2>
                    <p className="text-slate-600">Gestiona tu cartera de clientes y contactos.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="hidden md:flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full max-w-md">
                <Search className="text-slate-400 ml-2" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre, teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 border-0 focus:ring-0 text-sm text-slate-900 placeholder:text-slate-400"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">Cargando clientes...</div>
            ) : (
                <CustomerTable
                    customers={filteredCustomers}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRegisterPayment={handlePayment}
                />
            )}

            {/* Form Modal */}
            <CustomerForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSaved={fetchCustomers}
                editingCustomer={editingCustomer}
            />

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                customer={payingCustomer}
                onSave={onSavePayment}
            />

            {/* Mobile FAB */}
            <FloatingActionButton
                onClick={handleCreate}
                icon={Plus}
                label="Cliente"
            />
        </div>
    )
}
