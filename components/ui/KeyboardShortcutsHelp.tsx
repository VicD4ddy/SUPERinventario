"use client"

import { useState } from "react"
import { X, Keyboard } from "lucide-react"
import { useKeyboardShortcuts, getModifierKey } from "@/hooks/useKeyboardShortcuts"

interface Shortcut {
    keys: string[]
    description: string
    category: string
}

const shortcuts: Shortcut[] = [
    // Global
    { keys: [getModifierKey(), 'K'], description: 'Abrir paleta de comandos', category: 'Global' },
    { keys: [getModifierKey(), '/'], description: 'Mostrar atajos de teclado', category: 'Global' },
    { keys: ['Esc'], description: 'Cerrar modal/paleta', category: 'Global' },

    // Navigation
    { keys: ['G', 'D'], description: 'Ir a Dashboard', category: 'Navegación' },
    { keys: ['G', 'S'], description: 'Ir a Ventas', category: 'Navegación' },
    { keys: ['G', 'I'], description: 'Ir a Inventario', category: 'Navegación' },
    { keys: ['G', 'C'], description: 'Ir a Clientes', category: 'Navegación' },
    { keys: ['G', 'R'], description: 'Ir a Reportes', category: 'Navegación' },

    // Actions
    { keys: [getModifierKey(), 'N'], description: 'Nueva venta', category: 'Acciones' },
    { keys: [getModifierKey(), 'I'], description: 'Nuevo producto', category: 'Acciones' },
    { keys: [getModifierKey(), 'F'], description: 'Buscar', category: 'Acciones' },
    { keys: [getModifierKey(), 'S'], description: 'Guardar/Enviar', category: 'Acciones' },

    // Command Palette
    { keys: ['↑', '↓'], description: 'Navegar opciones', category: 'Paleta de Comandos' },
    { keys: ['Enter'], description: 'Seleccionar', category: 'Paleta de Comandos' },
]

export function KeyboardShortcutsHelp() {
    const [isOpen, setIsOpen] = useState(false)

    useKeyboardShortcuts([
        {
            key: '/',
            ctrl: true,
            callback: () => setIsOpen(true),
            description: 'Show shortcuts help'
        }
    ])

    if (!isOpen) return null

    // Group by category
    const categories = Array.from(new Set(shortcuts.map(s => s.category)))

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Keyboard className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Atajos de Teclado</h2>
                            <p className="text-sm text-slate-500">Productividad al máximo</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {categories.map(category => (
                            <div key={category}>
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                                    {category}
                                </h3>
                                <div className="space-y-2">
                                    {shortcuts
                                        .filter(s => s.category === category)
                                        .map((shortcut, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-lg transition-colors">
                                                <span className="text-sm text-slate-600">{shortcut.description}</span>
                                                <div className="flex items-center gap-1">
                                                    {shortcut.keys.map((key, i) => (
                                                        <div key={i} className="flex items-center gap-1">
                                                            {i > 0 && <span className="text-slate-400 text-xs">+</span>}
                                                            <kbd className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded shadow-sm">
                                                                {key}
                                                            </kbd>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
                    <p className="text-xs text-slate-500 text-center">
                        Presiona <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-mono">Esc</kbd> para cerrar
                    </p>
                </div>
            </div>
        </div>
    )
}
