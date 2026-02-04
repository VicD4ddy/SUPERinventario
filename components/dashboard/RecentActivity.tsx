"use client"

import { ShoppingCart, PackagePlus, ArrowRight, TrendingDown, TrendingUp, AlertCircle, RefreshCw, Clock, DollarSign, Truck } from "lucide-react"
import Link from "next/link"

interface ActivityItem {
    id: string
    type: 'sale' | 'credit' | 'product_add' | 'restock' | 'adjustment' | 'expense' | 'low_stock' | 'payment' | 'supplier_payment'
    description: string
    date: Date
    amount?: number
    meta?: string
}

interface RecentActivityProps {
    activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
    if (!activities || activities.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm">
                No hay actividad reciente
            </div>
        )
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'sale': return <ShoppingCart size={16} />
            case 'credit': return <Clock size={16} />
            case 'payment': return <DollarSign size={16} />
            case 'supplier_payment': return <Truck size={16} />
            case 'product_add': return <PackagePlus size={16} />
            case 'restock': return <TrendingUp size={16} />
            case 'adjustment': return <RefreshCw size={16} />
            case 'expense': return <TrendingDown size={16} />
            case 'low_stock': return <AlertCircle size={16} />
            default: return <ShoppingCart size={16} />
        }
    }

    const getStyles = (type: string) => {
        switch (type) {
            case 'sale': return 'bg-green-100 text-green-600'
            case 'credit': return 'bg-orange-100 text-orange-600'
            case 'payment': return 'bg-emerald-100 text-emerald-700'
            case 'supplier_payment': return 'bg-purple-100 text-purple-700'
            case 'product_add': return 'bg-purple-100 text-purple-600'
            case 'restock': return 'bg-blue-100 text-blue-600'
            case 'adjustment': return 'bg-amber-100 text-amber-600'
            case 'expense': return 'bg-red-100 text-red-600'
            case 'low_stock': return 'bg-orange-100 text-orange-600'
            default: return 'bg-slate-100 text-slate-600'
        }
    }

    return (
        <div className="space-y-4">
            {activities.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className={`p-2 rounded-full flex-shrink-0 ${getStyles(item.type)}`}>
                        {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {item.description}
                        </p>
                        <div className="flex justify-between items-center mt-0.5">
                            <p className="text-xs text-slate-500">
                                {new Intl.DateTimeFormat('es-VE', {
                                    month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                }).format(item.date)}
                            </p>
                            {item.meta && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{item.meta}</span>}
                        </div>
                    </div>
                    {item.amount !== undefined && (
                        <div className={`font-semibold text-sm ${(item.type === 'expense' || item.type === 'supplier_payment') ? 'text-red-600' : (item.type === 'credit' ? 'text-orange-600' : 'text-slate-900')}`}>
                            {(item.type === 'expense' || item.type === 'supplier_payment') ? '-' : '+'}${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
