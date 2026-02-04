import { X } from "lucide-react"

interface FilterChipProps {
    label: string
    active: boolean
    onClick: () => void
    count?: number
    color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

export function FilterChip({ label, active, onClick, count, color = 'default' }: FilterChipProps) {
    const colors = {
        default: active
            ? 'bg-slate-900 text-white border-slate-900'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
        primary: active
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300',
        success: active
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300',
        warning: active
            ? 'bg-amber-600 text-white border-amber-600'
            : 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300',
        danger: active
            ? 'bg-red-600 text-white border-red-600'
            : 'bg-red-50 text-red-700 border-red-200 hover:border-red-300'
    }

    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all hover:shadow-sm active:scale-95 ${colors[color]}`}
        >
            <span>{label}</span>
            {count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${active ? 'bg-white/20' : 'bg-black/10'
                    }`}>
                    {count}
                </span>
            )}
            {active && (
                <X size={14} className="opacity-70 hover:opacity-100" />
            )}
        </button>
    )
}
