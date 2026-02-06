import jsPDF from 'jspdf'
import 'jspdf-autotable'
// Note: jspdf-autotable import might need adjustment depending on version, 
// using simple text layout similar to ticket for safety if autotable isn't available, 
// but assuming we want a simple layout first.

interface PurchaseOrderData {
    id: string
    date: Date
    supplierName: string
    supplierContact?: string
    items: {
        name: string
        quantity: number
        unitCost: number
        total: number
    }[]
    total: number
    status: string
    notes?: string
}

export const generatePurchasePDF = (data: PurchaseOrderData) => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.text("Orden de Compra", 105, 15, { align: "center" })

    doc.setFontSize(10)
    doc.text(`ID: ${data.id}`, 14, 25)
    doc.text(`Fecha: ${data.date.toLocaleDateString()}`, 14, 30)
    doc.text(`Estado: ${data.status.toUpperCase()}`, 14, 35)

    // Supplier
    doc.setFontSize(12)
    doc.text("Proveedor:", 14, 45)
    doc.setFontSize(10)
    doc.text(data.supplierName, 14, 50)
    if (data.supplierContact) {
        doc.text(data.supplierContact, 14, 55)
    }

    // Table Header
    let y = 65
    doc.line(14, y, 196, y)
    y += 5
    doc.setFont("helvetica", "bold")
    doc.text("Producto", 14, y)
    doc.text("Cant", 100, y)
    doc.text("Costo U.", 130, y)
    doc.text("Total", 170, y)
    doc.setFont("helvetica", "normal")
    y += 2
    doc.line(14, y, 196, y)
    y += 6

    // Items
    data.items.forEach(item => {
        const name = item.name.length > 40 ? item.name.substring(0, 37) + "..." : item.name
        doc.text(name, 14, y)
        doc.text(item.quantity.toString(), 100, y)
        doc.text(`$${item.unitCost.toFixed(2)}`, 130, y)
        doc.text(`$${item.total.toFixed(2)}`, 170, y)
        y += 7
    })

    // Total
    y += 5
    doc.line(14, y, 196, y)
    y += 10
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(`Total: $${data.total.toFixed(2)}`, 170, y, { align: "right" })

    // Footer
    if (data.notes) {
        y += 20
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text("Notas:", 14, y)
        doc.setFont("helvetica", "normal")
        doc.text(data.notes, 14, y + 5)
    }

    // Save
    doc.save(`OC-${data.id}.pdf`)
}
