import { Sale } from "@/types"
import { DollarSign, CreditCard, Banknote, Smartphone, Wallet } from "lucide-react"

interface DailyClosingSummaryProps {
    sales: Sale[]
    title?: string
}

export function DailyClosingSummary({ sales, title = "Resumen de Ventas" }: DailyClosingSummaryProps) {
    // 1. Calculate Totals by Method
    const totalsByMethod: Record<string, { usd: number, ves: number }> = {}
    let totalIncomeUSD = 0
    let totalIncomeVES = 0

    sales.forEach(sale => {
        // Allow sale, payment, expense, supplier_payment
        if (!['sale', 'payment', 'expense', 'supplier_payment'].includes(sale.type || '')) return;

        const isExpense = sale.type === 'expense' || sale.type === 'supplier_payment';
        const sign = isExpense ? -1 : 1;

        // Determine if we should use details or main method
        const details = sale.paymentDetails;
        const hasDetails = details && Object.keys(details).length > 0;

        if (hasDetails) {
            // Distribute mixed amounts
            Object.entries(details).forEach(([key, value]) => {
                if (value <= 0) return;

                let methodKey = key;
                if (key === 'cash_usd') methodKey = 'cash';
                if (key === 'cash_ves') methodKey = 'cash_ves';

                if (!totalsByMethod[methodKey]) totalsByMethod[methodKey] = { usd: 0, ves: 0 };

                // Calculate amounts
                let amountUSD = 0;
                let amountVES = 0;

                if (['cash_usd', 'zelle'].includes(key)) {
                    amountUSD = value;
                    amountVES = 0;
                } else {
                    // VES methods
                    // Heuristic: If value is very close to totalUSD (within small margin), it was likely stored as USD (legacy bug)
                    // OR if value matches amountPaidUSD (for partial payments that were stored as USD)
                    // otherwise, treat as VES
                    const valDiffTotal = Math.abs(value - sale.totalUSD);
                    const valDiffPaid = Math.abs(value - (sale.amountPaidUSD || 0));

                    const isLikelyUSD = valDiffTotal < 0.5 || (sale.amountPaidUSD && valDiffPaid < 0.5);

                    if (isLikelyUSD) {
                        amountUSD = value;
                        amountVES = value * sale.exchangeRate;
                    } else {
                        amountVES = value;
                        amountUSD = value / sale.exchangeRate; // Approx USD for total
                    }
                }

                totalsByMethod[methodKey].usd += (amountUSD * sign);
                totalsByMethod[methodKey].ves += (amountVES * sign);

                totalIncomeUSD += (amountUSD * sign);
                totalIncomeVES += (amountVES * sign);
            });
        } else {
            // Legacy/Single Method Logic
            let amountUSD = 0
            let amountVES = 0
            const method = sale.paymentMethod || 'cash'
            const isUSDMethod = method === 'zelle' || method === 'cash' || method === 'cash_usd'

            if (sale.type === 'sale') {
                if (sale.paymentStatus === 'paid') {
                    amountUSD = sale.totalUSD
                    amountVES = isUSDMethod ? 0 : sale.totalVES
                } else if (sale.paymentStatus === 'partial') {
                    amountUSD = sale.amountPaidUSD || 0
                    amountVES = isUSDMethod ? 0 : (sale.amountPaidVES || (amountUSD * sale.exchangeRate))
                }
            } else if (sale.type === 'payment') {
                amountUSD = sale.totalUSD
                amountVES = isUSDMethod ? 0 : sale.totalVES
            } else if (sale.type === 'expense') {
                amountUSD = sale.totalUSD
                amountVES = isUSDMethod ? 0 : sale.totalVES
            } else if (sale.type === 'supplier_payment') {
                amountUSD = sale.totalUSD
                amountVES = isUSDMethod ? 0 : sale.totalVES
            }

            if (amountUSD > 0) {
                if (!totalsByMethod[method]) totalsByMethod[method] = { usd: 0, ves: 0 }
                totalsByMethod[method].usd += (amountUSD * sign)
                totalsByMethod[method].ves += (amountVES * sign)

                totalIncomeUSD += (amountUSD * sign)
                totalIncomeVES += (amountVES * sign)
            }
        }
    })

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'cash': return <Banknote className="text-emerald-500" />
            case 'zelle': return <DollarSign className="text-indigo-500" />
            case 'pago_movil': return <Smartphone className="text-blue-500" />
            case 'point': return <CreditCard className="text-amber-500" />
            case 'transfer': return <Banknote className="text-purple-500" />
            default: return <Wallet className="text-slate-500" />
        }
    }

    const getMethodLabel = (method: string) => {
        switch (method) {
            case 'cash':
            case 'cash_usd': return "Efectivo USD"
            case 'cash_ves': return "Efectivo Bs"
            case 'zelle': return "Zelle"
            case 'pago_movil': return "Pago Móvil"
            case 'point': return "Punto de Venta"
            case 'transfer': return "Transferencia"
            default: return method
        }
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Wallet className="text-indigo-600" size={20} />
                    {title}
                </h3>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="block text-xs font-semibold text-slate-400 uppercase">Total Neto (Caja)</span>
                        <span className="text-2xl font-black text-emerald-600">
                            ${totalIncomeUSD.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-y md:divide-y-0 border-slate-100">
                {Object.entries(totalsByMethod).map(([method, amounts]) => {
                    if (method === 'mixed') return null
                    const isUSDOnly = method === 'zelle' || method === 'cash'
                    return (
                        <div key={method} className="p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                            <div className="mb-2 p-2 bg-white border border-slate-100 rounded-full shadow-sm">
                                {getMethodIcon(method)}
                            </div>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                {getMethodLabel(method)}
                            </span>
                            <span className="text-lg font-bold text-slate-700">
                                ${amounts.usd.toFixed(2)}
                            </span>
                            {!isUSDOnly && amounts.ves > 0 && (
                                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full mt-1">
                                    Bs {amounts.ves.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="bg-slate-50 px-6 py-2 text-center text-xs text-slate-400">
                * Los montos en Bolívares se muestran solo para métodos de pago en moneda nacional.
            </div>
        </div>
    )
}
