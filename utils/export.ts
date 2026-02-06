import { saveAs } from 'file-saver'
import XLSX from 'xlsx-js-style'

interface ExportTotals {
    totalPurchase: number
    estimatedValue: number
    difference: number
    totalItems: number
}

interface CompanyInfo {
    name: string
    address?: string
    phone?: string
}

export function downloadCSV(data: any[], filename: string) {
    if (!data || !data.length) {
        alert("No hay datos para exportar")
        return
    }

    const separator = ','
    const keys = Object.keys(data[0])
    const csvContent =
        keys.join(separator) +
        '\n' +
        data.map(row => {
            return keys.map(k => {
                let cell = row[k] === null || row[k] === undefined ? '' : row[k]
                cell = cell instanceof Date ? cell.toISOString() : String(cell).replace(/"/g, '""')
                if (cell.search(/("|,|\n)/g) >= 0) {
                    cell = `"${cell}"`
                }
                return cell
            }).join(separator)
        }).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, filename)
}

export async function exportInventoryExcel(
    data: any[],
    totals: ExportTotals,
    companyInfo: CompanyInfo,
    filename: string
) {
    if (!data || data.length === 0) {
        alert("No hay datos para exportar")
        return
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new()

    // --- Prepare Metadata & Header ---
    // We will manually construct the data array to allow for custom layout (header rows, etc.)

    // Row 1: Title (Merged A1:G2 roughly)
    // Row 3: Phone
    // Row 4: Date
    // Row 6: Summary Title
    // Row 7-10: Summary Data
    // Row 12: Table Headers
    // Row 13+: Data

    const wsData: any[][] = []

    // 1. Title Row
    wsData.push([`INVENTARIO DE: ${companyInfo.name.toUpperCase()}`]) // A1
    wsData.push([]) // Placeholder for merge

    // 3. Info Rows
    wsData.push([`Teléfono: ${companyInfo.phone || 'N/A'}`]) // A3
    wsData.push([`Fecha de Reporte: ${new Date().toLocaleDateString()}`]) // A4
    wsData.push([]) // Spacer A5

    // 6. Summary Section
    wsData.push(["RESUMEN EJECUTIVO"]) // A6
    wsData.push(["Total Artículos", totals.totalItems]) // A7
    wsData.push(["Valor Total (Costo)", totals.totalPurchase]) // A8
    wsData.push(["Valor Total (Venta)", totals.estimatedValue]) // A9
    wsData.push(["Ganancia Potencial", totals.difference]) // A10
    wsData.push([]) // Spacer A11

    // 12. Table Headers
    wsData.push(['Producto', 'Categoría', 'SKU', 'Stock', 'Costo Unit.', 'Precio Venta', 'Valor Total']) // A12

    // 13. Data Rows
    data.forEach(item => {
        wsData.push([
            item.Nombre,
            item.Categoria,
            item.SKU,
            item.Stock,
            item.Costo,
            item.Precio,
            item.StockValue
        ])
    })

    // Create Worksheet from array
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // --- Styling & Merges ---

    // Merges
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 6 } }, // Title A1:G2
        { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Phone A3:G3
        { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // Date A4:G4
    ]

    // Style Definitions
    const titleStyle = {
        font: { sz: 16, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "00B050" } }, // Green
        alignment: { horizontal: "center", vertical: "center" }
    }

    const labelStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: "EEEEEE" } },
        border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
        }
    }

    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } }, // Blue
        alignment: { horizontal: "center" },
        border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
        }
    }

    // NEW: Editable cell style (light green)
    const editableCellStyle = {
        fill: { fgColor: { rgb: "D9EAD3" } }, // Light green
        border: {
            top: { style: 'thin', color: { rgb: "B6D7A8" } },
            bottom: { style: 'thin', color: { rgb: "B6D7A8" } },
            left: { style: 'thin', color: { rgb: "B6D7A8" } },
            right: { style: 'thin', color: { rgb: "B6D7A8" } }
        }
    }

    // NEW: Formula cell style (light gray)
    const formulaCellStyle = {
        fill: { fgColor: { rgb: "E8EAED" } }, // Light gray
        border: {
            top: { style: 'thin', color: { rgb: "CCCCCC" } },
            bottom: { style: 'thin', color: { rgb: "CCCCCC" } },
            left: { style: 'thin', color: { rgb: "CCCCCC" } },
            right: { style: 'thin', color: { rgb: "CCCCCC" } }
        }
    }

    const thinBorder = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
    }

    const currencyFormat = '"$"#,##0.00'

    // Apply Styles cell by cell (SheetJS requires direct object manipulation mainly)

    // 1. Title (A1)
    if (ws['A1']) ws['A1'].s = titleStyle

    // 6. Summary Headers (A7-A10)
    const summaryLabels = ['A7', 'A8', 'A9', 'A10']
    summaryLabels.forEach(ref => {
        if (ws[ref]) ws[ref].s = labelStyle
    })

    // Summary Values (B7-B10)
    const summaryValues = ['B7', 'B8', 'B9', 'B10']
    summaryValues.forEach(ref => {
        if (!ws[ref]) return
        ws[ref].s = { border: thinBorder }
        if (ref !== 'B7') ws[ref].z = currencyFormat // Apply currency format
    })
    // Profit Color (B10)
    if (ws['B10']) ws['B10'].s = {
        ...ws['B10'].s,
        font: { bold: true, color: { rgb: "00B050" } }
    }

    // 12. Table Headers (Row 12 -> Index 11)
    const headerRowIndex = 11
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    cols.forEach(col => {
        const ref = `${col}${headerRowIndex + 1}` // e.g. A12
        if (ws[ref]) ws[ref].s = headerStyle
    })

    // 13. Data Rows
    const dataStartIndex = 12
    data.forEach((_, i) => {
        const rowIndex = dataStartIndex + i
        const rowNum = rowIndex + 1
        cols.forEach((col, colIdx) => {
            const ref = `${col}${rowNum}`

            // Value Cell (G column) -> Formula: D(row) * E(row) (Stock * Cost)
            if (col === 'G') {
                // Ensure cell exists
                if (!ws[ref]) ws[ref] = { t: 'n', v: 0 } // Init if missing

                // Set Formula
                ws[ref].f = `D${rowNum}*E${rowNum}`
                // We don't set 'v' (value) when 'f' is present usually, or we set a pre-calculated one.
                // xlsx-js-style might use 'v' as cache.
            }

            if (ws[ref]) {
                // Apply color coding based on column
                if (col === 'G') {
                    // Formula column - gray background
                    ws[ref].s = { ...formulaCellStyle }
                } else {
                    // Editable columns - green background
                    ws[ref].s = { ...editableCellStyle }
                }

                // Apply currency format to Cost (E), Price (F), Value (G)
                if (['E', 'F', 'G'].includes(col)) {
                    ws[ref].z = currencyFormat
                }
            }
        })
    })

    // Modify Summary to use Formulas if possible
    // Note: Summary is above data, so it needs to sum the data range (e.g. G13:G1000)
    // Range is 13 (index 12) to 13+length-1
    const lastRow = dataStartIndex + data.length
    const startRow = dataStartIndex + 1 // 1-based "13"

    // Total Items (B7) - CountA of Names (A)
    if (ws['B7']) ws['B7'].f = `COUNTA(A${startRow}:A${lastRow})`
    // Total Purchase (B8) - Sum of G (Stock Value)
    if (ws['B8']) ws['B8'].f = `SUM(G${startRow}:G${lastRow})`
    // Total Sale (B9) - SumProduct(Stock D * Price F)
    if (ws['B9']) ws['B9'].f = `SUMPRODUCT(D${startRow}:D${lastRow},F${startRow}:F${lastRow})`
    // Difference (B10) - B9 - B8
    if (ws['B10']) ws['B10'].f = `B9-B8`

    // Column Widths
    ws['!cols'] = [
        { wch: 30 }, // Name
        { wch: 20 }, // Cat
        { wch: 15 }, // SKU
        { wch: 10 }, // Stock
        { wch: 15 }, // Cost
        { wch: 15 }, // Price
        { wch: 15 }, // Value
    ]

    // --- 1. Auto-Filters ---
    // Apply to the Table Header Row (Row 12 -> "11" index) down to last data row
    const endRow = dataStartIndex + data.length
    ws['!autofilter'] = { ref: `A12:G${endRow}` }

    // --- 2. Validation & Alerts (Conditional Styling) ---
    // We apply specific styles based on values during generation

    data.forEach((_, i) => {
        const rowNum = dataStartIndex + i + 1

        // Stock Alert (Col D)
        const stockRef = `D${rowNum}`
        if (ws[stockRef] && (ws[stockRef].v as number) < 5) {
            // RED Background for Low Stock
            ws[stockRef].s = {
                ...ws[stockRef].s,
                fill: { fgColor: { rgb: "FFCCCC" } }, // Light Red
                font: { color: { rgb: "9C0006" }, bold: true } // Dark Red Text
            }
        }

        // Profitability Hint (Optional - Col G)
        // logic could go here
    })


    XLSX.utils.book_append_sheet(wb, ws, "Inventario")

    // Write and Save
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename)
}

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportInventoryPDF(
    data: any[],
    totals: ExportTotals,
    companyInfo: CompanyInfo,
    filename: string
) {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.setTextColor(40)
    doc.text(`INVENTARIO DE: ${companyInfo.name.toUpperCase()}`, 14, 22)

    // Subtitle / Date
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString()}`, 14, 30)
    if (companyInfo.phone) {
        doc.text(`Teléfono: ${companyInfo.phone}`, 14, 35)
    }

    // Summary Box
    doc.setDrawColor(200)
    doc.setFillColor(245, 245, 245)
    doc.rect(14, 40, 180, 25, 'FD')

    doc.setFontSize(10)
    doc.setTextColor(60)

    doc.text("Total Artículos:", 20, 48)
    doc.text(String(totals.totalItems), 60, 48)

    doc.text("Valor Costo:", 20, 54)
    doc.text(`$${totals.totalPurchase.toFixed(2)}`, 60, 54)

    doc.text("Valor Venta:", 100, 48)
    doc.text(`$${totals.estimatedValue.toFixed(2)}`, 140, 48)

    doc.text("Ganancia Potencial:", 100, 54)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 150, 0)
    doc.text(`$${totals.difference.toFixed(2)}`, 140, 54)

    // Table
    const tableHeaders = [['Producto', 'Categoría', 'SKU', 'Stock', 'Costo', 'Precio', 'Total']]
    const tableData = data.map(item => [
        item.Nombre,
        item.Categoria,
        item.SKU,
        item.Stock,
        `$${Number(item.Costo).toFixed(2)}`,
        `$${Number(item.Precio).toFixed(2)}`,
        `$${Number(item.StockValue).toFixed(2)}`
    ])

    autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 70,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [31, 78, 120] }, // Dark Blue
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
            3: { halign: 'center' }, // Stock
            4: { halign: 'right' }, // Cost
            5: { halign: 'right' }, // Price
            6: { halign: 'right' }  // Total
        }
    })

    doc.save(filename)
}

// --- Sales Exports ---

interface SalesExportTotals {
    totalRevenue: number
    count: number
}

export async function exportSalesExcel(
    data: any[],
    totals: SalesExportTotals,
    companyInfo: CompanyInfo,
    filename: string
) {
    if (!data || data.length === 0) {
        alert("No hay datos para exportar")
        return
    }

    const wb = XLSX.utils.book_new()
    const wsData: any[][] = []

    // 1. Title
    wsData.push([`REPORTE DE VENTAS: ${companyInfo.name.toUpperCase()}`])
    wsData.push([])

    // 2. Info
    wsData.push([`Teléfono: ${companyInfo.phone || 'N/A'}`])
    wsData.push([`Fecha de Emisión: ${new Date().toLocaleDateString()}`])
    wsData.push([])

    // 3. Summary
    wsData.push(["RESUMEN DE PERIODO"])
    wsData.push(["Total Transacciones", totals.count])
    wsData.push(["Ingreso Total (USD)", totals.totalRevenue])
    wsData.push([])

    // 4. Headers
    wsData.push(['Fecha', 'Tipo', 'Cliente', 'Items / Detalle', 'Método Pago', 'Estado', 'Total USD'])

    // 5. Data
    data.forEach(item => {
        wsData.push([
            item.Date,
            item.Type,
            item.Customer,
            item.Items, // This is a joined string already
            item.Method,
            item.Status,
            item.TotalUSD
        ])
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Styles & Merges
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 6 } }, // Title
    ]

    // Widths
    ws['!cols'] = [
        { wch: 12 }, // Date
        { wch: 10 }, // Type
        { wch: 25 }, // Customer
        { wch: 40 }, // Items
        { wch: 15 }, // Method
        { wch: 15 }, // Status
        { wch: 15 }, // Total
    ]

    // Style Application (Simplified)
    // Title
    if (ws['A1']) ws['A1'].s = { font: { sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1F4E78" } } }

    // Header Row (Row 8 -> Index 7)
    const headerRowIdx = 7
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    cols.forEach(col => {
        const ref = `${col}${headerRowIdx + 1}`
        if (ws[ref]) ws[ref].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4472C4" } } }
    })

    // Formatting Money (Col G)
    data.forEach((_, i) => {
        const ref = `G${headerRowIdx + 2 + i}`
        if (ws[ref]) ws[ref].z = '"$"#,##0.00'
    })

    XLSX.utils.book_append_sheet(wb, ws, "Ventas")
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename)
}

export function exportSalesPDF(
    data: any[],
    totals: SalesExportTotals,
    companyInfo: CompanyInfo,
    filename: string
) {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(16)
    doc.setTextColor(40)
    doc.text(`REPORTE DE VENTAS: ${companyInfo.name.toUpperCase()}`, 14, 20)

    // Info
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28)

    // Summary Box
    doc.setFillColor(240, 248, 255) // AliceBlue
    doc.rect(14, 35, 180, 20, 'F')
    doc.setTextColor(60)
    doc.text(`Transacciones: ${totals.count}`, 20, 48)
    doc.text(`Total Ingresos: $${totals.totalRevenue.toFixed(2)}`, 100, 48)

    // Table
    const headers = [['Fecha', 'Tipo', 'Cliente', 'Detalle', 'Pago', 'Total']]
    const rows = data.map(item => [
        item.Date,
        item.Type,
        item.Customer,
        item.Items,
        item.Method || '-',
        `$${item.TotalUSD.toFixed(2)}`
    ])

    autoTable(doc, {
        head: headers,
        body: rows,
        startY: 60,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [68, 114, 196] },
        columnStyles: {
            5: { halign: 'right' }
        }
    })

    doc.save(filename)
}
