
import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { Customer } from "@/types"
import { useExchangeRate } from "@/hooks/useExchangeRate"

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    customer: Customer | null
    onSave: (amountUSD: number, method: string, details?: Record<string, number>) => Promise<void>
}

export function PaymentModal({ isOpen, onClose, customer, onSave }: PaymentModalProps) {
    const { rate } = useExchangeRate()
    const [amountUSD, setAmountUSD] = useState<number | string>("")
    const [amountVES, setAmountVES] = useState<number | string>("")
    const [loading, setLoading] = useState(false)
    const [method, setMethod] = useState("cash")
    const [paymentDetails, setPaymentDetails] = useState<Record<string, number>>({})

    useEffect(() => {
        if (isOpen) {
            setAmountUSD("")
            setAmountVES("")
            setMethod("cash") // Reset to default
            setPaymentDetails({})
        }
    }, [isOpen])

    // Auto-calculate from details if Mixed
    useEffect(() => {
        if (method === 'mixed') {
            let total = 0
            Object.entries(paymentDetails).forEach(([key, val]) => {
                if (['pago_movil', 'cash_ves', 'point', 'transfer'].includes(key)) {
                    total += val / rate
                } else {
                    total += val
                }
            })
            setAmountUSD(total.toFixed(2))
            setAmountVES((total * rate).toFixed(2))
        }
    }, [paymentDetails, method, rate])

    const handleUSDChange = (val: string) => {
        if (method === 'mixed') return // Read-only in mixed mode
        setAmountUSD(val)
        const num = parseFloat(val)
        if (!isNaN(num)) {
            setAmountVES((num * rate).toFixed(2))
        } else {
            setAmountVES("")
        }
    }

    const handleVESChange = (val: string) => {
        if (method === 'mixed') return // Read-only in mixed mode
        setAmountVES(val)
        const num = parseFloat(val)
        if (!isNaN(num)) {
            setAmountUSD((num / rate).toFixed(2))
        } else {
            setAmountUSD("")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const amount = parseFloat(amountUSD.toString())
        if (!amount || amount <= 0) return

        setLoading(true)
        await onSave(amount, method, method === 'mixed' ? paymentDetails : undefined)
        setLoading(false)
        onClose()
    }

    if (!customer) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Registrar Abono - ${customer.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Deuda Actual:</span>
                        <span className="font-bold text-red-600">${customer.totalDebt?.toFixed(2) || "0.00"}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pago</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['cash', 'pago_movil', 'zelle', 'point', 'transfer', 'mixed'].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMethod(m)}
                                className={`px-2 py-2 text-sm font-medium rounded-lg border transition-all capitalize ${method === m
                                    ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] ring-1 ring-[var(--primary)]'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {m === 'cash' ? 'Efectivo' :
                                    m === 'pago_movil' ? 'Pago Móvil' :
                                        m === 'point' ? 'Punto' :
                                            m === 'transfer' ? 'Transf.' :
                                                m === 'mixed' ? 'Pago Mixto' :
                                                    m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mixed Payment Inputs */}
                {method === 'mixed' && (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="grid grid-cols-[30%_33%_33%] gap-2 mb-1 text-xs font-semibold text-slate-500">
                            <div>Método</div>
                            <div className="text-right">USD ($)</div>
                            <div className="text-right">Bs (x{rate})</div>
                        </div>
                        {[
                            { id: 'cash_usd', label: 'Efectivo $', code: 'USD' },
                            { id: 'zelle', label: 'Zelle', code: 'USD' },
                            { id: 'pago_movil', label: 'Pago Móvil', code: 'VES' },
                            { id: 'cash_ves', label: 'Efectivo Bs', code: 'VES' },
                            { id: 'point', label: 'Punto', code: 'VES' },
                        ].map((item) => {
                            const storedVal = paymentDetails[item.id] || 0
                            const isVesMethod = item.code === 'VES'
                            const isUsdExclusive = ['cash_usd', 'zelle'].includes(item.id)

                            // Calculate display values
                            const valUSD = isVesMethod ? (storedVal / rate) : storedVal
                            const valVES = isVesMethod ? storedVal : (storedVal * rate)

                            return (
                                <div key={item.id} className="grid grid-cols-[30%_33%_33%] gap-2 items-center">
                                    <span className="text-xs font-medium text-slate-800 truncate" title={item.label}>{item.label}</span>

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
                                            setPaymentDetails(prev => ({ ...prev, [item.id]: newStored }))
                                        }}
                                        className={`w-full text-right border border-slate-300 rounded px-1.5 py-1 text-sm font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 ${!isVesMethod ? 'bg-white' : 'bg-slate-100'}`}
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
                                                setPaymentDetails(prev => ({ ...prev, [item.id]: newStored }))
                                            }}
                                            className={`w-full text-right border border-slate-300 rounded px-1.5 py-1 text-sm font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 ${isVesMethod ? 'bg-white' : 'bg-slate-100'}`}
                                            placeholder="0"
                                        />
                                    ) : (
                                        <div className="w-full text-center text-slate-400 text-xs py-1.5 font-bold">-</div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Monto ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={customer.totalDebt} // Validation? Maybe allow overpayment? Let's stick to existing
                            readOnly={method === 'mixed'}
                            required
                            value={amountUSD}
                            onChange={(e) => handleUSDChange(e.target.value)}
                            className={`w-full border border-slate-300 rounded px-3 py-2 font-medium ${method === 'mixed' ? 'bg-slate-100 text-slate-500' : 'text-slate-900 focus:ring-2 focus:ring-[var(--primary)]'}`}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Monto (Bs)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            readOnly={method === 'mixed'}
                            value={amountVES}
                            onChange={(e) => handleVESChange(e.target.value)}
                            className={`w-full border border-slate-300 rounded px-3 py-2 font-medium ${method === 'mixed' ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-900 focus:ring-2 focus:ring-[var(--primary)]'}`}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="mr-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading || (parseFloat(amountUSD.toString()) <= 0)}
                        className="px-4 py-2 text-sm font-medium text-white rounded-md transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: 'var(--primary)' }}
                    >
                        {loading ? "Procesando..." : "Confirmar Pago"}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
