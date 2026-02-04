"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
    Search,
    ShoppingCart,
    Package,
    Users,
    BarChart3,
    LayoutDashboard,
    DollarSign,
    Truck,
    Calendar,
    Settings,
    Plus,
    FileText,
    X,
    Command
} from "lucide-react"
import { useKeyboardShortcuts, getModifierKey } from "@/hooks/useKeyboardShortcuts"

interface CommandItem {
    id: string
    type: 'product' | 'customer' | 'action' | 'navigation'
    label: string
    description?: string
    icon: any
    action: () => void
    keywords?: string[]
}

interface CommandPaletteProps {
    products?: any[]
    customers?: any[]
}

export function CommandPalette({ products = [], customers = [] }: CommandPaletteProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [selectedIndex, setSelectedIndex] = useState(0)
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    // Global shortcut to open palette
    useKeyboardShortcuts([
        {
            key: 'k',
            ctrl: true,
            callback: () => {
                setIsOpen(true)
                setSearch("")
                setSelectedIndex(0)
            },
            description: 'Open Command Palette'
        },
        {
            key: 'Escape',
            callback: () => setIsOpen(false),
            description: 'Close Command Palette'
        }
    ])

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    // Navigation commands
    const navigationCommands: CommandItem[] = [
        {
            id: 'nav-dashboard',
            type: 'navigation',
            label: 'Dashboard',
            description: 'Ir al panel principal',
            icon: LayoutDashboard,
            action: () => { router.push('/dashboard'); setIsOpen(false) },
            keywords: ['inicio', 'home', 'panel']
        },
        {
            id: 'nav-sales',
            type: 'navigation',
            label: 'Punto de Venta',
            description: 'Abrir POS',
            icon: ShoppingCart,
            action: () => { router.push('/sales'); setIsOpen(false) },
            keywords: ['venta', 'pos', 'vender', 'cobrar']
        },
        {
            id: 'nav-inventory',
            type: 'navigation',
            label: 'Inventario',
            description: 'Ver productos',
            icon: Package,
            action: () => { router.push('/inventory'); setIsOpen(false) },
            keywords: ['productos', 'stock', 'almacen']
        },
        {
            id: 'nav-customers',
            type: 'navigation',
            label: 'Clientes',
            description: 'Gestionar clientes',
            icon: Users,
            action: () => { router.push('/customers'); setIsOpen(false) },
            keywords: ['crm', 'contactos']
        },
        {
            id: 'nav-suppliers',
            type: 'navigation',
            label: 'Proveedores',
            description: 'Gestionar proveedores',
            icon: Truck,
            action: () => { router.push('/suppliers'); setIsOpen(false) },
            keywords: ['distribuidores']
        },
        {
            id: 'nav-expenses',
            type: 'navigation',
            label: 'Gastos',
            description: 'Ver gastos operativos',
            icon: DollarSign,
            action: () => { router.push('/expenses'); setIsOpen(false) },
            keywords: ['egresos', 'pagos']
        },
        {
            id: 'nav-reports',
            type: 'navigation',
            label: 'Reportes',
            description: 'Análisis y reportes',
            icon: BarChart3,
            action: () => { router.push('/reports'); setIsOpen(false) },
            keywords: ['analytics', 'estadisticas']
        },
        {
            id: 'nav-calendar',
            type: 'navigation',
            label: 'Calendario',
            description: 'Cuentas por cobrar/pagar',
            icon: Calendar,
            action: () => { router.push('/calendar'); setIsOpen(false) },
            keywords: ['agenda', 'cuentas']
        },
        {
            id: 'nav-settings',
            type: 'navigation',
            label: 'Configuración',
            description: 'Ajustes del sistema',
            icon: Settings,
            action: () => { router.push('/settings'); setIsOpen(false) },
            keywords: ['ajustes', 'preferencias']
        }
    ]

    // Action commands
    const actionCommands: CommandItem[] = [
        {
            id: 'action-new-sale',
            type: 'action',
            label: 'Nueva Venta',
            description: 'Iniciar punto de venta',
            icon: Plus,
            action: () => { router.push('/sales'); setIsOpen(false) },
            keywords: ['vender', 'cobrar']
        },
        {
            id: 'action-new-product',
            type: 'action',
            label: 'Nuevo Producto',
            description: 'Agregar producto al inventario',
            icon: Plus,
            action: () => {
                router.push('/inventory')
                setIsOpen(false)
                // Trigger new product modal (would need context)
            },
            keywords: ['agregar', 'crear']
        },
        {
            id: 'action-new-customer',
            type: 'action',
            label: 'Nuevo Cliente',
            description: 'Registrar cliente',
            icon: Plus,
            action: () => { router.push('/customers'); setIsOpen(false) },
            keywords: ['agregar', 'crear']
        }
    ]

    // Product commands (from props)
    const productCommands: CommandItem[] = products.slice(0, 10).map(product => ({
        id: `product-${product.id}`,
        type: 'product' as const,
        label: product.name,
        description: `SKU: ${product.sku} • Stock: ${product.stock}`,
        icon: Package,
        action: () => {
            router.push(`/inventory?search=${product.sku}`)
            setIsOpen(false)
        },
        keywords: [product.sku, product.category?.name || '']
    }))

    // Customer commands (from props)
    const customerCommands: CommandItem[] = customers.slice(0, 10).map(customer => ({
        id: `customer-${customer.id}`,
        type: 'customer' as const,
        label: customer.name,
        description: customer.phone || customer.email,
        icon: Users,
        action: () => {
            router.push(`/customers?search=${customer.name}`)
            setIsOpen(false)
        },
        keywords: [customer.phone || '', customer.email || '']
    }))

    // All commands
    const allCommands = [
        ...actionCommands,
        ...navigationCommands,
        ...productCommands,
        ...customerCommands
    ]

    // Fuzzy search
    const filteredCommands = useMemo(() => {
        if (!search) return allCommands.slice(0, 8)

        const searchLower = search.toLowerCase()
        return allCommands
            .filter(cmd => {
                const labelMatch = cmd.label.toLowerCase().includes(searchLower)
                const descMatch = cmd.description?.toLowerCase().includes(searchLower)
                const keywordMatch = cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
                return labelMatch || descMatch || keywordMatch
            })
            .slice(0, 8)
    }, [search, allCommands])

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
            } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
                e.preventDefault()
                filteredCommands[selectedIndex].action()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, selectedIndex, filteredCommands])

    // Reset selected index when search changes
    useEffect(() => {
        setSelectedIndex(0)
    }, [search])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 slide-in-from-top-2 duration-300">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
                    <Search className="text-slate-400" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar productos, clientes, acciones..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 outline-none text-slate-900 placeholder:text-slate-400"
                    />
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded">
                        Esc
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                    {filteredCommands.length === 0 ? (
                        <div className="px-4 py-12 text-center text-slate-400">
                            <FileText className="mx-auto mb-2 opacity-50" size={32} />
                            <p>No se encontraron resultados</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {filteredCommands.map((cmd, index) => {
                                const Icon = cmd.icon
                                const isSelected = index === selectedIndex

                                return (
                                    <button
                                        key={cmd.id}
                                        onClick={cmd.action}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected
                                                ? 'bg-indigo-50 text-indigo-900'
                                                : 'hover:bg-slate-50 text-slate-900'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100' : 'bg-slate-100'
                                            }`}>
                                            <Icon size={18} className={isSelected ? 'text-indigo-600' : 'text-slate-600'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{cmd.label}</p>
                                            {cmd.description && (
                                                <p className="text-xs text-slate-500 truncate">{cmd.description}</p>
                                            )}
                                        </div>
                                        {cmd.type === 'navigation' && (
                                            <span className="text-xs text-slate-400">→</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="hidden sm:flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">↓</kbd>
                            Navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">↵</kbd>
                            Seleccionar
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <Command size={12} />
                        <span>+</span>
                        <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">K</kbd>
                        para abrir
                    </span>
                </div>
            </div>
        </div>
    )
}
