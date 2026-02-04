import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { SortDirection } from "@/hooks/useSortableTable"

interface SortableHeaderProps {
    label: string
    sortKey: string
    currentSortKey: string | null
    currentDirection: SortDirection
    onSort: (key: string) => void
    align?: 'left' | 'center' | 'right'
}

export function SortableHeader({
    label,
    sortKey,
    currentSortKey,
    currentDirection,
    onSort,
    align = 'left'
}: SortableHeaderProps) {
    const isActive = currentSortKey === sortKey
    const alignClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'

    return (
        <th
            className={`px-6 py-4 cursor-pointer select-none group hover:bg-slate-100 transition-colors ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
                }`}
            onClick={() => onSort(sortKey)}
        >
            <div className={`flex items-center gap-2 ${alignClass}`}>
                <span className={`text-xs uppercase tracking-wider font-semibold ${isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'
                    }`}>
                    {label}
                </span>
                <div className="w-4 h-4 flex items-center justify-center">
                    {isActive ? (
                        currentDirection === 'asc' ? (
                            <ArrowUp size={14} className="text-indigo-600" />
                        ) : (
                            <ArrowDown size={14} className="text-indigo-600" />
                        )
                    ) : (
                        <ArrowUpDown size={14} className="text-slate-300 group-hover:text-slate-400" />
                    )}
                </div>
            </div>
        </th>
    )
}
