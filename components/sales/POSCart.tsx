import { Trash2, Plus, Minus, ShoppingCart, Save, Award } from "lucide-react"
import { CartItem } from "@/types"
import { usePOSCart } from "@/hooks/usePOSCart"
import { RecommendationCarousel } from "@/components/sales/RecommendationCarousel"

interface POSCartProps {
    cart: CartItem[]
    onUpdateQuantity: (productId: string, delta: number) => void
    onRemoveItem: (productId: string) => void
    onClearCart: () => void
    onCheckout: () => void
    saleDate: string
    onSaleDateChange: (date: string) => void
    customerName: string
    onCustomerNameChange: (value: string) => void
    customerPhone: string
    onCustomerPhoneChange: (value: string) => void
    paymentType: 'full' | 'credit' | 'partial' | 'mixed'
    onPaymentTypeChange: (type: 'full' | 'credit' | 'partial' | 'mixed') => void
    amountPaid: number
    onAmountPaidChange: (amount: number) => void
    paymentMethod: string
    onPaymentMethodChange: (method: string) => void
    paymentDetails?: Record<string, number>
    onPaymentDetailsChange?: (details: Record<string, number>) => void
    suggestedCustomers?: { id: string, name: string, phone?: string }[]
    onHoldCart?: () => void
    discount?: number
    onDiscountChange?: (val: number) => void
    paymentDueDate?: string
    onPaymentDueDateChange?: (val: string) => void
    // Loyalty Props
    customerPoints?: number
    pointsRedeemed?: number
    onPointsRedeemedChange?: (val: number) => void
    onAddToCart?: (product: any) => void
}

