"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingCart, Package, Users, BarChart3 } from "lucide-react"

const navItems = [
    {
        name: "Inicio",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        name: "Ventas",
        href: "/sales",
        icon: ShoppingCart,
    },
    {
        name: "Inventario",
        href: "/inventory",
        icon: Package,
    },
    {
        name: "Clientes",
        href: "/customers",
        icon: Users,
    },
    {
        name: "Reportes",
        href: "/reports",
        icon: BarChart3,
    },
]

export function BottomNavigation() {
    const pathname = usePathname()

    // Don't show on login or auth pages
    if (pathname?.startsWith('/login') || pathname?.startsWith('/auth')) {
        return null
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg safe-area-inset-bottom">
            <div className="grid grid-cols-5 h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 transition-all relative group active:scale-95 ${isActive
                                    ? 'text-[var(--primary)]'
                                    : 'text-slate-400 active:text-slate-600'
                                }`}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[var(--primary)] rounded-full" />
                            )}

                            {/* Icon with notification dot placeholder */}
                            <div className="relative">
                                <Icon
                                    size={22}
                                    className={`transition-all ${isActive ? 'scale-110' : 'group-active:scale-90'}`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                {/* Example: notification dot for Sales */}
                                {item.href === '/sales' && false && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                                )}
                            </div>

                            {/* Label */}
                            <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
