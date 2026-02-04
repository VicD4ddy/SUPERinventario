"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, X, Wallet, ShoppingBag, AlertCircle } from "lucide-react"

interface CalendarEvent {
    id: string
    title: string
    description: string
    event_date: string // YYYY-MM-DD
    type: 'note' | 'sale_due' | 'purchase_due'
    amount?: number
    metadata?: any
}

interface DailySales {
    date: string // YYYY-MM-DD
    total: number
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [sales, setSales] = useState<DailySales[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [newEventTitle, setNewEventTitle] = useState("")

    // Calendar logic
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayIndex = (firstDay.getDay() + 6) % 7
    const daysInMonth = lastDay.getDate()
    const monthName = new Intl.DateTimeFormat('es-VE', { month: 'long', year: 'numeric' }).format(currentDate)

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

    useEffect(() => {
        fetchMonthData()
    }, [currentDate])

    async function fetchMonthData() {
        setLoading(true)
        const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`
        const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`

        const allEvents: CalendarEvent[] = []

        // 1. Fetch User Notes
        const { data: notes } = await supabase
            .from('calendar_events')
            .select('*')
            .gte('event_date', startStr)
            .lte('event_date', endStr)

        if (notes) {
            allEvents.push(...notes.map((n: any) => ({ ...n, type: 'note' as const })))
        }

        // 2. Fetch Pending Sales (Receivables) - Based on payment_due_date
        const { data: pendingSales } = await supabase
            .from('sales')
            .select('id, customer_name, total_amount_usd, payment_due_date, paid_usd')
            .or('payment_status.eq.pending,payment_status.eq.partial')
            .gte('payment_due_date', startStr)
            .lte('payment_due_date', `${endStr} 23:59:59`)

        if (pendingSales) {
            allEvents.push(...pendingSales.map((s: any) => ({
                id: s.id,
                title: `Cobrar: ${s.customer_name}`,
                description: `Pendiente: $${(s.total_amount_usd - (s.paid_usd || 0)).toFixed(2)}`,
                event_date: new Date(s.payment_due_date).toISOString().split('T')[0],
                type: 'sale_due' as const,
                amount: s.total_amount_usd - (s.paid_usd || 0),
                metadata: s
            })))
        }

        // 3. Fetch Pending Purchases (Payables)
        // Check if purchase_orders table exists first to avoid crashing if module unused
        // But for this project we know it exists.
        const { data: pendingPurchases } = await supabase
            .from('purchase_orders')
            .select('id, total_amount, payment_due_date, suppliers(name)')
            .eq('status', 'pending')
            .gte('payment_due_date', startStr)
            .lte('payment_due_date', endStr)

        if (pendingPurchases) {
            allEvents.push(...pendingPurchases.map((p: any) => ({
                id: p.id,
                title: `Pagar: ${p.suppliers?.name || 'Proveedor'}`,
                description: `Monto: $${p.total_amount}`,
                event_date: p.payment_due_date, // assuming date type
                type: 'purchase_due' as const,
                amount: p.total_amount,
                metadata: p
            })))
        }

        setEvents(allEvents)

        // 4. Fetch Daily Sales Stats (Existing logic)
        const { data: salesData } = await supabase
            .from('sales')
            .select('created_at, total_amount_usd')
            .gte('created_at', startStr)
            .lte('created_at', `${endStr} 23:59:59`)

        if (salesData) {
            const grouped = salesData.reduce((acc: any, curr: any) => {
                const date = curr.created_at.split('T')[0]
                if (!acc[date]) acc[date] = 0
                acc[date] += curr.total_amount_usd
                return acc
            }, {})
            setSales(Object.keys(grouped).map(k => ({ date: k, total: grouped[k] })))
        }

        setLoading(false)
    }

    const handleAddEvent = async () => {
        if (!selectedDate || !newEventTitle.trim()) return

        const { error } = await supabase
            .from('calendar_events')
            .insert([{
                title: newEventTitle,
                event_date: selectedDate,
                description: ""
            }])

        if (!error) {
            setNewEventTitle("")
            setSelectedDate(null)
            fetchMonthData()
        }
    }

    const handleDeleteEvent = async (id: string) => {
        if (!confirm("¿Borrar nota?")) return
        await supabase.from('calendar_events').delete().eq('id', id)
        fetchMonthData()
    }

    const renderEvent = (e: CalendarEvent) => {
        const isNote = e.type === 'note'
        const isSale = e.type === 'sale_due'
        const isPurchase = e.type === 'purchase_due'

        let bgClass = 'bg-indigo-50 text-indigo-700'
        if (isSale) bgClass = 'bg-green-100 text-green-800 border-l-2 border-green-500' // Sales = Green
        if (isPurchase) bgClass = 'bg-rose-100 text-rose-800 border-l-2 border-rose-500' // Purchases = Red

        return (
            <div key={e.id} className={`text-xs px-1.5 py-1 rounded truncate relative group hover:shadow-sm mb-1 ${bgClass}`} title={e.description}>
                <div className="flex items-center gap-1">
                    {isSale && <Wallet size={10} />}
                    {isPurchase && <ShoppingBag size={10} />}
                    <span className="truncate flex-1">{e.title}</span>
                </div>
                {e.amount && <div className="text-[10px] font-bold opacity-80 pl-3.5">${e.amount.toFixed(2)}</div>}

                {isNote && (
                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteEvent(e.id)
                        }}
                        className="absolute right-0 top-0 bottom-0 px-1 hover:text-red-600 hidden group-hover:block bg-inherit"
                    >
                        &times;
                    </button>
                )}
            </div>
        )
    }

    const renderDays = () => {
        const days = []
        // Empty slots
        for (let i = 0; i < startDayIndex; i++) {
            days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-slate-50 border border-slate-100 opacity-50"></div>)
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            const dayEvents = events.filter(e => e.event_date === dateStr)
            const daySales = sales.find(s => s.date === dateStr)
            const isToday = new Date().toISOString().split('T')[0] === dateStr

            days.push(
                <div
                    key={i}
                    className={`min-h-[120px] border border-slate-100 p-2 relative group hover:bg-slate-50 transition-colors ${isToday ? '' : 'bg-white'}`}
                    style={isToday ? { backgroundColor: 'rgba(var(--primary-rgb), 0.05)', borderColor: 'rgba(var(--primary-rgb), 0.2)' } : {}}
                    onClick={() => setSelectedDate(dateStr)}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-semibold h-6 w-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[var(--primary)] text-white' : 'text-slate-700'}`}>
                            {i}
                        </span>
                        {daySales && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                +${daySales.total.toFixed(0)}
                            </span>
                        )}
                    </div>

                    <div className="space-y-0.5 overflow-y-auto max-h-[90px] scrollbar-none">
                        {dayEvents.map(renderEvent)}
                    </div>

                    {/* Add button on hover */}
                    <button
                        className="absolute bottom-1 right-1 p-1 text-slate-300 hover:text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Agregar nota"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            )
        }
        return days
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 capitalize flex items-center gap-2">
                    <CalendarIcon className="w-8 h-8 text-slate-400" />
                    {monthName}
                </h2>

                {/* Legend */}
                <div className="flex gap-4 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-full shadow-sm border">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>Cobros
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>Pagos
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>Notas
                    </div>
                </div>

                <div className="flex space-x-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 bg-white border border-slate-200">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 bg-white border border-slate-200">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                        <div key={d} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100 gap-px">
                    {/* gap-px with bg-slate-100 creates grid lines if cells are white */}
                    {renderDays()}
                </div>
            </div>

            {/* Modal for adding event */}
            {selectedDate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative transform transition-all scale-100">
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-[var(--primary)]" />
                            Nota para el {new Date(selectedDate).toLocaleDateString('es-VE')}
                        </h3>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Contenido</label>
                            <input
                                type="text"
                                placeholder="Ej. Recordar llamar a proveedor..."
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                value={newEventTitle}
                                onChange={e => setNewEventTitle(e.target.value)}
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleAddEvent()}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddEvent}
                                className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity font-bold text-sm shadow-sm"
                                style={{ backgroundColor: 'var(--primary)' }}
                            >
                                Guardar Nota
                            </button>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Eventos del día</h4>
                            <div className="space-y-2">
                                {events.filter(e => e.event_date === selectedDate).length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">No hay eventos para este día.</p>
                                ) : (
                                    events.filter(e => e.event_date === selectedDate).map(e => (
                                        <div key={e.id} className="text-sm p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center group">
                                            <div className="flex items-center gap-2">
                                                {e.type === 'sale_due' && <Wallet size={14} className="text-green-500" />}
                                                {e.type === 'purchase_due' && <ShoppingBag size={14} className="text-rose-500" />}
                                                {e.type === 'note' && <div className="w-3 h-3 rounded-full bg-indigo-500" />}
                                                <span>{e.title}</span>
                                            </div>
                                            {e.type === 'note' && (
                                                <button onClick={() => handleDeleteEvent(e.id)} className="text-slate-400 hover:text-red-500">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
