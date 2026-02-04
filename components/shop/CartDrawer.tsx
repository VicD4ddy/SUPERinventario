"use client"

import { useCart } from "@/contexts/CartContext"
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react"
import { useSettings } from "@/contexts/SettingsContext" // To get business phone if available, else standard

export function CartDrawer() {
    const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalAmount, clearCart } = useCart()
    const { businessName, phoneNumber } = useSettings()
    // Use configured phone or fallback to a default if missing
    const businessPhone = phoneNumber || "584120000000"

    if (!isOpen) return null

    const handleCheckout = () => {
        // Construct WhatsApp Message
        let message = `*Nuevo Pedido - Loyafu Store*\n\n`
        items.forEach(item => {
            message += `• ${item.quantity}x ${item.name} - $${(item.priceUSD * item.quantity).toFixed(2)}\n`
        })
        message += `\n*Total: $${totalAmount.toFixed(2)}*`
        message += `\n\nHola, quisiera confirmar este pedido.`

        const url = `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-xl transform transition-transform duration-300 flex flex-col">
                <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <ShoppingBag className="text-[var(--primary)]" />
                        Tu Carrito
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <ShoppingBag size={48} className="opacity-20" />
                            <p>Tu carrito está vacío</p>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-[var(--primary)] font-medium hover:underline"
                            >
                                Seguir comprando
                            </button>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="flex gap-4 p-3 border rounded-xl bg-white shadow-sm">
                                {/* Image placeholder */}
                                <div className="h-20 w-20 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-400 font-bold overflow-hidden">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : item.name.charAt(0)}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-slate-900 line-clamp-1">{item.name}</h3>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-slate-500 text-sm">${item.priceUSD.toFixed(2)}</p>

                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-black disabled:opacity-50"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-black"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <div className="flex-1 text-right font-bold text-slate-900">
                                            ${(item.priceUSD * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-4 border-t bg-slate-50 space-y-4">
                        <div className="flex items-center justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>${totalAmount.toFixed(2)}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-green-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#25D366' }} // WhatsApp Green
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6 filter brightness-0 invert" alt="" />
                            Completar Pedido por WhatsApp
                        </button>
                        <p className="text-xs text-center text-slate-500">
                            Serás redirigido a WhatsApp para enviar tu pedido.
                        </p>
                    </div>
                )}
            </div>
        </>
    )
}
