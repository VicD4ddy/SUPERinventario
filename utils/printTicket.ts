import jsPDF from 'jspdf'

interface TicketData {
    businessName: string
    businessPhone?: string
    businessAddress?: string
    ticketId?: string
    date: Date
    customerName?: string
    items: {
        quantity: number
        name: string
        price: number
        total: number
    }[]
    subtotal: number
    discount: number
    total: number
    paymentMethod: string
    paymentDetails?: Record<string, number>
    amountPaid: number
    change: number
}

interface TicketSettings {
    footerMessage?: string
    paperSize?: '80mm' | '58mm'
    showTaxId?: boolean
}

export const generatePOSTicket = (data: TicketData, settings?: TicketSettings) => {
    // 80mm or 58mm width
    const paperWidth = settings?.paperSize === '58mm' ? 58 : 80
    const centerX = paperWidth / 2
    const rightX = paperWidth - 2

    // Estimate Height
    const estimatedHeight = 80 + (data.items.length * 7) + 60
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [paperWidth, estimatedHeight > 297 ? estimatedHeight : 297]
    })

    // Font settings
    doc.setFont("courier", "normal")
    doc.setFontSize(10)

    let y = 5
    const leftX = 2
    const lineHeight = 5

    // --- Header ---
    doc.setFontSize(12)
    doc.setFont("courier", "bold")
    doc.text(data.businessName.toUpperCase(), centerX, y, { align: 'center' })
    y += lineHeight + 2

    doc.setFontSize(9)
    doc.setFont("courier", "normal")
    if (data.businessAddress) {
        doc.text(data.businessAddress, centerX, y, { align: 'center' })
        y += lineHeight
    }
    if (data.businessPhone) {
        doc.text(`Tel: ${data.businessPhone}`, centerX, y, { align: 'center' })
        y += lineHeight
    }

    // Tax ID / RIF
    if (settings?.showTaxId) {
        // Placeholder for Tax ID if available in business data, mostly handled in businessAddress if static
        // or we can add a field for it later.
    }

    y += 2
    doc.text(`Fecha: ${data.date.toLocaleString()}`, centerX, y, { align: 'center' })
    y += lineHeight

    if (data.ticketId) {
        doc.text(`Ticket #: ${data.ticketId}`, centerX, y, { align: 'center' })
        y += lineHeight
    }

    // --- Customer ---
    y += 2
    doc.text("-".repeat(paperWidth === 58 ? 30 : 42), centerX, y, { align: 'center' })
    y += lineHeight
    if (data.customerName) {
        doc.text(`Cliente: ${data.customerName}`, leftX, y)
        y += lineHeight
    }

    // --- Items ---
    doc.setFont("courier", "bold")
    doc.text(paperWidth === 58 ? "CANT DESC TOTAL" : "CANT  DESCRIPCION          TOTAL", leftX, y)
    doc.setFont("courier", "normal")
    y += lineHeight
    doc.text("-".repeat(paperWidth === 58 ? 30 : 42), centerX, y, { align: 'center' })
    y += lineHeight

    data.items.forEach(item => {
        // Quantity
        doc.text(item.quantity.toString(), leftX, y)

        // Name (Truncate if too long)
        const maxLen = paperWidth === 58 ? 12 : 18
        const name = item.name.substring(0, maxLen)
        doc.text(name, paperWidth === 58 ? 8 : 12, y)

        // Total
        const totalStr = item.total.toFixed(2)
        doc.text(totalStr, rightX, y, { align: 'right' })

        y += lineHeight
    })

    // --- Totals ---
    y += 2
    doc.text("-".repeat(paperWidth === 58 ? 30 : 42), centerX, y, { align: 'center' })
    y += lineHeight

    // Subtotal
    doc.text("Subtotal:", 30, y, { align: 'right' })
    doc.text(data.subtotal.toFixed(2), rightX, y, { align: 'right' })
    y += lineHeight

    // Discount
    if (data.discount > 0) {
        doc.text(`Desc (${data.discount}%):`, 30, y, { align: 'right' })
        doc.text(`-${(data.subtotal * data.discount / 100).toFixed(2)}`, rightX, y, { align: 'right' })
        y += lineHeight
    }

    // Total
    doc.setFont("courier", "bold")
    doc.setFontSize(14)
    doc.text("TOTAL:", 30, y + 2, { align: 'right' })
    doc.text(`$${data.total.toFixed(2)}`, rightX, y + 2, { align: 'right' })
    y += lineHeight + 4
    doc.setFontSize(9)
    doc.setFont("courier", "normal")

    // Payment Info
    const translatedMethod = data.paymentMethod === 'mixed' ? 'Mixto' :
        data.paymentMethod === 'cash' ? 'Efectivo' :
            data.paymentMethod === 'pago_movil' ? 'Pago Movil' :
                data.paymentMethod === 'point' ? 'Punto de Venta' :
                    data.paymentMethod === 'transfer' ? 'Transferencia' :
                        data.paymentMethod

    doc.text(`Metodo: ${translatedMethod}`, leftX, y)
    y += lineHeight

    if (data.paymentDetails && Object.keys(data.paymentDetails).length > 0) {
        doc.setFontSize(8)
        Object.entries(data.paymentDetails).forEach(([key, val]) => {
            if (val <= 0) return
            let label = key
            if (key === 'cash_usd') label = 'Efec.$'
            if (key === 'cash_ves') label = 'Efec.Bs'
            if (key === 'zelle') label = 'Zelle'
            if (key === 'pago_movil') label = 'PagoMovil'
            if (key === 'point') label = 'Punto'

            doc.text(`  ${label}: ${val.toFixed(2)}`, leftX, y)
            y += lineHeight - 1 // tighter spacing
        })
        doc.setFontSize(9)
        y += 2
    }

    // --- Footer ---
    y += 5
    // Use custom footer or default
    const footerText = settings?.footerMessage || "¡Gracias por su compra!"

    // Split long footer into lines
    const splitFooter = doc.splitTextToSize(footerText, paperWidth - 5)
    doc.text(splitFooter, centerX, y, { align: 'center' })

    // Open PDF
    doc.autoPrint() // Trigger print dialog automatically
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
}
