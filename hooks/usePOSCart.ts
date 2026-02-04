import { useState, useEffect } from "react"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { CartItem } from "@/types"

export interface UsePOSCartProps {
    cart: CartItem[]
    amountPaid: number
    onAmountPaidChange: (amount: number) => void
    paymentType: 'full' | 'credit' | 'partial' | 'mixed'
    customerName: string
    onCustomerPhoneChange: (phone: string) => void
    suggestedCustomers: { id: string, name: string, phone?: string }[]
    discount?: number
}

export const usePOSCart = ({
    cart,
    amountPaid,
    onAmountPaidChange,
    paymentType,
    customerName,
    onCustomerPhoneChange,
    suggestedCustomers = [],
    discount = 0
}: UsePOSCartProps) => {
    const { rate } = useExchangeRate()

    // Buffer state for VES input to allow smooth typing
    const [vesBuffer, setVesBuffer] = useState("")
    const [isEditingVes, setIsEditingVes] = useState(false)

    // Buffer for USD input
    const [usdBuffer, setUsdBuffer] = useState("")
    const [isEditingUsd, setIsEditingUsd] = useState(false)

    const totalUSD = cart.reduce((acc, item) => acc + (item.priceUSD * item.quantity), 0)

    // Auto-fill phone when customer name matches a suggestion
    useEffect(() => {
        const match = suggestedCustomers.find(c => c.name.toLowerCase() === customerName.toLowerCase())
        if (match && match.phone) {
            onCustomerPhoneChange(match.phone)
        }
    }, [customerName, suggestedCustomers, onCustomerPhoneChange])

    // Sync buffer with external amountPaid changes (unless we are editing)
    useEffect(() => {
        if (!isEditingVes && !isEditingUsd) {
            const displayAmount = paymentType === 'full' ? totalUSD : amountPaid

            setVesBuffer(displayAmount ? (displayAmount * rate).toFixed(2) : "")
            setUsdBuffer(displayAmount ? displayAmount.toString() : "")
        }
    }, [amountPaid, rate, isEditingVes, isEditingUsd, paymentType, totalUSD])

    // Calculations
    const finalTotalUSD = totalUSD * (1 - (discount || 0) / 100)
    const debtUSD = paymentType === 'full' ? 0
        : paymentType === 'credit' ? finalTotalUSD
            : Math.max(0, finalTotalUSD - amountPaid)

    return {
        rate,
        totalUSD,
        finalTotalUSD,
        debtUSD,
        vesBuffer,
        setVesBuffer,
        isEditingVes,
        setIsEditingVes,
        usdBuffer,
        setUsdBuffer,
        isEditingUsd,
        setIsEditingUsd
    }
}
