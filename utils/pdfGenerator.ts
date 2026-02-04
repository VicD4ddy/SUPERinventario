import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Sale } from "@/types"

// Function to format currency
const formatCurrency = (amount: number, currency: 'USD' | 'VES') => {
    return currency === 'USD'
        ? `$${amount.toFixed(2)}`
        : `${amount.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs`
}

export const generateSaleReceipt = (sale: Sale, businessName: string = "Mi Inventario") => {
    const doc = new jsPDF()

    // --- Header ---
    doc.setFontSize(20)
    doc.text(businessName, 105, 20, { align: "center" })

    doc.setFontSize(10)
    doc.text("Recibo de Venta", 105, 28, { align: "center" })

    // --- Meta Data ---
    const dateStr = new Date(sale.date).toLocaleDateString("es-VE", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    doc.setFontSize(10)
    doc.text(`Fecha: ${dateStr}`, 14, 40)
    doc.text(`Cliente: ${sale.customerName || "Contado/General"}`, 14, 46)
    if (sale.customerPhone) {
        doc.text(`Teléfono: ${sale.customerPhone}`, 14, 52)
    }

    doc.text(`Tasa de Cambio: ${sale.exchangeRate.toFixed(2)} Bs/$`, 150, 40)

    // Status Badge text equivalent
    let statusText = "PAGADO"
    if (sale.paymentStatus === 'partial') statusText = "ABONO"
    if (sale.paymentStatus === 'pending') statusText = "CRÉDITO"

    doc.setFontSize(12)
    doc.setTextColor(statusText === 'PAGADO' ? 0 : 200, statusText === 'PAGADO' ? 128 : 0, 0) // Greenish or Reddish
    doc.text(statusText, 150, 52)
    doc.setTextColor(0, 0, 0) // Reset color

    // --- Items Table ---
    const tableColumn = ["Producto", "Cant.", "Precio ($)", "Subtotal ($)"]
    const tableRows: any[] = []

    sale.items.forEach(item => {
        const itemData = [
            item.productName,
            item.quantity,
            `$${item.priceAtSale.toFixed(2)}`,
            `$${(item.quantity * item.priceAtSale).toFixed(2)}`
        ]
        tableRows.push(itemData)
    })

    // Calculate position for table
    let finalY = 60

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'striped',
        headStyles: { fillColor: [63, 81, 181] }, // Indigo
        margin: { top: 60 },
        didDrawPage: (data) => {
            finalY = data.cursor?.y || 60
        }
    })

    // --- Totals ---
    finalY += 10

    doc.setFontSize(10)
    doc.text(`Total USD:`, 140, finalY)
    doc.setFontSize(12)
    doc.text(`${formatCurrency(sale.totalUSD, 'USD')}`, 170, finalY)

    finalY += 6
    doc.setFontSize(10)
    doc.text(`Total VES:`, 140, finalY)
    doc.setFontSize(12)
    doc.text(`${formatCurrency(sale.totalVES, 'VES')}`, 170, finalY)

    if (sale.paymentStatus !== 'paid') {
        finalY += 8
        doc.setFontSize(10)
        doc.setTextColor(220, 38, 38) // Red
        doc.text("Monto Abonado:", 140, finalY)
        doc.text(`${formatCurrency(sale.amountPaidUSD || 0, 'USD')}`, 170, finalY)

        finalY += 6
        doc.text("Resta por Pagar:", 140, finalY)
        doc.text(`${formatCurrency(sale.totalUSD - (sale.amountPaidUSD || 0), 'USD')}`, 170, finalY)
    }

    // --- Footer ---
    doc.setTextColor(100)
    doc.setFontSize(8)
    doc.text("Gracias por su compra", 105, 280, { align: "center" })

    // Save
    doc.save(`recibo_${sale.id.slice(0, 8)}.pdf`)
}
