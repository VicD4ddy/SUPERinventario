"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { Expense } from "@/types"
import { ExpenseStats } from "@/components/expenses/ExpenseStats"
import { ExpenseList } from "@/components/expenses/ExpenseList"
import { ExpenseForm } from "@/components/expenses/ExpenseForm"
import { Modal } from "@/components/ui/Modal"
import { Plus, Filter, Calendar as CalendarIcon, Download } from "lucide-react"
import { FloatingActionButton } from "@/components/ui/FloatingActionButton"
import { useAuth } from "@/contexts/AuthContext"

export default function ExpensesPage() {
    const supabase = createClient()
    const { role } = useAuth()

    // Data State
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [financials, setFinancials] = useState({
        sales: 0,
        cogs: 0,
        expenses: 0,
        profit: 0,
        margin: 0
    })
    const [loading, setLoading] = useState(true)

    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of month
        end: new Date().toISOString().split('T')[0] // Today
    })

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            // 1. Fetch Financial Metrics (via RPC)
            const { data: metricsData, error: metricsError } = await supabase
                .rpc('get_financial_metrics', {
                    p_start_date: dateRange.start,
                    p_end_date: dateRange.end
                })

            if (metricsError) throw metricsError
            if (metricsData) setFinancials(metricsData)

            // 2. Fetch Full List (via Query) for the table
            const { data: listData, error: listError } = await supabase
                .from('expenses')
                .select('*, category:expense_categories(*)')
                .gte('date', dateRange.start)
                .lte('date', dateRange.end)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })

            if (listError) throw listError
            if (listData) setExpenses(listData)

        } catch (error) {
            console.error("Error fetching expenses:", error)
        } finally {
            setLoading(false)
        }
    }, [dateRange])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este gasto?")) return

        try {
            const { error } = await supabase.from('expenses').delete().eq('id', id)
            if (error) throw error
            fetchData() // Refresh
        } catch (err) {
            alert("Error al eliminar")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gastos Operativos</h1>
                    <p className="text-slate-500">Administra pagos de alquiler, servicios y nómina</p>
                </div>

                <div className="flex gap-2">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="rounded-lg border-slate-300 text-sm text-black bg-white placeholder-slate-500"
                        style={{ colorScheme: 'light' }}
                    />
                    <span className="text-slate-400 self-center">-</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="rounded-lg border-slate-300 text-sm text-black bg-white placeholder-slate-500"
                        style={{ colorScheme: 'light' }}
                    />

                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 font-medium whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Nuevo Gasto
                    </button>
                </div>
            </div>

            {/* Stats Cards - Conditionally Rendered */}
            {role === 'admin' && (
                <ExpenseStats
                    financials={financials}
                    totalVES={0}
                />
            )}

            {/* Main Table */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Historial de Gastos</h2>
                </div>

                {loading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : (
                    <ExpenseList expenses={expenses} onDelete={handleDelete} />
                )}
            </div>

            {/* Create Modal */}
            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Registrar Nuevo Gasto">
                <ExpenseForm
                    onSuccess={() => {
                        setIsFormOpen(false)
                        fetchData()
                    }}
                    onCancel={() => setIsFormOpen(false)}
                />
            </Modal>

            {/* Mobile FAB */}
            <FloatingActionButton
                onClick={() => setIsFormOpen(true)}
                icon={Plus}
                label="Gasto"
            />
        </div>
    )
}
