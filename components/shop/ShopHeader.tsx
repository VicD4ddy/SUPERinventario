"use client"

import { ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/contexts/CartContext"

export function ShopHeader() {
    const { itemCount, setIsOpen } = useCart()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                <Link href="/shop" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                    <span style={{ color: 'var(--primary)' }}>Loyafu</span>Store
                </Link>
                <nav className="flex items-center gap-4">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <ShoppingCart className="h-6 w-6 text-slate-700" />
                        {itemCount > 0 && (
                            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-in zoom-in">
                                {itemCount}
                            </span>
                        )}
                    </button>
                    <Link
                        href="/login"
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden md:block"
                    >
                        Admin Login
                    </Link>
                </nav>
            </div>
        </header>
    )
}
