"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { Product } from "@/types"

export interface CartItem extends Product {
    quantity: number
}

interface CartContextType {
    items: CartItem[]
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
    addItem: (product: Product) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    itemCount: number
    totalAmount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isOpen, setIsOpen] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('cart')
        if (saved) {
            try {
                setItems(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse cart", e)
            }
        }
    }, [])

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items))
    }, [items])

    const addItem = (product: Product) => {
        setItems(current => {
            const existing = current.find(item => item.id === product.id)
            if (existing) {
                return current.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...current, { ...product, quantity: 1 }]
        })
        setIsOpen(true) // Open cart when adding
    }

    const removeItem = (productId: string) => {
        setItems(current => current.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(productId)
            return
        }
        setItems(current =>
            current.map(item =>
                item.id === productId ? { ...item, quantity } : item
            )
        )
    }

    const clearCart = () => setItems([])

    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
    const totalAmount = items.reduce((acc, item) => acc + (item.priceUSD * item.quantity), 0)

    return (
        <CartContext.Provider value={{
            items,
            isOpen,
            setIsOpen,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            itemCount,
            totalAmount
        }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
