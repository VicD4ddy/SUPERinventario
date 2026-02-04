import * as XLSX from 'xlsx'

export interface ImportedProduct {
    name: string
    sku?: string
    category?: string
    stock: number
    cost: number
    price: number
    description?: string
}

// Helper to clean currency strings (e.g. "$ 1,200.00" -> 1200)
const cleanNumber = (val: any): number => {
    if (typeof val === 'number') return val
    if (!val) return 0
    // Remove symbols, keep digits, dots and commas
    // Assuming standard format. If comma is used as decimal, might need adjustment based on locale.
    // simpler approach: remove everything that is not digit, dot or minus.
    // Handling "1.200,00" vs "1,200.00" is tricky without knowing locale. 
    // We'll assume standard English/Scientific for now or basic clean.
    const cleanStr = String(val).replace(/[^0-9.-]/g, '')
    return parseFloat(cleanStr) || 0
}

// Helper to find value from potential column names (fuzzy match)
const findValue = (row: any, keys: string[]): any => {
    // Exact match first
    for (const key of keys) {
        if (row[key] !== undefined) return row[key]
    }
    // Case insensitive match
    const rowKeys = Object.keys(row)
    for (const key of keys) {
        const foundKey = rowKeys.find(k => k.toLowerCase().trim() === key.toLowerCase())
        if (foundKey) return row[foundKey]
    }
    return undefined
}

export const parseInventoryExcel = async (file: File): Promise<ImportedProduct[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = e.target?.result
                const wb = XLSX.read(data, { type: 'binary' })
                const wsName = wb.SheetNames[0]
                const ws = wb.Sheets[wsName]

                // Convert to JSON array of arrays properties to inspect raw rows
                const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]
                console.log("Raw Rows (First 5):", rawRows.slice(0, 5))

                // Smart Header Detection
                // We look for a row that contains at least 3 of our target keywords
                const targetKeywords = ['nombre', 'producto', 'sku', 'stock', 'costo', 'precio']

                let headerRowIndex = 0
                let foundHeader = false

                // Scan first 20 rows
                for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
                    const row = rawRows[i]
                    if (!Array.isArray(row)) continue

                    // Count matches for this row
                    const matches = row.filter(cell => {
                        if (typeof cell !== 'string') return false
                        return targetKeywords.some(keyword => cell.toLowerCase().includes(keyword))
                    }).length

                    // If we find 2 or more matches, we assume this is the header row
                    // (e.g. "Producto", "SKU", "Stock" found)
                    if (matches >= 2) {
                        headerRowIndex = i
                        foundHeader = true
                        break
                    }
                }

                console.log(`Header found at index ${headerRowIndex} (Found: ${foundHeader})`)

                // Re-parse starting from the found header row
                const jsonData = XLSX.utils.sheet_to_json(ws, {
                    header: headerRowIndex // This treats the specific row as header (0-indexed logic in some versions, but range option is safer)
                    // limit range to start at headerRowIndex
                }) as Record<string, unknown>[]

                // Note: sheet_to_json with 'range' is better but 'range' expects A1 ref or number.
                // Simpler approach: Use the range option in sheet_to_json
                const finalData = XLSX.utils.sheet_to_json(ws, {
                    range: headerRowIndex
                }) as Record<string, unknown>[]

                // Smart Mapping Keys
                const nameKeys = ['Nombre', 'Producto', 'Product', 'Name', 'Descripcion', 'Description', 'Articulo']
                const skuKeys = ['SKU', 'Codigo', 'Code', 'Referencia', 'Ref']
                const catKeys = ['Categoria', 'Category', 'Cat', 'Clasificacion', 'Categoría']
                const stockKeys = ['Stock', 'Cantidad', 'Qty', 'Existencia', 'Unidades']
                const costKeys = ['Costo', 'Cost', 'Costo Unit.', 'Unit Cost', 'Compra', 'Costo Unit']
                const priceKeys = ['Precio', 'Price', 'Precio Venta', 'PVP', 'Venta']

                const mappedData: ImportedProduct[] = finalData.map((row) => {
                    return {
                        name: findValue(row, nameKeys) || 'Sin Nombre',
                        sku: String(findValue(row, skuKeys) || '').trim(), // Force clean SKU
                        category: findValue(row, catKeys) || 'General',
                        stock: cleanNumber(findValue(row, stockKeys)),
                        cost: cleanNumber(findValue(row, costKeys)),
                        price: cleanNumber(findValue(row, priceKeys)),
                        description: ''
                    }
                }).filter(p =>
                    (p.name !== 'Sin Nombre' || p.sku.length > 0) && // Has Name OR SKU
                    (p.stock > 0 || p.price > 0 || p.cost > 0) // And has some data
                )

                resolve(mappedData)
            } catch (err) {
                reject(err)
            }
        }

        reader.onerror = (err) => reject(err)
        reader.readAsBinaryString(file)
    })
}
