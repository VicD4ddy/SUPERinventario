import { ReactNode } from "react"

interface MobileCardProps {
    children: ReactNode
    onClick?: () => void
    className?: string
}

export function MobileCard({ children, onClick, className = "" }: MobileCardProps) {
    return (
        <div
            onClick={onClick}
            className={`md:hidden bg-white rounded-xl border border-slate-200 p-4 shadow-sm active:shadow-md active:scale-[0.99] transition-all ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {children}
        </div>
    )
}

interface MobileCardRowProps {
    label: string
    value: ReactNode
    highlight?: boolean
}

export function MobileCardRow({ label, value, highlight }: MobileCardRowProps) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-600 font-medium">{label}</span>
            <span className={`text-sm font-semibold ${highlight ? 'text-[var(--primary)]' : 'text-slate-900'}`}>
                {value}
            </span>
        </div>
    )
}

interface MobileCardHeaderProps {
    title: string
    subtitle?: string
    badge?: ReactNode
}

export function MobileCardHeader({ title, subtitle, badge }: MobileCardHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-3 pb-3 border-b border-slate-200">
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{title}</h3>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {badge && <div className="ml-3 shrink-0">{badge}</div>}
        </div>
    )
}

interface MobileCardActionsProps {
    children: ReactNode
}

export function MobileCardActions({ children }: MobileCardActionsProps) {
    return (
        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
            {children}
        </div>
    )
}
