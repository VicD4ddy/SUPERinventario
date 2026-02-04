"use client"

import { useExchangeRate } from "@/hooks/useExchangeRate"
import { RefreshCw, Edit2, Wifi, WifiOff, Bell, AlertTriangle, CheckCircle2, Info, X, Menu } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { MobileSidebar } from "@/components/layout/MobileSidebar"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { checkStockAlerts } from "@/utils/notifications"

export function Header() {
    const { rate, isManual, refreshRate, toggleManualMode, loading } = useExchangeRate()
    const pathname = usePathname()
    const router = useRouter()

    // Online Status
    const [isOnline, setIsOnline] = useState(true)
    useEffect(() => {
        setIsOnline(navigator.onLine)
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Notifications
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const notificationRef = useRef<HTMLDivElement>(null)

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        // Fetch: My notifications OR Global (user_id is null)
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .or(`user_id.eq.${user?.id},user_id.is.null`)
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
    }

    const markAsRead = async (id?: string) => {
        if (id) {
            await supabase.from('notifications').update({ is_read: true }).eq('id', id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } else {
            // Mark all visible as read
            const ids = notifications.filter(n => !n.is_read).map(n => n.id)
            if (ids.length > 0) {
                await supabase.from('notifications').update({ is_read: true }).in('id', ids)
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
                setUnreadCount(0)
            }
        }
    }

    useEffect(() => {
        // Initial Fetch
        fetchNotifications()

        // Run Stock Check Logic (Trigger alerts if needed)
        checkStockAlerts(supabase)

        // Realtime Subscription
        const subscription = supabase
            .channel('notifications_header')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
                // Determine if this notification is for us
                // payload.new.user_id check is tricky in client without auth context readily available in payload always
                // But we can just refetch for simplicity or optimistic update
                fetchNotifications()
            })
            .subscribe()

        // Close notifications on click outside
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            subscription.unsubscribe()
        }
    }, [])

    const getTitle = () => {
        switch (pathname) {
            case "/dashboard": return "Dashboard General"
            case "/inventory": return "Gestión de Inventario"
            case "/settings": return "Configuración del Sistema"
            case "/customers": return "Clientes"
            case "/reports": return "Reportes y Finanzas"
            case "/sales": return "Punto de Venta"
            default: return pathname.includes('inventory/') ? "Inventario" : "Bienvenido"
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle size={16} />
            case 'success': return <CheckCircle2 size={16} />
            case 'error': return <X size={16} />
            default: return <Info size={16} />
        }
    }

    const getColor = (type: string) => {
        switch (type) {
            case 'warning': return 'bg-yellow-100 text-yellow-600 border-l-yellow-500'
            case 'success': return 'bg-green-100 text-green-600 border-l-green-500'
            case 'error': return 'bg-red-100 text-red-600 border-l-red-500'
            default: return 'bg-blue-100 text-blue-600 border-l-blue-500'
        }
    }

    // Mobile Sidebar State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <>
            <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 shadow-sm z-20 relative">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight truncate max-w-[200px] md:max-w-none">{getTitle()}</h1>
                </div>

                <div className="flex items-center gap-2 md:gap-4">

                    {/* Connection Status */}
                    <div
                        className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isOnline
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200 animate-pulse"
                            }`}
                        title={isOnline ? "Conectado al Servidor" : "Sin Conexión"}
                    >
                        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                        <span className="hidden sm:inline">{isOnline ? "En Línea" : "Offline"}</span>
                    </div>

                    {/* Notifications */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                        >
                            <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] items-center justify-center flex text-white font-bold border-2 border-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                                    <h3 className="font-semibold text-sm text-slate-800">Notificaciones</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAsRead()}
                                            className="text-xs text-[var(--primary)] hover:underline font-medium"
                                        >
                                            Marcar todo leído
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => {
                                                    markAsRead(n.id)
                                                    if (n.link) {
                                                        setShowNotifications(false)
                                                        router.push(n.link)
                                                    }
                                                }}
                                                className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 ${getColor(n.type).split(' ').pop()} ${n.is_read ? 'opacity-60 grayscale-[0.5]' : 'bg-white'}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`p-2 rounded-full shrink-0 h-fit ${getColor(n.type).replace(/border-l-\w+/, '')}`}>
                                                        {getIcon(n.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-sm font-semibold text-slate-900 truncate pr-2">{n.title}</p>
                                                            <span className="text-[10px] text-slate-400 shrink-0">
                                                                {new Date(n.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                                            {n.message}
                                                        </p>
                                                    </div>
                                                    {!n.is_read && (
                                                        <span className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                                            <CheckCircle2 size={32} className="text-green-500 mb-2 opacity-50" />
                                            <p className="text-sm">Todo está en orden</p>
                                            <p className="text-xs text-slate-400">No tienes notificaciones nuevas</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Exchange Rate - High Contrast - Desktop Only */}
                    <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tasa BCV</span>
                            <div className="flex items-center bg-slate-900 text-white px-3 py-1 rounded-lg shadow-md hover:bg-slate-800 transition-colors">
                                <span className="font-bold text-lg tracking-tight">
                                    {loading ? "..." : `${rate.toFixed(2)}`}
                                </span>
                                <span className="text-xs text-slate-400 ml-1">Bs/$</span>
                                {isManual && <span className="ml-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Modo Manual Activo"></span>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => refreshRate()}
                                disabled={loading || isManual}
                                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors disabled:opacity-50"
                                title="Actualizar Tasa"
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            </button>
                            <button
                                onClick={() => toggleManualMode(!isManual)}
                                className={`p-1 rounded transition-colors ${isManual ? "text-yellow-600 bg-yellow-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
                                title={isManual ? "Desactivar Modo Manual" : "Activar Modo Manual"}
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        </>
    )
}
