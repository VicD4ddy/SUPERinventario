"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

interface SettingsContextType {
  businessName: string
  logoUrl: string | null
  themeColor: string
  phoneNumber: string
  // New Fields
  receiptFooter: string
  showTaxId: boolean
  paperSize: '80mm' | '58mm'
  defaultTaxRate: number
  currencySymbol: string
  allowNegativeStock: boolean
  lowStockThreshold: number
  enableSounds: boolean
  tableDensity: 'compact' | 'comfortable'
  // Update function
  updateSettings: (payload: Partial<SettingsState>) => Promise<void>
}

interface SettingsState {
  businessName: string
  logoUrl: string | null
  themeColor: string
  phoneNumber: string
  receiptFooter: string
  showTaxId: boolean
  paperSize: '80mm' | '58mm'
  defaultTaxRate: number
  currencySymbol: string
  allowNegativeStock: boolean
  lowStockThreshold: number
  enableSounds: boolean
  tableDensity: 'compact' | 'comfortable'
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  // State
  const [settings, setSettings] = useState<SettingsState>({
    businessName: "Mi Inventario",
    logoUrl: null,
    themeColor: "#4f46e5",
    phoneNumber: "",
    receiptFooter: "¡Gracias por su compra!",
    showTaxId: true,
    paperSize: '80mm',
    defaultTaxRate: 0,
    currencySymbol: "$",
    allowNegativeStock: false,
    lowStockThreshold: 5,
    enableSounds: true,
    tableDensity: 'comfortable'
  })

  // Apply theme color
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', settings.themeColor)
    const hex = settings.themeColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`)
    }
  }, [settings.themeColor])

  // Fetch settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('business_settings')
          .select('*') // Select all columns now
          .limit(1)
          .single()

        if (data) {
          setSettings({
            businessName: data.business_name || "Mi Inventario",
            logoUrl: data.logo_url,
            themeColor: data.theme_color || "#4f46e5",
            phoneNumber: data.phone_number || "",
            receiptFooter: data.receipt_footer || "¡Gracias por su compra!",
            showTaxId: data.show_tax_id ?? true,
            paperSize: data.paper_size || '80mm',
            defaultTaxRate: data.default_tax_rate || 0,
            currencySymbol: data.currency_symbol || "$",
            allowNegativeStock: data.allow_negative_stock || false,
            lowStockThreshold: data.low_stock_threshold || 5,
            enableSounds: data.enable_sounds ?? true,
            tableDensity: data.table_density || 'comfortable'
          })
        }
      } catch (err) {
        console.error("Unexpected error:", err)
      }
    }

    fetchSettings()
  }, [])

  const updateSettings = async (newSettings: Partial<SettingsState>) => {
    // Optimistic update
    setSettings(prev => ({ ...prev, ...newSettings }))

    try {
      const { data: existing } = await supabase.from('business_settings').select('id').limit(1).single()

      const payload = {
        business_name: newSettings.businessName,
        logo_url: newSettings.logoUrl,
        theme_color: newSettings.themeColor,
        phone_number: newSettings.phoneNumber,
        receipt_footer: newSettings.receiptFooter,
        show_tax_id: newSettings.showTaxId,
        paper_size: newSettings.paperSize,
        default_tax_rate: newSettings.defaultTaxRate,
        currency_symbol: newSettings.currencySymbol,
        allow_negative_stock: newSettings.allowNegativeStock,
        low_stock_threshold: newSettings.lowStockThreshold,
        enable_sounds: newSettings.enableSounds,
        table_density: newSettings.tableDensity,
        updated_at: new Date()
      }

      // Filter out undefined values from payload before sending to Supabase? 
      // Actually, we should merge with existing state to ensure we don't overwrite with nulls if we passed partial.
      // But for simplicity, the UI passes fully formed updates usually. 
      // Let's make it robust by merging current state + newSettings for the DB payload.

      const fullSettings = { ...settings, ...newSettings }
      const dbPayload = {
        business_name: fullSettings.businessName,
        logo_url: fullSettings.logoUrl,
        theme_color: fullSettings.themeColor,
        phone_number: fullSettings.phoneNumber,
        receipt_footer: fullSettings.receiptFooter,
        show_tax_id: fullSettings.showTaxId,
        paper_size: fullSettings.paperSize,
        default_tax_rate: fullSettings.defaultTaxRate,
        currency_symbol: fullSettings.currencySymbol,
        allow_negative_stock: fullSettings.allowNegativeStock,
        low_stock_threshold: fullSettings.lowStockThreshold,
        enable_sounds: fullSettings.enableSounds,
        table_density: fullSettings.tableDensity,
        updated_at: new Date()
      }

      if (existing) {
        await supabase
          .from('business_settings')
          .update(dbPayload)
          .eq('id', existing.id)
      } else {
        await supabase
          .from('business_settings')
          .insert([dbPayload])
      }

    } catch (err) {
      console.error("Error saving settings:", err)
    }
  }

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
