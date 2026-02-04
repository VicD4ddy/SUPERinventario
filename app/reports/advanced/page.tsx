"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Calendar, TrendingUp, DollarSign, Package, PieChart as PieIcon, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Colors for charts
const COLORS = ['#4f46e5', '#ea580c', '#16a34a', '#db2777', '#2563eb', '#9333ea', '#ca8a04', '#0891b2']

export default function AdvancedReportsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState(30) // Default 30 days

    // Data States
    const [dailySales, setDailySales] = useState<any[]>([])
    const [categoryStats, setCategoryStats] = useState<any[]>([])
    const [topProducts, setTopProducts] = useState<any[]>([])

    // KPI States
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [totalProfit, setTotalProfit] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [dateRange])

    async function fetchData() {
        setLoading(true)
        setError(null)
        try {
            // Parallel Fetch
            const [datesRes, catsRes, prodsRes] = await Promise.all([
                supabase.rpc('get_daily_sales_stats', { days_lookback: dateRange }),
                supabase.rpc('get_category_stats', { days_lookback: dateRange }),
                supabase.rpc('get_top_products_stats', { days_lookback: dateRange, limit_count: 5 })
            ])

            if (datesRes.error) throw new Error(`Daily Stats Error: ${datesRes.error.message}`)
            if (catsRes.error) throw new Error(`Category Stats Error: ${catsRes.error.message}`)
            if (prodsRes.error) throw new Error(`Products Stats Error: ${prodsRes.error.message}`)

            // Process Daily Data
            const dates = datesRes.data || []
            setDailySales(dates.map((d: any) => ({
                ...d,
                sale_date: new Date(d.sale_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                margin: d.total_revenue > 0 ? ((d.total_profit / d.total_revenue) * 100).toFixed(1) : 0
            })))

            // Process KPIs
            setTotalRevenue(dates.reduce((acc: number, curr: any) => acc + (curr.total_revenue || 0), 0))
            setTotalProfit(dates.reduce((acc: number, curr: any) => acc + (curr.total_profit || 0), 0))
            setTotalCount(dates.reduce((acc: number, curr: any) => acc + (curr.sale_count || 0), 0))

            // Process Categories
            setCategoryStats(catsRes.data || [])

            // Process Products
            setTopProducts(prodsRes.data || [])

        } catch (err: any) {
            console.error("Error fetching analytics:", err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs">
                    <p className="font-bold text-slate-900 mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            {entry.name}: {entry.name === 'Margen (%)' ? `${entry.value}%` : `$${Number(entry.value).toFixed(2)}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/reports" className="text-slate-400 hover:text-indigo-600 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Reportes Avanzados</h2>
                    </div>
                    <p className="text-slate-600 ml-7">Análisis profundo del rendimiento de tu negocio.</p>
                </div>

                <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                    {[7, 30, 90].map((days) => (
                        <button
                            key={days}
                            onClick={() => setDateRange(days)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${dateRange === days
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {days === 7 ? '7 Días' : days === 30 ? '30 Días' : '3 Meses'}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                    <strong className="font-bold">Error cargando datos: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={80} />
                    </div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Ingresos Totales</p>
                    <h3 className="text-3xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</h3>
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
                        <TrendingUp size={12} />
                        En los últimos {dateRange} días
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <PieIcon size={80} />
                    </div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Ganancia Estimada</p>
                    <h3 className="text-3xl font-bold text-emerald-600">${totalProfit.toFixed(2)}</h3>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                        Margen Promedio: {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Package size={80} />
                    </div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Ventas Realizadas</p>
                    <h3 className="text-3xl font-bold text-indigo-600">{totalCount}</h3>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                        Transacciones completadas
                    </p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="text-indigo-500" size={20} />
                        Tendencia de Ingresos
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailySales}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="sale_date"
                                    stroke="#64748B"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#64748B"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="total_revenue"
                                    name="Ingresos"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    dot={{ strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total_profit"
                                    name="Ganancia"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ strokeWidth: 2, r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <PieIcon className="text-orange-500" size={20} />
                        Ventas por Categoría
                    </h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="total_revenue"
                                    nameKey="category"
                                >
                                    {categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Package className="text-purple-500" size={20} />
                        Top 5 Productos
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="product_name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 11, fill: '#475569' }}
                                    interval={0}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="total_revenue" name="Ventas" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24}>
                                    {topProducts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
