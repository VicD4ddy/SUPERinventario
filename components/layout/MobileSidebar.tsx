"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, Settings, BarChart3, ShoppingCart, Calendar as CalendarIcon, Truck, Users, Wallet, ShoppingBag, LogOut, X } from "lucide-react"
import { useSettings } from "@/contexts/SettingsContext"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

interface MobileSidebarProps {
    isOpen: boolean
    onClose: () => void
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    const pathname = usePathname()
    const { businessName, logoUrl } = useSettings()
    const { role, user, fullName, signOut } = useAuth()

    // Close on route change
    useEffect(() => {
        onClose()
    }, [pathname])

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const allNavItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ['admin', 'seller'] },
        { name: "Inventario", href: "/inventory", icon: Package, roles: ['admin', 'seller'] },
        { name: "Ventas (POS)", href: "/sales", icon: ShoppingCart, roles: ['admin', 'seller'] },
        { name: "Clientes", href: "/customers", icon: Users, roles: ['admin', 'seller'] },
        { name: "Proveedores", href: "/suppliers", icon: Truck, roles: ['admin'] },
        { name: "Compras", href: "/purchases", icon: ShoppingBag, roles: ['admin'] },
        { name: "Gastos", href: "/expenses", icon: Wallet, roles: ['admin'] },
        { name: "Calendario", href: "/calendar", icon: CalendarIcon, roles: ['admin', 'seller'] },
        { name: "Reportes", href: "/reports", icon: BarChart3, roles: ['admin'] },
        { name: "Configuración", href: "/settings", icon: Settings, roles: ['admin'] },
    ]

    const navItems = allNavItems.filter(item => role === 'admin' || item.roles.includes(role || 'seller'))

    if (!isOpen) return null

    // Use high z-index to ensure it appears above everything else
    // z-50 might be conflicted with other elements like BottomNav
    return (
        <div className="fixed inset-0 z-[100] flex">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Sidebar Content */}
            <div className="relative flex h-full w-4/5 max-w-xs flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-300">

                {/* Header with Gradient */}
                <div className="relative overflow-hidden h-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center px-6">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShoppingBag size={100} className="text-white transform rotate-12 translate-x-4 -translate-y-4" />
                    </div>

                    <div className="relative z-10 flex items-center w-full justify-between">
                        <div className="flex items-center gap-3">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-xl bg-white/10 p-1 backdrop-blur-md shadow-lg" />
                            ) : (
                                <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-lg border border-white/20">
                                    {businessName.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h2 className="text-white font-bold text-lg leading-tight tracking-tight truncate max-w-[140px]">{businessName}</h2>
                                <p className="text-slate-400 text-xs">Panel de Control</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <nav>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 mb-1",
                                        isActive
                                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 translate-x-1"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "mr-4 h-5 w-5 flex-shrink-0 transition-colors",
                                            isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                                        )}
                                    />
                                    {item.name}
                                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Footer Profile */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-slate-100 shadow-sm">
                                <span className="font-bold text-sm">
                                    {(fullName?.[0] || user?.email?.[0] || "U").toUpperCase()}
                                </span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate w-28 scale-y-100" title={fullName || user?.email || ''}>
                                    {fullName || user?.email?.split('@')[0] || "Usuario"}
                                </p>
                                <p className="text-[10px] uppercase tracking-wide font-bold text-slate-400">{role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
