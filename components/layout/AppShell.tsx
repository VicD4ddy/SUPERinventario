"use client"

import { usePathname } from 'next/navigation'
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { BottomNavigation } from "@/components/layout/BottomNavigation"

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    // Check if we are on a login/auth page
    const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/auth')

    if (isAuthPage) {
        return <>{children}</>
    }

    return (
        <>
            <div className="flex h-screen bg-slate-50 overflow-hidden">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
                        {children}
                    </main>
                </div>
            </div>
            <BottomNavigation />
        </>
    )
}
