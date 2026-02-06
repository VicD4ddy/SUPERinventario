"use client"

import { DollarSign, Package, TrendingUp, CreditCard, Edit, AlertTriangle } from "lucide-react"
import { KPICard } from "@/components/dashboard/KPICard"
import { SalesChart } from "@/components/dashboard/SalesChart"
import { ProductSalesChart } from "@/components/dashboard/ProductSalesChart"
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { TopProducts } from "@/components/dashboard/TopProducts"
import { StockPredictionWidget } from "@/components/dashboard/StockPredictionWidget"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { useState, useEffect } from "react"
// import { supabase } from "@/lib/supabase" <-- REMOVED
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { MobileQuickActions } from "@/components/dashboard/MobileQuickActions"

export default function DashboardPage() {
    const supabase = createClient() // Instantiate here
    const { rate } = useExchangeRate()
    const [stats, setStats] = useState({
        totalStockValue: 0,
        monthlySales: 0,
        monthlyProfit: 0,
        monthlyExpenses: 0,
        salesCount: 0,
        accountsReceivable: 0,
        accountsPayable: 0
    })

    // Main Chart State
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m' | '6m'>('6m')
    const [chartData, setChartData] = useState<{ name: string; value: number }[]>([])
    const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([])
    const [loadingChart, setLoadingChart] = useState(false)

    // Top Products State
    const [topProductsTimeRange, setTopProductsTimeRange] = useState<'1d' | '7d' | '30d' | '3m' | '6m'>('30d')
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [loadingTopProducts, setLoadingTopProducts] = useState(false)

    // Product Sales Chart State
    const [productList, setProductList] = useState<{ id: string, name: string }[]>([])
    const [selectedProductId, setSelectedProductId] = useState<string>("")
    const [productTimeRange, setProductTimeRange] = useState<'1d' | '7d' | '30d' | '3m' | '6m'>('30d')
    const [productChartData, setProductChartData] = useState<{ name: string; value: number }[]>([])
    const [loadingProductChart, setLoadingProductChart] = useState(false)

    // General State
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Initial Stats Load
    useEffect(() => {
        async function fetchStats() {
            setLoading(true)

            // 1. Inventory Value & Low Stock & Product List
            // ... (products fetch) ...
            const { data: products } = await supabase
                .from('products')
                .select('id, name, stock, cost_usd, min_stock')
                .order('name')

            let totalValue = 0
            const lowStock = []
            if (products) {
                totalValue = products.reduce((acc, curr) => acc + (curr.stock * (curr.cost_usd || 0)), 0)
                lowStock.push(...products.filter(p => p.stock <= (p.min_stock || 5)))

                setProductList(products.map(p => ({ id: p.id, name: p.name })))
                if (products.length > 0) setSelectedProductId(products[0].id)
            }

            // Fetch Total Debts (Receivable & Payable)
            const { data: customers } = await supabase.from('customers').select('total_debt')
            const totalReceivable = customers?.reduce((acc, curr) => acc + (curr.total_debt || 0), 0) || 0

            const { data: suppliers } = await supabase.from('suppliers').select('total_debt')
            const totalPayable = suppliers?.reduce((acc, curr) => acc + (curr.total_debt || 0), 0) || 0

            // 2. Monthly Stats range
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

            // 3. Sales & COGS (This Month)
            // ... (keep existing sales items logic) ...
            const { data: monthSalesItems } = await supabase
                .from('sale_items')
                .select(`
                    quantity,
                    unit_price_usd,
                    products (cost_usd),
                    sales (created_at)
                `)
                .gte('sales.created_at', startOfMonth)

            let monthTotalSales = 0
            let monthTotalCOGS = 0

            if (monthSalesItems) {
                monthSalesItems.forEach((item: any) => {
                    if (item.sales) {
                        monthTotalSales += item.quantity * item.unit_price_usd
                        monthTotalCOGS += item.quantity * (item.products?.cost_usd || 0)
                    }
                })
            }

            // 4. Expenses
            // ... (keep existing expenses logic) ...
            const { data: expenses } = await supabase
                .from('expenses')
                .select('amount')
                .gte('date', startOfMonth)

            let monthTotalExpenses = 0
            if (expenses) {
                monthTotalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0)
            }

            const netProfit = monthTotalSales - monthTotalCOGS - monthTotalExpenses

            // 5. Enhanced Recent Activity
            const limit = 20

            const [
                { data: recentSales },
                { data: recentExpenses },
                { data: recentStock },
                { data: newProducts },
                { data: recentPayments },
                { data: recentSupplierPayments }
            ] = await Promise.all([
                supabase.from('sales').select('id, customer_name, total_amount_usd, amount_paid_usd, created_at, payment_status').order('created_at', { ascending: false }).limit(limit),
                supabase.from('expenses').select('id, description, amount, date').order('date', { ascending: false }).limit(limit),
                supabase.from('stock_movements').select('id, type, quantity, product_id, created_at, products(name)').order('created_at', { ascending: false }).limit(limit),
                supabase.from('products').select('id, name, created_at').order('created_at', { ascending: false }).limit(limit),
                supabase.from('payment_transactions').select('id, customer_id, amount_usd, transaction_date, customers(name)').order('transaction_date', { ascending: false }).limit(limit),
                supabase.from('supplier_payments').select('id, supplier_id, amount, date, suppliers(name)').order('date', { ascending: false }).limit(limit)
            ])

            let allActivities: any[] = []

            // Process Sales
            // ... (keep existing sales processing) ...
            recentSales?.forEach(s => {
                const status = s.payment_status
                let type = 'sale'
                let desc = `Venta a ${s.customer_name || 'Cliente Casual'}`
                let meta = undefined

                if (status === 'pending') {
                    type = 'credit'
                    desc = `Crédito a ${s.customer_name || 'Cliente'}`
                    meta = 'Pendiente'
                } else if (status === 'partial') {
                    // It's a sale with an initial down payment (abono)
                    type = 'sale' // or 'credit'
                    desc = `Venta con Abono a ${s.customer_name || 'Cliente'}`
                    const paid = s.amount_paid_usd || 0
                    meta = `Abono: $${paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                }

                allActivities.push({
                    id: s.id,
                    type: type,
                    description: desc,
                    date: new Date(s.created_at),
                    amount: s.total_amount_usd,
                    meta: meta,
                    timestamp: new Date(s.created_at).getTime()
                })
            })

            // Process Payments (Abonos Clientes)
            recentPayments?.forEach((p: any) => {
                allActivities.push({
                    id: p.id,
                    type: 'payment',
                    description: `Abono de ${p.customers?.name || 'Cliente'}`,
                    date: new Date(p.transaction_date),
                    amount: p.amount_usd,
                    timestamp: new Date(p.transaction_date).getTime()
                })
            })

            // Process Supplier Payments
            recentSupplierPayments?.forEach((p: any) => {
                allActivities.push({
                    id: p.id,
                    type: 'supplier_payment',
                    description: `Pago a ${p.suppliers?.name || 'Proveedor'}`,
                    date: new Date(p.date),
                    amount: p.amount,
                    timestamp: new Date(p.date).getTime()
                })
            })

            // Process Expenses
            recentExpenses?.forEach(e => {
                allActivities.push({
                    id: e.id,
                    type: 'expense',
                    description: e.description,
                    date: new Date(e.date),
                    amount: e.amount,
                    timestamp: new Date(e.date).getTime()
                })
            })

            // Process Stock, New Products
            // ... (keep existing stock/products logic) ...
            recentStock?.forEach((s: any) => {
                const prodName = s.products?.name || 'Producto'
                let desc = ''
                let type = 'adjustment'

                if (s.type === 'IN') {
                    desc = `Reabastecimiento: ${prodName}`
                    type = 'restock'
                } else if (s.type === 'OUT') {
                    desc = `Salida de Stock: ${prodName}`
                } else if (s.type === 'ADJUSTMENT') {
                    desc = `Ajuste Inventario: ${prodName}`
                } else {
                    return // Skip internal sales movements
                }

                if (s.type === 'SALE') { // Just in case
                    return
                }

                allActivities.push({
                    id: s.id,
                    type: type,
                    description: desc,
                    date: new Date(s.created_at),
                    meta: `${s.quantity > 0 ? '+' : ''}${s.quantity} un.`,
                    timestamp: new Date(s.created_at).getTime()
                })
            })

            newProducts?.forEach(p => {
                allActivities.push({
                    id: p.id,
                    type: 'product_add',
                    description: `Nuevo Producto: ${p.name}`,
                    date: new Date(p.created_at),
                    timestamp: new Date(p.created_at).getTime()
                })
            })


            // Sort and Limit
            allActivities.sort((a, b) => b.timestamp - a.timestamp)
            setRecentActivity(allActivities.slice(0, 50))
            setStats({
                totalStockValue: totalValue,
                monthlySales: monthTotalSales,
                monthlyProfit: netProfit,
                monthlyExpenses: monthTotalExpenses,
                salesCount: monthSalesItems?.length || 0,
                accountsReceivable: totalReceivable,
                accountsPayable: totalPayable
            })
            setLowStockProducts(lowStock)
            setLoading(false)
        }

        fetchStats()
    }, [])

    // Top Products Fetching
    useEffect(() => {
        async function fetchTopProducts() {
            setLoadingTopProducts(true)
            const end = new Date()
            const start = new Date()

            if (topProductsTimeRange === '1d') start.setHours(0, 0, 0, 0)
            if (topProductsTimeRange === '7d') start.setDate(end.getDate() - 7)
            if (topProductsTimeRange === '30d') start.setDate(end.getDate() - 30)
            if (topProductsTimeRange === '3m') start.setMonth(end.getMonth() - 3)
            if (topProductsTimeRange === '6m') start.setMonth(end.getMonth() - 6)

            const { data: topSalesRaw } = await supabase
                .from('sale_items')
                .select('quantity, unit_price_usd, product_id, products(name)')
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString())

            const productMap: Record<string, { name: string, quantity: number, total: number }> = {}

            if (topSalesRaw) {
                topSalesRaw.forEach((item: any) => {
                    const pid = item.product_id
                    const pname = item.products?.name || "Desconocido"
                    if (!productMap[pid]) productMap[pid] = { name: pname, quantity: 0, total: 0 }
                    productMap[pid].quantity += item.quantity
                    productMap[pid].total += item.quantity * item.unit_price_usd
                })
            }

            const sortedTop = Object.values(productMap)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5)

            setTopProducts(sortedTop)
            setLoadingTopProducts(false)
        }

        fetchTopProducts()
    }, [topProductsTimeRange])

    // Main Chart Data Fetching (Including Categories)
    useEffect(() => {
        async function fetchChartData() {
            setLoadingChart(true)
            const end = new Date()
            const start = new Date()

            if (timeRange === '7d') start.setDate(end.getDate() - 7)
            if (timeRange === '30d') start.setDate(end.getDate() - 30)
            if (timeRange === '3m') start.setMonth(end.getMonth() - 3)
            if (timeRange === '6m') start.setMonth(end.getMonth() - 6)

            const startStr = start.toISOString()
            const endStr = end.toISOString()

            // 1. Fetch Sales (Line Chart)
            const { data: sales } = await supabase
                .from('sales')
                .select('total_amount_usd, created_at')
                .gte('created_at', startStr)
                .lte('created_at', endStr)
                .order('created_at', { ascending: true })

            // 2. Fetch Category Data (Pie Chart)
            // We need sale_items joined with products to get category
            const { data: categoryItems } = await supabase
                .from('sale_items')
                .select(`
                    quantity,
                    unit_price_usd,
                    products!inner (category)
                `)
                .gte('created_at', startStr)
                .lte('created_at', endStr)

            // --- Process Line Chart Data ---
            if (!sales) {
                setChartData([])
                setCategoryData([])
                setLoadingChart(false)
                return
            }

            const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

            const dataMap: Record<string, number> = {}
            const sortedData: { name: string, value: number }[] = []

            if (timeRange === '6m') {
                for (let i = 5; i >= 0; i--) {
                    const d = new Date()
                    d.setMonth(d.getMonth() - i)
                    const key = monthNames[d.getMonth()]
                    dataMap[key] = 0
                }
                sales.forEach(s => {
                    const d = new Date(s.created_at)
                    const key = monthNames[d.getMonth()]
                    if (dataMap[key] !== undefined) dataMap[key] += s.total_amount_usd
                })
                for (let i = 5; i >= 0; i--) {
                    const d = new Date()
                    d.setMonth(d.getMonth() - i)
                    const key = monthNames[d.getMonth()]
                    sortedData.push({ name: key, value: dataMap[key] || 0 })
                }
            } else if (timeRange === '3m') {
                const weeks: Record<string, { total: number, sortDate: number }> = {}
                sales.forEach(s => {
                    const d = new Date(s.created_at)
                    const day = d.getDay()
                    const diff = d.getDate() - day + (day == 0 ? -6 : 1)
                    const monday = new Date(d.getFullYear(), d.getMonth(), diff)
                    const key = `${monday.getDate()} ${monthNames[monday.getMonth()]}`

                    if (!weeks[key]) weeks[key] = { total: 0, sortDate: monday.getTime() }
                    weeks[key].total += s.total_amount_usd
                })
                const sortedWeeks = Object.entries(weeks).sort((a, b) => a[1].sortDate - b[1].sortDate)
                sortedWeeks.forEach(([k, v]) => sortedData.push({ name: k, value: v.total }))
            } else {
                const daysCount = timeRange === '7d' ? 7 : 30
                for (let i = daysCount - 1; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const key = `${d.getDate()} ${monthNames[d.getMonth()]}`
                    dataMap[key] = 0
                }
                sales.forEach(s => {
                    const d = new Date(s.created_at)
                    const key = `${d.getDate()} ${monthNames[d.getMonth()]}`
                    if (dataMap[key] !== undefined) dataMap[key] += s.total_amount_usd
                })
                for (let i = daysCount - 1; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const key = `${d.getDate()} ${monthNames[d.getMonth()]}`
                    sortedData.push({ name: key, value: dataMap[key] || 0 })
                }
            }
            setChartData(sortedData)

            // --- Process Category Data ---
            const catMap: Record<string, number> = {}
            if (categoryItems) {
                categoryItems.forEach((item: any) => {
                    const catName = item.products?.category || "Sin Categoría"
                    const amount = item.quantity * item.unit_price_usd
                    catMap[catName] = (catMap[catName] || 0) + amount
                })
            }

            const processedCatData = Object.entries(catMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)

            setCategoryData(processedCatData)
            setLoadingChart(false)
        }
        fetchChartData()
    }, [timeRange])

    // Product Chart Data Fetching
    useEffect(() => {
        async function fetchProductChart() {
            if (!selectedProductId) return
            setLoadingProductChart(true)

            const end = new Date()
            const start = new Date()

            if (productTimeRange === '1d') start.setHours(0, 0, 0, 0)
            if (productTimeRange === '7d') start.setDate(end.getDate() - 7)
            if (productTimeRange === '30d') start.setDate(end.getDate() - 30)
            if (productTimeRange === '3m') start.setMonth(end.getMonth() - 3)
            if (productTimeRange === '6m') start.setMonth(end.getMonth() - 6)

            const { data: items } = await supabase
                .from('sale_items')
                .select('quantity, unit_price_usd, created_at')
                .eq('product_id', selectedProductId)
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString())
                .order('created_at', { ascending: true })

            const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
            const dataMap: Record<string, number> = {}
            const sortedData: { name: string, value: number }[] = []

            if (productTimeRange === '6m') {
                for (let i = 5; i >= 0; i--) {
                    const d = new Date()
                    d.setMonth(d.getMonth() - i)
                    const key = monthNames[d.getMonth()]
                    dataMap[key] = 0
                }
                items?.forEach(item => {
                    const d = new Date(item.created_at)
                    const key = monthNames[d.getMonth()]
                    if (dataMap[key] !== undefined) dataMap[key] += item.quantity
                })
                for (let i = 5; i >= 0; i--) {
                    const d = new Date()
                    d.setMonth(d.getMonth() - i)
                    const key = monthNames[d.getMonth()]
                    sortedData.push({ name: key, value: dataMap[key] || 0 })
                }
            } else if (productTimeRange === '3m') {
                const weeks: Record<string, { total: number, sortDate: number }> = {}
                items?.forEach(item => {
                    const d = new Date(item.created_at)
                    const day = d.getDay()
                    const diff = d.getDate() - day + (day == 0 ? -6 : 1)
                    const monday = new Date(d.getFullYear(), d.getMonth(), diff)
                    const key = `${monday.getDate()} ${monthNames[monday.getMonth()]}`

                    if (!weeks[key]) weeks[key] = { total: 0, sortDate: monday.getTime() }
                    weeks[key].total += (item.quantity * item.unit_price_usd)
                })
                const sortedWeeks = Object.entries(weeks).sort((a, b) => a[1].sortDate - b[1].sortDate)
                sortedWeeks.forEach(([k, v]) => sortedData.push({ name: k, value: v.total }))
            } else if (productTimeRange === '1d') {
                for (let i = 0; i < 24; i++) {
                    const key = `${i}:00`
                    dataMap[key] = 0
                }
                items?.forEach(item => {
                    const d = new Date(item.created_at)
                    const key = `${d.getHours()}:00`
                    if (dataMap[key] !== undefined) dataMap[key] += item.quantity
                })
                for (let i = 0; i < 24; i++) {
                    const key = `${i}:00`
                    sortedData.push({ name: key, value: dataMap[key] || 0 })
                }
            } else {
                // 7d or 30d
                const daysCount = productTimeRange === '7d' ? 7 : 30
                for (let i = daysCount - 1; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const key = `${d.getDate()} ${monthNames[d.getMonth()]}`
                    dataMap[key] = 0
                }
                items?.forEach(item => {
                    const d = new Date(item.created_at)
                    const key = `${d.getDate()} ${monthNames[d.getMonth()]}`
                    if (dataMap[key] !== undefined) dataMap[key] += item.quantity
                })
                for (let i = daysCount - 1; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const key = `${d.getDate()} ${monthNames[d.getMonth()]}`
                    sortedData.push({ name: key, value: dataMap[key] || 0 })
                }
            }

            setProductChartData(sortedData)
            setLoadingProductChart(false)
        }

        fetchProductChart()
    }, [selectedProductId, productTimeRange])

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>

            <MobileQuickActions />

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Cuentas por Cobrar"
                    value={`$${stats.accountsReceivable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={TrendingUp} // Or HandCoins if available, using TrendingUp as placeholder for Money coming in
                    description="Deuda de Clientes"
                    trend={stats.accountsReceivable > 0 ? "Por cobrar" : "Al día"}
                    trendUp={false} // Neutral or distinct style? Default green is fine for 'asset', but debt is risky. Let's keep specific style.
                />

                <KPICard
                    title="Cuentas por Pagar"
                    value={`$${stats.accountsPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={CreditCard}
                    description="Deuda a Proveedores"
                    trend={stats.accountsPayable > 0 ? "Pendiente" : "Al día"}
                    trendUp={false} // Red usually implies bad, debt is a liability.
                />

                <KPICard
                    title="Ventas del Mes"
                    value={`$${stats.monthlySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    description="Ingresos brutos"
                />

                <KPICard
                    title="Ganancia Neta"
                    value={`$${stats.monthlyProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={TrendingUp} // Reusing icon or different?
                    trend={stats.monthlyProfit > 0 ? "+Profit" : "Loss"}
                    trendUp={stats.monthlyProfit > 0}
                    description={`Desp. Gastos: $${stats.monthlyExpenses}`}
                />
            </div>

            {/* Low Stock Alert Banner */}
            {lowStockProducts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900">¡Alerta de Stock Bajo!</h4>
                            <p className="text-sm text-amber-700">Tienes {lowStockProducts.length} productos por debajo del mínimo.</p>
                        </div>
                    </div>
                    <Link
                        href="/inventory?filter=low_stock"
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        Ver Inventario
                    </Link>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* AI Widget (Left) */}
                <div className="col-span-2 h-[400px]">
                    <StockPredictionWidget />
                </div>

                {/* Sales & Category Charts Row (Right) */}
                <div className="col-span-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-[400px] flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                        <h3 className="text-lg font-semibold text-slate-900">Resumen de Ventas</h3>
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            {['7d', '30d', '3m', '6m'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range as any)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeRange === range ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {range.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loadingChart ? (
                        <div className="h-[300px] w-full flex items-center justify-center bg-slate-50 rounded-lg animate-pulse">
                            <div className="flex flex-col items-center gap-2">
                                <TrendingUp className="text-slate-300 h-8 w-8" />
                                <span className="text-slate-400 text-sm">Actualizando gráficas...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Line Chart (2 cols) */}
                            <div className="lg:col-span-2">
                                <SalesChart data={chartData} />
                            </div>

                            {/* Pie Chart (1 col) */}
                            <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-100 pt-8 lg:pt-0 lg:pl-8 flex flex-col">
                                <h4 className="text-sm font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider">Por Categoría</h4>
                                <div className="flex-1 min-h-[300px]">
                                    <CategoryPieChart data={categoryData} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Second Row: Top Products & Recent Activity */}
                <div className="col-span-7 grid grid-cols-1 lg:grid-cols-7 gap-4">
                    {/* Top Products (Left - 4 cols) */}
                    <div className="lg:col-span-4 h-[420px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Más Vendidos</h3>
                            <div className="flex items-center bg-slate-100 rounded-lg p-1 scale-90 origin-right">
                                {['1d', '7d', '30d', '3m', '6m'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTopProductsTimeRange(range as any)}
                                        className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${topProductsTimeRange === range ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {range.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {loadingTopProducts ? <div className="h-full bg-slate-50 rounded-xl animate-pulse" /> : <TopProducts products={topProducts} />}
                        </div>
                    </div>

                    {/* Recent Activity (Right - 3 cols) */}
                    <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-[420px] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900">Actividad Reciente</h3>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />)}
                            </div>
                        ) : (
                            <RecentActivity activities={recentActivity} />
                        )}
                    </div>
                </div>
            </div>

            {/* Product Sales Analysis Chart Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-slate-900">Análisis por Producto</h3>
                        <div className="relative">
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="appearance-none text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-lg py-2 pl-3 pr-10 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-colors cursor-pointer w-[240px]"
                                style={{
                                    backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23334155' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                                    backgroundPosition: "right 0.5rem center",
                                    backgroundRepeat: "no-repeat",
                                    backgroundSize: "1.5em 1.5em"
                                }}
                            >
                                <option value="" disabled className="text-slate-500">Seleccionar producto...</option>
                                {productList.map(p => (
                                    <option key={p.id} value={p.id} className="text-slate-900 font-medium py-1">
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setProductTimeRange('1d')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${productTimeRange === '1d' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            1D
                        </button>
                        <button
                            onClick={() => setProductTimeRange('7d')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${productTimeRange === '7d' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            7D
                        </button>
                        <button
                            onClick={() => setProductTimeRange('30d')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${productTimeRange === '30d' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            30D
                        </button>
                        <button
                            onClick={() => setProductTimeRange('3m')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${productTimeRange === '3m' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            3M
                        </button>
                        <button
                            onClick={() => setProductTimeRange('6m')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${productTimeRange === '6m' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            6M
                        </button>
                    </div>
                </div>
                {loadingProductChart ? (
                    <div className="h-[300px] w-full flex items-center justify-center bg-slate-50 rounded-lg animate-pulse">
                        <div className="flex flex-col items-center gap-2">
                            <TrendingUp className="text-slate-300 h-8 w-8" />
                            <span className="text-slate-400 text-sm">Cargando datos del producto...</span>
                        </div>
                    </div>
                ) : (
                    <ProductSalesChart
                        data={productChartData}
                        productName={productList.find(p => p.id === selectedProductId)?.name}
                    />
                )}
            </div>
        </div>
    )
}