export function POSCart({
    cart,
    onUpdateQuantity,
    onRemoveItem,
    onClearCart,
    onCheckout,
    saleDate,
    onSaleDateChange,
    customerName,
    onCustomerNameChange,
    customerPhone,
    onCustomerPhoneChange,
    paymentType,
    onPaymentTypeChange,
    amountPaid,
    onAmountPaidChange,
    paymentMethod,
    onPaymentMethodChange,
    paymentDetails = {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onPaymentDetailsChange = () => { },
    suggestedCustomers = [],
    onHoldCart = () => { },
    discount = 0,
    onDiscountChange = () => { },
    paymentDueDate = "",
    onPaymentDueDateChange = () => { },
    customerPoints = 0,
    pointsRedeemed = 0,
    onPointsRedeemedChange = () => { },
    onAddToCart
}: POSCartProps) {
    const {
        rate,
        totalUSD,
        finalTotalUSD,
        debtUSD,
        vesBuffer,
        setVesBuffer,
        isEditingVes,
        setIsEditingVes,
        usdBuffer,
        setUsdBuffer,
        isEditingUsd,
        setIsEditingUsd
    } = usePOSCart({
        cart,
        amountPaid,
        onAmountPaidChange,
        paymentType,
        customerName,
        onCustomerPhoneChange,
        suggestedCustomers,
        discount
    })

    // Calculate Points Value (100 pts = $1)
    const pointsValue = pointsRedeemed / 100
    // Recalculate Final Total locally to incoporate points
    // Note: usePOSCart might not be aware of points, so we adjust here for display
    // But ideally usePOSCart should handle logic. 
    // Since usePOSCart is a custom hook, I can't easily modify it without reading it. 
    // For now, I will manually calculate displayed totals here based on `totalUSD`.

    // totalUSD is gross subtotal. 
    // finalTotalUSD from hook likely includes discount.
    // Let's rely on manual calc for safety:
    const subtotal = cart.reduce((acc, item) => acc + (item.priceUSD * item.quantity), 0)
    const discountAmount = subtotal * (discount / 100)
    const totalAfterDiscountAndPoints = Math.max(0, subtotal - discountAmount - pointsValue)

    // Override final totals for display
    const displayTotalUSD = paymentType === 'credit' ? 0 : (paymentType === 'full' ? totalAfterDiscountAndPoints : amountPaid)
    const displayTotalVES = displayTotalUSD * rate

    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-semibold text-slate-900">Carrito</h3>
                </div>
                <div className="flex gap-2">
                    {cart.length > 0 && (
                        <button
                            onClick={onHoldCart}
                            className="text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1"
                            title="Guardar Carrito (Apartar)"
                        >
                            <Save size={14} />
                            Apartar
                        </button>
                    )}
                    {cart.length > 0 && (
                        <button
                            onClick={onClearCart}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                            Vaciar
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Content: Items + Inputs */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Items List */}
                <div className="space-y-4">
                    {cart.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                            <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                            <p>Vacío</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="flex justify-between items-start pb-4 border-b border-slate-100 last:border-0 block">
                                <div className="flex-1 min-w-0 pr-2">
                                    <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{item.name}</h4>
                                    <div className="text-xs text-slate-500 mt-1">
                                        ${item.priceUSD.toFixed(2)} x {item.quantity}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end space-y-2 shrink-0">
                                    <span className="font-bold text-slate-900">${(item.priceUSD * item.quantity).toFixed(2)}</span>
                                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, -1)}
                                            className="p-1 hover:bg-white rounded-md transition-colors text-slate-600"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, 1)}
                                            className="p-1 hover:bg-white rounded-md transition-colors text-slate-600"
                                            disabled={item.quantity >= item.stock}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onRemoveItem(item.id)}
                                    className="ml-3 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Recommendations (Inside Scroll) */}
                {onAddToCart && (
                    <div className="py-2">
                        <RecommendationCarousel
                            cartProductIds={cart.map(i => i.id)}
                            onAdd={(p) => onAddToCart({ ...p, quantity: 1, stock: p.stock || 99, costUSD: 0, priceUSD: p.price_usd, createdAt: new Date(), updatedAt: new Date(), sku: '', barcode: '', description: '' })}
                        />
                    </div>
                )}

                {/* Inputs & Configuration (Moved Inside Scroll) */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-3">
                    {/* Customer & Date */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block font-medium text-slate-500">Cliente</label>
                                {customerPoints > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-100">
                                        <Award size={10} />
                                        <span className="font-bold">{customerPoints} pts</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                list="customer-suggestions"
                                placeholder="Nombre..."
                                value={customerName}
                                onChange={(e) => onCustomerNameChange(e.target.value)}
                                className="w-full border border-slate-200 rounded px-2 py-1 text-slate-900 placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500"
                                autoComplete="off"
                            />
                            <datalist id="customer-suggestions">
                                {suggestedCustomers?.map(c => (
                                    <option key={c.id} value={c.name} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="block font-medium text-slate-500 mb-1">Fecha</label>
                            <input
                                type="date"
                                value={saleDate}
                                onChange={(e) => onSaleDateChange(e.target.value)}
                                className="w-full border border-slate-200 rounded px-2 py-1 text-slate-900 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Payment Type */}
                    <div>
                        <label className="block font-medium text-slate-500 mb-1">Tipo de Pago</label>
                        <div className="grid grid-cols-2 gap-1 mb-1">
                            <button
                                onClick={() => onPaymentTypeChange('full')}
                                className={`px-1 py-1.5 rounded text-center font-medium transition-colors ${paymentType === 'full' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                Contado
                            </button>
                            <button
                                onClick={() => onPaymentTypeChange('mixed')}
                                className={`px-1 py-1.5 rounded text-center font-medium transition-colors ${paymentType === 'mixed' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                Pago Mixto
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            <button
                                onClick={() => onPaymentTypeChange('partial')}
                                className={`px-1 py-1.5 rounded text-center font-medium transition-colors ${paymentType === 'partial' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                Abono
                            </button>
                            <button
                                onClick={() => onPaymentTypeChange('credit')}
                                className={`px-1 py-1.5 rounded text-center font-medium transition-colors ${paymentType === 'credit' ? 'bg-red-100 text-red-700 ring-1 ring-red-500' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                Fiado/Crédito
                            </button>
                        </div>
                    </div>

                    {/* Payment Due Date (If Credit/Partial) */}
                    {(paymentType === 'credit' || paymentType === 'partial') && onPaymentDueDateChange && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block font-medium text-red-600 mb-1">Fecha de Pago (Vencimiento)</label>
                            <input
                                type="date"
                                value={paymentDueDate}
                                onChange={(e) => onPaymentDueDateChange(e.target.value)}
                                className="w-full border border-red-200 bg-red-50 rounded px-2 py-1 text-red-900 focus:ring-1 focus:ring-red-500"
                            />
                        </div>
                    )}

                    {/* Mixed Payment Details */}
                    {paymentType === 'mixed' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-2">
                            <label className="block font-medium text-slate-500">Desglose de Pago</label>

                            {/* Header */}
                            <div className="grid grid-cols-[30%_33%_33%] gap-2 px-1 mb-1 text-xs font-semibold text-slate-500">
                                <div>Método</div>
                                <div className="text-right">USD ($)</div>
                                <div className="text-right">Bs (x{rate})</div>
                            </div>

                            <div className="space-y-1">
                                {[
                                    { id: 'cash_usd', label: 'Efectivo $', code: 'USD' },
                                    { id: 'zelle', label: 'Zelle', code: 'USD' },
                                    { id: 'pago_movil', label: 'Pago Móvil', code: 'VES' },
                                    { id: 'cash_ves', label: 'Efectivo Bs', code: 'VES' },
                                    { id: 'point', label: 'Punto', code: 'VES' },
                                ].map((m) => {
                                    const storedVal = paymentDetails[m.id] || 0
                                    const isVesMethod = m.code === 'VES'
                                    const isUsdExclusive = ['cash_usd', 'zelle'].includes(m.id)

                                    // Calculate display values
                                    const valUSD = isVesMethod ? (storedVal / rate) : storedVal
                                    const valVES = isVesMethod ? storedVal : (storedVal * rate)

                                    return (
                                        <div key={m.id} className="grid grid-cols-[30%_33%_33%] gap-2 items-center bg-slate-50 p-1.5 rounded">
                                            <span className="text-xs font-medium text-slate-600 truncate" title={m.label}>{m.label}</span>

                                            {/* USD Input */}
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={valUSD > 0 ? parseFloat(valUSD.toFixed(2)) : ''}
                                                onChange={(e) => {
                                                    const userUSD = parseFloat(e.target.value) || 0
                                                    let newStored = 0
                                                    if (isVesMethod) {
                                                        newStored = parseFloat((userUSD * rate).toFixed(2))
                                                    } else {
                                                        newStored = userUSD
                                                    }
                                                    onPaymentDetailsChange?.({ ...paymentDetails, [m.id]: newStored })
                                                }}
                                                className={`w-full text-right border rounded px-1.5 py-1 text-sm font-bold focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-300 ${!isVesMethod ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                                                placeholder="0"
                                            />

                                            {/* VES Input */}
                                            {!isUsdExclusive ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={valVES > 0 ? parseFloat(valVES.toFixed(2)) : ''}
                                                    onChange={(e) => {
                                                        const userVES = parseFloat(e.target.value) || 0
                                                        let newStored = 0
                                                        if (isVesMethod) {
                                                            newStored = userVES
                                                        } else {
                                                            newStored = parseFloat((userVES / rate).toFixed(2))
                                                        }
                                                        onPaymentDetailsChange?.({ ...paymentDetails, [m.id]: newStored })
                                                    }}
                                                    className={`w-full text-right border rounded px-1.5 py-1 text-sm font-bold focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-300 ${isVesMethod ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                                                    placeholder="0"
                                                />
                                            ) : (
                                                <div className="w-full text-center text-slate-400 text-xs py-1.5 font-bold">-</div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Payment Method Selector (Only if not Credit or Mixed) */}
                    {paymentType !== 'credit' && paymentType !== 'mixed' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="block font-medium text-slate-500 mb-1">Método de Pago</label>
                            <div className="grid grid-cols-3 gap-1">
                                {['cash', 'pago_movil', 'zelle', 'point', 'transfer'].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => onPaymentMethodChange(m)}
                                        className={`px-1 py-1.5 rounded text-xs font-medium transition-colors border ${paymentMethod === m
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {m === 'cash' ? 'Efectivo' :
                                            m === 'pago_movil' ? 'Pago Móvil' :
                                                m === 'point' ? 'Punto' :
                                                    m === 'transfer' ? 'Transf.' :
                                                        m.charAt(0).toUpperCase() + m.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Exclusive: Single Amount Input (Only if NOT credit or Mixed) */}
                    {paymentType !== 'credit' && paymentType !== 'mixed' && (
                        <div className={`animate-in fade-in slide-in-from-top-2 duration-200 grid ${!['cash', 'zelle'].includes(paymentMethod) ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                            <div>
                                <label className="block font-medium text-slate-500 mb-1">Monto ($)</label>
                                <input
                                    id="input-single-amount-usd"
                                    type="text"
                                    inputMode="decimal"
                                    value={usdBuffer}
                                    onFocus={() => setIsEditingUsd(true)}
                                    onBlur={() => {
                                        setIsEditingUsd(false)
                                        setUsdBuffer(amountPaid ? amountPaid.toString() : "")
                                    }}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        // Allow only numbers and one dot
                                        if (!/^\d*\.?\d*$/.test(val)) return

                                        setUsdBuffer(val)
                                        const numVal = parseFloat(val)
                                        if (isNaN(numVal)) {
                                            onAmountPaidChange(0)
                                        } else {
                                            onAmountPaidChange(numVal)
                                        }
                                    }}
                                    className="w-full border border-slate-200 rounded px-2 py-1 text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500"
                                    placeholder="0.00"
                                    disabled={paymentType === 'full'}
                                />
                            </div>
                            {!['cash', 'zelle'].includes(paymentMethod) && (
                                <div>
                                    <label className="block font-medium text-slate-500 mb-1">Monto (Bs)</label>
                                    <input
                                        id="input-single-amount-ves"
                                        type="text"
                                        value={vesBuffer}
                                        onFocus={() => setIsEditingVes(true)}
                                        onBlur={() => {
                                            setIsEditingVes(false)
                                            setVesBuffer(amountPaid ? (amountPaid * rate).toFixed(2) : "")
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            setVesBuffer(val)
                                            const numVal = parseFloat(val)
                                            if (isNaN(numVal)) {
                                                onAmountPaidChange(0)
                                            } else {
                                                onAmountPaidChange(parseFloat((numVal / rate).toFixed(2)))
                                            }
                                        }}
                                        className="w-full border border-slate-200 rounded px-2 py-1 text-indigo-700 font-bold focus:ring-1 focus:ring-indigo-500"
                                        placeholder="0.00"
                                        disabled={paymentType === 'full'}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Totals Summary */}
                <div className="space-y-1 pt-1 pb-4">
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                        <span className="text-xs">Descuento (%)</span>
                        <div className="flex items-center">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={discount > 0 ? discount : ""}
                                onChange={e => onDiscountChange(parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-12 text-right text-xs border-b border-slate-300 focus:border-indigo-500 outline-none bg-transparent"
                            />
                            <span className="ml-1">%</span>
                        </div>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-emerald-600 text-sm">
                            <span>Ahorro</span>
                            <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Loyalty Redemption */}
                    {customerPoints > 0 && (
                        <div className="space-y-1 py-1">
                            <div className="flex justify-between items-center text-amber-600 text-sm">
                                <span className="flex items-center gap-1"><Award size={12} /> Canjear Puntos</span>
                                <span>-${pointsValue.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="0"
                                    max={customerPoints}
                                    step="100"
                                    value={pointsRedeemed}
                                    onChange={(e) => onPointsRedeemedChange(parseInt(e.target.value))}
                                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                                <div className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded font-bold min-w-[30px] text-center">
                                    {pointsRedeemed}
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentType !== 'full' && (
                        <div className="flex justify-between text-red-600 font-medium">
                            <span>Deuda Generada</span>
                            <span>${(totalAfterDiscountAndPoints - amountPaid).toFixed(2)}</span>
                        </div>
                    )}

                    {/* Gap for button visibility */}
                    <div className="h-4 w-full"></div>
                </div>
            </div>

            {/* Sticky Footer Button */}
            <div className="p-4 bg-white border-t border-slate-200 z-10 sticky bottom-0">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <div className="text-slate-500 text-xs mb-0.5">Total a Pagar</div>
                        <div className="text-xl font-black text-slate-900 leading-none">
                            ${displayTotalUSD.toFixed(2)}
                        </div>
                    </div>
                    {!['cash', 'zelle'].includes(paymentMethod) && (
                        <div className="text-right">
                            <div className="text-slate-500 text-xs mb-0.5">En Bolívares</div>
                            <div className="text-xl font-black text-indigo-700 leading-none">
                                {(displayTotalVES).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={onCheckout}
                    disabled={cart.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                >
                    {paymentType === 'credit' ? 'Registrar Deuda' : 'Procesar Pago'}
                </button>
            </div>
        </div>
    )
}
