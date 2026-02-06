"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, Settings, BarChart3, ShoppingCart, Calendar as CalendarIcon, Truck, Users, Wallet, ShoppingBag, LogOut } from "lucide-react"
import { useSettings } from "@/contexts/SettingsContext"
import { cn } from "@/lib/utils"

import { useAuth } from "@/contexts/AuthContext"

export function Sidebar() {
    const pathname = usePathname()
    const { businessName, logoUrl } = useSettings()
    const { role, user, fullName, signOut } = useAuth()

    const allNavItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ['admin', 'seller'] },
        { name: "Inventario", href: "/inventory", icon: Package, roles: ['admin', 'seller'] },
        { name: "Ventas (POS)", href: "/sales", icon: ShoppingCart, roles: ['admin', 'seller'] },
        { name: "Clientes", href: "/customers", icon: Users, roles: ['admin', 'seller'] },
        { name: "Proveedores", href: "/suppliers", icon: Truck, roles: ['admin'] },
        { name: "Compras", href: "/purchases", icon: ShoppingBag, roles: ['admin'] },
        { name: "Gastos", href: "/expenses", icon: Wallet, roles: ['admin', 'seller'] },
        { name: "Calendario", href: "/calendar", icon: CalendarIcon, roles: ['admin', 'seller'] },
        { name: "Reportes", href: "/reports", icon: BarChart3, roles: ['admin'] },
        { name: "Configuración", href: "/settings", icon: Settings, roles: ['admin'] },
    ]

    const navItems = allNavItems.filter(item => role === 'admin' || item.roles.includes(role || 'seller'))

    return (
        <div className="hidden md:flex h-screen w-64 flex-col bg-slate-900 text-white">
            <div className="flex h-16 items-center px-6 border-b border-slate-800">
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-8 w-8 mr-2 rounded" />
                ) : (
                    <div className={`h-8 w-8 mr-2 rounded flex items-center justify-center font-bold text-white`} style={{ backgroundColor: 'var(--primary)' }}>
                        {businessName.charAt(0)}
                    </div>
                )}
                <span className="text-lg font-semibold truncate">{businessName}</span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "text-white"
                                    : "text-slate-200 hover:bg-slate-800 hover:text-white"
                            )}
                            style={isActive ? { backgroundColor: 'var(--primary)' } : {}}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0",
                                    isActive ? "text-white" : "text-slate-300 group-hover:text-white"
                                )}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                            <span className="text-xs font-medium text-slate-300">
                                {(fullName?.[0] || user?.email?.[0] || "U").toUpperCase()}
                            </span>
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-medium truncate w-32" title={fullName || user?.email || ''}>
                                {fullName || user?.email?.split('@')[0] || "Usuario"}
                            </p>
                            <p className="text-xs text-slate-400 capitalize">{role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
