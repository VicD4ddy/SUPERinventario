import { Trash2, Download, Tag, X } from "lucide-react"

interface BulkActionBarProps {
    selectedCount: number
    onClear: () => void
    onDelete?: () => void
    onExport?: () => void
    onChangeCategory?: () => void
    customActions?: {
        label: string
        icon: any
        onClick: () => void
        color?: 'default' | 'danger' | 'success'
    }[]
}

export function BulkActionBar({
    selectedCount,
    onClear,
    onDelete,
    onExport,
    onChangeCategory,
    customActions = []
}: BulkActionBarProps) {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 border border-slate-700">
                {/* Count */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-sm">
                        {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-slate-700"></div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Download size={16} />
                            Exportar
                        </button>
                    )}

                    {onChangeCategory && (
                        <button
                            onClick={onChangeCategory}
                            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Tag size={16} />
                            Categoría
                        </button>
                    )}

                    {customActions.map((action, idx) => {
                        const Icon = action.icon
                        const bgColor = action.color === 'danger'
                            ? 'bg-red-500/20 hover:bg-red-500/30'
                            : action.color === 'success'
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30'
                                : 'bg-white/10 hover:bg-white/20'

                        return (
                            <button
                                key={idx}
                                onClick={action.onClick}
                                className={`flex items-center gap-2 px-3 py-2 ${bgColor} rounded-lg transition-colors text-sm font-medium`}
                            >
                                <Icon size={16} />
                                {action.label}
                            </button>
                        )
                    })}

                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-sm font-medium text-red-200"
                        >
                            <Trash2 size={16} />
                            Eliminar
                        </button>
                    )}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-slate-700"></div>

                {/* Clear */}
                <button
                    onClick={onClear}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Cancelar selección"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    )
}
