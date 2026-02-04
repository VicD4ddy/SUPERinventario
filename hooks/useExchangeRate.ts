"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"

export const useExchangeRate = () => {
    const supabase = createClient()
    const [rate, setRate] = useState<number>(0)
    const [isManual, setIsManual] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const fetchRate = useCallback(async () => {
        if (isManual) return
        setLoading(true)
        try {
            // 1. Try Fetching from Public API
            const response = await fetch("https://ve.dolarapi.com/v1/dolares/oficial")

            if (response.ok) {
                const data = await response.json()
                if (data && data.promedio) {
                    const newRate = parseFloat(data.promedio)
                    setRate(newRate)
                    setLastUpdated(new Date(data.fechaActualizacion || new Date()))

                    // Optional: Update DB backup silently (Fire & Forget)
                    // We catch errors here to prevent console noise (404/403) if user lacks permissions
                    supabase
                        .from('system_settings')
                        .upsert({
                            key: 'exchange_rate',
                            value: newRate.toString(),
                            description: 'Auto-updated from API'
                        })
                        .then(() => { })
                        .catch(() => { }) // Silent fail is intended here
                    return
                }
            }
            throw new Error("API Failed or Invalid Data")

        } catch (error) {
            console.warn("API Error, falling back to System Settings:", error)

            // 2. Fallback: Fetch from Supabase (System Settings)
            const { data, error: dbError } = await supabase
                .from('system_settings')
                .select('value, updated_at')
                .eq('key', 'exchange_rate')
                .single()

            if (data && data.value) {
                setRate(parseFloat(data.value))
                setLastUpdated(new Date(data.updated_at))
            } else {
                // 3. Last Resort: LocalStorage or Default
                const savedRate = localStorage.getItem("inventory_rate_value")
                if (savedRate) {
                    setRate(parseFloat(savedRate))
                } else {
                    setRate(50) // Absolute fallback
                }
            }
        } finally {
            setLoading(false)
        }
    }, [isManual, supabase])

    useEffect(() => {
        // Load saved manual rate preference
        const savedManual = localStorage.getItem("inventory_rate_manual")
        const savedRate = localStorage.getItem("inventory_rate_value")

        if (savedManual === "true" && savedRate) {
            setIsManual(true)
            setRate(parseFloat(savedRate))
            setLoading(false)
        } else {
            fetchRate()
        }
    }, [fetchRate])

    const updateRate = (newRate: number) => {
        setRate(newRate)
        localStorage.setItem("inventory_rate_value", newRate.toString())
        // Also update DB if in manual mode to persist for everyone? 
        // For now, let's keep manual mode local to the device unless we build a full admin panel for it.
        // But updating the system setting is good practice.
        supabase
            .from('system_settings')
            .upsert({
                key: 'exchange_rate',
                value: newRate.toString(),
                description: 'Manual update'
            })
            .then(() => { })
    }

    const toggleManualMode = (manual: boolean) => {
        setIsManual(manual)
        localStorage.setItem("inventory_rate_manual", manual.toString())
        if (!manual) {
            fetchRate()
        }
    }

    return {
        rate,
        isManual,
        loading,
        lastUpdated,
        updateRate,
        toggleManualMode,
        refreshRate: fetchRate
    }
}
