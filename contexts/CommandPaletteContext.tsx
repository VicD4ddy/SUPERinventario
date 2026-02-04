"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/utils/supabase/client"

interface CommandPaletteContextType {
    products: any[]
    customers: any[]
    refreshData: () => Promise<void>
}

const CommandPaletteContext = createContext<CommandPaletteContextType>({
    products: [],
    customers: [],
    refreshData: async () => { }
})

export function useCommandPaletteData() {
    return useContext(CommandPaletteContext)
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
    const [products, setProducts] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const supabase = createClient()

    const refreshData = async () => {
        try {
            // Fetch recent/popular products
            const { data: productsData } = await supabase
                .from('products')
                .select('*, category:categories(name)')
                .order('name')
                .limit(50)

            if (productsData) setProducts(productsData)

            // Fetch recent customers
            const { data: customersData } = await supabase
                .from('customers')
                .select('*')
                .order('name')
                .limit(50)

            if (customersData) setCustomers(customersData)
        } catch (error) {
            console.error('Error fetching command palette data:', error)
        }
    }

    useEffect(() => {
        refreshData()
    }, [])

    return (
        <CommandPaletteContext.Provider value={{ products, customers, refreshData }}>
            {children}
        </CommandPaletteContext.Provider>
    )
}
