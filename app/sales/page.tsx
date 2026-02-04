"use client"

import { useState, useEffect } from "react"
import { ProductSearch } from "@/components/sales/ProductSearch"
import { POSCart } from "@/components/sales/POSCart"
import { Product, CartItem } from "@/types"
import { supabase } from "@/lib/supabase"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { useSettings } from "@/contexts/SettingsContext"
import { generatePOSTicket } from "@/utils/printTicket"
import BarcodeScanner from "@/components/ui/BarcodeScanner"
import { Modal } from "@/components/ui/Modal"
import { ScanBarcode, ShoppingBag, X } from "lucide-react"
import { VoiceAssistant } from "@/components/sales/VoiceAssistant"

export default function SalesPage() {
    const { rate } = useExchangeRate()
    const { businessName, phoneNumber, receiptFooter, paperSize, showTaxId } = useSettings()
    const [searchTerm, setSearchTerm] = useState("")
    const [products, setProducts] = useState<Product[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(false)
    const [saleDate, setSaleDate] = useState(() => {
        const d = new Date()
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        return d.toISOString().split('T')[0]
    })
    const [customerName, setCustomerName] = useState("")
    const [paymentType, setPaymentType] = useState<'full' | 'credit' | 'partial' | 'mixed'>('full')
    const [amountPaid, setAmountPaid] = useState(0)
    const [customerPhone, setCustomerPhone] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("cash")
    const [paymentDetails, setPaymentDetails] = useState<Record<string, number>>({})
    const [discount, setDiscount] = useState(0)
    const [paymentDueDate, setPaymentDueDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() + 7) // Default 7 days
        return d.toISOString().split('T')[0]
    })

    // Auto-calculate amountPaid from Mixed Details
    useEffect(() => {
        if (paymentType === 'mixed') {
            let total = 0
            Object.entries(paymentDetails).forEach(([key, val]) => {
                if (['pago_movil', 'cash_ves', 'point', 'transfer'].includes(key)) {
                    total += val / rate
                } else {
                    total += val
                }
            })
            setAmountPaid(total)
        }
    }, [paymentDetails, paymentType, rate])

    const handleHoldCart = () => {
        if (cart.length === 0) return
        const savedData = {
            cart,
            customerName,
            customerPhone,
            saleDate,
            discount
        }
        localStorage.setItem("heldCart", JSON.stringify(savedData))
        alert("Carrito guardado temporalmente. Puedes limpiar este carrito e iniciar otra venta.")
    }

    const checkHeldCart = () => {
        const held = localStorage.getItem("heldCart")
        if (held) {
            if (confirm("Hay un carrito guardado. ¿Deseas restaurarlo?")) {
                const data = JSON.parse(held)
                setCart(data.cart || [])
                setCustomerName(data.customerName || "")
                setCustomerPhone(data.customerPhone || "")
                setSaleDate(data.saleDate || new Date().toISOString().split('T')[0])
                setDiscount(data.discount || 0)
                localStorage.removeItem("heldCart")
            }
        }
    }

    useEffect(() => {
        checkHeldCart()
    }, [])

    // Search products effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            let query = supabase.from('products').select('*').limit(20)

            if (searchTerm.length > 0) {
                query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
            }

            const { data, error } = await query

            if (data) {
                const mappedProducts: Product[] = data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    barcode: item.barcode,
                    stock: item.stock,
                    costUSD: item.cost_usd,
                    priceUSD: item.price_usd,
                    createdAt: new Date(item.created_at),
                    updatedAt: new Date(item.updated_at),
                    description: item.description,
                }))
                setProducts(mappedProducts)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm])

    // Loyalty State
    const [customerPoints, setCustomerPoints] = useState(0)
    const [pointsRedeemed, setPointsRedeemed] = useState(0)

    // Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [lastScanned, setLastScanned] = useState<string | null>(null)


    const handleScanSuccess = async (decodedText: string) => {
        if (loading) return // Debounce/Prevent double scan while processing

        try {
            // 1. Play Sound
            if (useSettings().enableSounds) {
                const audio = new Audio('/sounds/beep.mp3') // Placeholder, reasonable to expect or fail silently
                audio.play().catch(e => console.log("Audio play failed", e))
            }

            // 2. Search Product by Barcode (Preferred) OR SKU
            let { data } = await supabase
                .from('products')
                .select('*')
                .eq('barcode', decodedText)
                .maybeSingle()

            // Fallback: Search by SKU
            if (!data) {
                const { data: skuData } = await supabase
                    .from('products')
                    .select('*')
                    .eq('sku', decodedText)
                    .maybeSingle()
                data = skuData
            }

            if (data) {
                // 3. Auto-Add to Cart
                const product: Product = {
                    id: data.id,
                    name: data.name,
                    sku: data.sku,
                    stock: data.stock,
                    costUSD: data.cost_usd,
                    priceUSD: data.price_usd,
                    createdAt: new Date(data.created_at),
                    updatedAt: new Date(data.updated_at),
                    description: data.description,
                }

                handleAddToCart(product)
                setLastScanned(`${product.name} agregado!`)

                // Clear message after 2s
                setTimeout(() => setLastScanned(null), 2000)

            } else {
                setLastScanned(`No encontrado: ${decodedText}`)
            }
        } catch (err) {
            console.error("Scan error", err)
        }
    }

    // Fetch customer details (points) when name matches
    useEffect(() => {
        const fetchCustomerDetails = async () => {
            if (customerName.length < 3) {
                setCustomerPoints(0)
                return
            }

            // Check if name matches an existing customer exactly (case insensitive)
            const { data } = await supabase
                .from('customers')
                .select('id, loyalty_points')
                .ilike('name', customerName.trim())
                .maybeSingle()

            if (data) {
                setCustomerPoints(data.loyalty_points || 0)
            } else {
                setCustomerPoints(0)
            }
        }

        const timer = setTimeout(fetchCustomerDetails, 500)
        return () => clearTimeout(timer)
    }, [customerName])

    // Search customers effect
    const [suggestedCustomers, setSuggestedCustomers] = useState<{ id: string, name: string, phone?: string }[]>([])

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (customerName.length < 2) {
                setSuggestedCustomers([])
                return
            }

            const { data } = await supabase
                .from('customers')
                .select('id, name, phone')
                .ilike('name', `%${customerName}%`)
                .limit(5)

            if (data) {
                setSuggestedCustomers(data)
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [customerName])

    const handleAddToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                if (existing.quantity < product.stock) {
                    return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
                }
                return prev // Max stock reached
            }
            return [...prev, { ...product, quantity: 1 }]
        })
    }

    const handleUpdateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQuantity = item.quantity + delta
                // Validate bounds (1 to stock)
                if (newQuantity >= 1 && newQuantity <= item.stock) {
                    return { ...item, quantity: newQuantity }
                }
            }
            return item
        }))
    }

    const handleRemoveItem = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId))
    }

    const handleCheckout = async () => {
        if (!confirm("¿Confirmar venta?")) return
        setLoading(true)

        try {
            const subtotalUSD = cart.reduce((acc, item) => acc + (item.priceUSD * item.quantity), 0)
            const discountAmount = subtotalUSD * (discount / 100)

            // Calculate Value of Redeemed Points (100 pts = $1 USD)
            const pointsValueUSD = pointsRedeemed / 100

            const totalUSD = Math.max(0, subtotalUSD - discountAmount - pointsValueUSD)
            const totalVES = totalUSD * rate

            // Determine timestamp
            let timestamp = new Date()

            // Reconstruct local today string to compare
            const now = new Date()
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
            const todayStr = now.toISOString().split('T')[0]

            if (saleDate !== todayStr) {
                timestamp = new Date(saleDate + 'T12:00:00')
            }

            // 0. Handle Customer (Find or Create)
            let customerId = null
            if (customerName.trim()) {
                const { data: existing } = await supabase
                    .from('customers')
                    .select('id')
                    .ilike('name', customerName.trim())
                    .maybeSingle()

                if (existing) {
                    customerId = existing.id
                } else {
                    const { data: newCustomer, error: createError } = await supabase
                        .from('customers')
                        .insert([{
                            name: customerName.trim(),
                            phone: customerPhone.trim(),
                            created_at: new Date()
                        }])
                        .select('id')
                        .single()

                    if (newCustomer) customerId = newCustomer.id
                }
            }

            // Calculate Payment & Status
            let finalPaidUSD = 0
            let finalStatus = 'paid'

            if (paymentType === 'full') {
                finalPaidUSD = totalUSD
                finalStatus = 'paid'
            } else if (paymentType === 'credit') {
                finalPaidUSD = 0
                finalStatus = 'pending'
            } else {
                finalPaidUSD = amountPaid
                // Use small epsilon for float comparison to avoid false 'partial'
                finalStatus = (finalPaidUSD >= totalUSD - 0.01) ? 'paid' : 'partial'
                // Cap paid amount at total just in case
                if (finalPaidUSD > totalUSD) finalPaidUSD = totalUSD
            }

            const debtUSD = totalUSD - finalPaidUSD

            // Validate Credit requires Customer name
            if ((paymentType === 'credit' || paymentType === 'partial') && !customerName.trim()) {
                throw new Error("Para ventas a crédito o abonos, el nombre del cliente es obligatorio.")
            }

            // Validate Points
            if (pointsRedeemed > 0 && (!customerId || pointsRedeemed > customerPoints)) {
                throw new Error("Error con los puntos de fidelidad. Verifique el cliente y la cantidad.")
            }

            // Get User for logging
            const { data: { user } } = await supabase.auth.getUser()
            const userId = user?.id

            // Prepare RPC Payload
            const saleData = {
                total_usd: totalUSD, // Net total after discounts and points
                total_ves: totalVES,
                rate,
                payment_status: finalStatus,
                method: paymentType === 'mixed' ? 'mixed' : paymentMethod,
                paid_usd: finalPaidUSD,
                paid_ves: finalPaidUSD * rate,
                customer_name: customerName,
                customer_phone: customerPhone,
                user_id: userId,
                payment_due_date: (paymentType === 'credit' || paymentType === 'partial') ? paymentDueDate : null,
                payment_details: paymentType === 'mixed' ? paymentDetails : (paymentType === 'full' || paymentType === 'partial') ? {
                    [paymentMethod]: ['pago_movil', 'point', 'transfer', 'cash_ves', 'biopago'].includes(paymentMethod)
                        ? (finalPaidUSD * rate)
                        : finalPaidUSD
                } : {},
                customer_id: customerId,
                points_redeemed: pointsRedeemed
            }

            const itemsPayload = cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.priceUSD
            }))

            // Call RPC
            const { data: rpcResponse, error: rpcError } = await supabase
                .rpc('process_sale', {
                    p_sale_data: saleData,
                    p_items: itemsPayload
                })

            if (rpcError) throw rpcError
            if (!rpcResponse.success) throw new Error(rpcResponse.error || 'Error desconocido al procesar venta')

            if (customerId && debtUSD > 0) {
                const { data: cust } = await supabase
                    .from('customers')
                    .select('total_debt, debt_since')
                    .eq('id', customerId)
                    .single()

                const currentDebt = cust?.total_debt || 0
                const updates: any = { total_debt: currentDebt + debtUSD }

                if (currentDebt <= 0) {
                    updates.debt_since = timestamp.toISOString()
                }

                await supabase
                    .from('customers')
                    .update(updates)
                    .eq('id', customerId)
            }

            alert("Venta procesada exitosamente!")

            // Print Receipt Option
            if (confirm("¿Desea imprimir el ticket de venta?")) {
                const ticketData = {
                    businessName: businessName || "Mi Negocio",
                    businessPhone: phoneNumber,
                    date: new Date(),
                    items: cart.map(item => ({
                        quantity: item.quantity,
                        name: item.name,
                        price: item.priceUSD,
                        total: item.quantity * item.priceUSD
                    })),
                    subtotal: subtotalUSD,
                    discount: discount,
                    total: totalUSD,
                    paymentMethod: paymentType === 'mixed' ? 'mixed' : (paymentMethod === 'cash' ? 'Efectivo' : paymentMethod.toUpperCase()),
                    paymentDetails: paymentType === 'mixed' ? paymentDetails : undefined,
                    amountPaid: finalPaidUSD,
                    change: 0,
                    ticketId: rpcResponse.sale_id?.slice(0, 8) || "PENDING"
                }

                generatePOSTicket(ticketData, {
                    footerMessage: receiptFooter,
                    paperSize: paperSize as '80mm' | '58mm',
                    showTaxId: showTaxId
                })
            }

            // Reset Layout
            setCart([])
            setSearchTerm("")
            setProducts([])
            setSaleDate(new Date().toISOString().split('T')[0])
            setPaymentDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
            setCustomerName("")
            setCustomerPhone("")
            setPaymentType('full')
            setAmountPaid(0)
            setPaymentMethod("cash")
            setDiscount(0)
            setCustomerPoints(0)
            setPointsRedeemed(0)
        } catch (error: any) {
            console.error("Checkout failed:", error)
            alert(`Error al procesar la venta: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    // Voice Handler
    const handleVoiceItems = async (items: any[]) => {
        setLoading(true)
        let addedCount = 0
        let notFound: string[] = []

        try {
            for (const item of items) {
                const queryTerm = item.product
                const qty = item.quantity || 1

                const { data } = await supabase
                    .from('products')
                    .select('*')
                    .or(`name.ilike.%${queryTerm}%, description.ilike.%${queryTerm}%`)
                    .limit(1)
                    .maybeSingle()

                if (data) {
                    const product: Product = {
                        id: data.id,
                        name: data.name,
                        sku: data.sku,
                        stock: data.stock,
                        costUSD: data.cost_usd,
                        priceUSD: data.price_usd,
                        createdAt: new Date(data.created_at),
                        updatedAt: new Date(data.updated_at),
                        description: data.description,
                    }

                    setCart(prev => {
                        const existing = prev.find(p => p.id === product.id)
                        if (existing) {
                            return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + qty } : p)
                        }
                        return [...prev, { ...product, quantity: qty }]
                    })
                    addedCount++
                } else {
                    notFound.push(queryTerm)
                }
            }

            if (addedCount > 0) {
                const audio = new Audio('/sounds/beep.mp3')
                audio.play().catch(() => { })
                alert(`Agregados ${addedCount} productos vía voz! 🎤`)
            }
            if (notFound.length > 0) {
                alert(`No encontré: ${notFound.join(', ')}`)
            }

        } catch (e) {
            console.error("Voice Error", e)
        } finally {
            setLoading(false)
        }
    }

    // Mobile Cart State
    const [isCartOpen, setIsCartOpen] = useState(false)

    // Calculate totals for sticky footer
    const currentSubtotal = cart.reduce((acc, item) => acc + (item.priceUSD * item.quantity), 0)

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col md:flex-row gap-6 relative">
            <div className="flex-1 min-h-[500px] overflow-y-auto pb-24 md:pb-0">
                <div className="w-full">
                    <ProductSearch
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        products={products}
                        onAddToCart={handleAddToCart}
                    />
                </div>

                <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white p-3 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <ScanBarcode size={20} />
                        Escanear
                    </button>
                    <div className="shrink-0 flex items-center justify-center">
                        <VoiceAssistant onItemsDetected={handleVoiceItems} />
                    </div>
                </div>
            </div>

            {/* Sticky Mobile Cart Trigger */}
            {cart.length > 0 && (
                <div className="fixed bottom-4 left-4 right-4 md:hidden z-40 animate-in slide-in-from-bottom-4 duration-500">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full flex items-center justify-between px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl active:scale-[0.98] transition-all ring-1 ring-white/20 backdrop-blur-xl group"
                    >
                        <div className="flex items-center gap-3">
                            <ShoppingBag className="text-white group-hover:rotate-12 transition-transform duration-300" size={24} />
                            <div className="flex flex-col items-start">
                                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Carrito</span>
                                <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded-md min-w-[2rem] text-center">
                                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total</span>
                            <span className="text-xl font-bold text-emerald-400">
                                ${(currentSubtotal * (1 - discount / 100)).toFixed(2)}
                            </span>
                        </div>
                    </button>
                    {/* Shadow glow */}
                    <div className="absolute -inset-1 bg-slate-900/30 rounded-2xl blur-lg -z-10" />
                </div>
            )}

            {/* Responsive Cart Container */}
            <div className={`
                fixed inset-0 z-50 bg-white flex flex-col transition-transform duration-300 ease-in-out
                ${isCartOpen ? 'translate-y-0' : 'translate-y-[110%]'}
                md:relative md:translate-y-0 md:inset-auto md:w-[400px] md:block md:bg-transparent
            `}>
                {/* Mobile Header for Cart */}
                <div className="flex items-center justify-between p-4 border-b md:hidden bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">Carrito de Compra</h2>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 text-slate-500 hover:bg-slate-200 rounded-full"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden md:overflow-visible flex flex-col h-full">
                    <POSCart
                        cart={cart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                        onClearCart={() => setCart([])}
                        onCheckout={(e) => {
                            setIsCartOpen(false) // Close modal on checkout start
                            handleCheckout(e)
                        }}
                        saleDate={saleDate}
                        onSaleDateChange={setSaleDate}
                        customerName={customerName}
                        onCustomerNameChange={setCustomerName}
                        customerPhone={customerPhone}
                        onCustomerPhoneChange={setCustomerPhone}
                        paymentType={paymentType}
                        onPaymentTypeChange={setPaymentType}
                        amountPaid={amountPaid}
                        onAmountPaidChange={setAmountPaid}
                        paymentMethod={paymentMethod}
                        onPaymentMethodChange={setPaymentMethod}
                        paymentDetails={paymentDetails}
                        onPaymentDetailsChange={setPaymentDetails}
                        suggestedCustomers={suggestedCustomers}
                        discount={discount}
                        onDiscountChange={setDiscount}
                        onHoldCart={handleHoldCart}
                        paymentDueDate={paymentDueDate}
                        onPaymentDueDateChange={setPaymentDueDate}
                        // Loyalty Props
                        customerPoints={customerPoints}
                        pointsRedeemed={pointsRedeemed}
                        onPointsRedeemedChange={setPointsRedeemed}
                        onAddToCart={handleAddToCart}
                    />
                </div>
            </div>

            <Modal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                title="Escanear Código de Barras"
            >
                <div className="flex flex-col items-center gap-4">
                    <BarcodeScanner
                        onScanSuccess={handleScanSuccess}
                    />
                    {lastScanned && (
                        <div className={`p-3 rounded-lg text-center font-bold w-full ${lastScanned.includes('No encontrado') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {lastScanned}
                        </div>
                    )}
                    <button
                        onClick={() => setIsScannerOpen(false)}
                        className="mt-2 text-slate-500 hover:text-slate-700 underline"
                    >
                        Cerrar Escáner
                    </button>
                </div>
            </Modal>
        </div>
    )
}
