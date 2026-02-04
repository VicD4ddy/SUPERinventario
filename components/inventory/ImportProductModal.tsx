"use client"

import { useState, useRef } from "react"
import { Modal } from "@/components/ui/Modal"
import { Upload, FileSpreadsheet, Check, AlertTriangle, Loader2 } from "lucide-react"
import { parseInventoryExcel, ImportedProduct } from "@/utils/import"
import { createClient } from "@/utils/supabase/client"

interface ImportProductModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function ImportProductModal({ isOpen, onClose, onSuccess }: ImportProductModalProps) {
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<ImportedProduct[]>([])
    const [statusMap, setStatusMap] = useState<Record<string, 'new' | 'update'>>({})
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [error, setError] = useState("")

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        setLoading(true)
        setError("")

        try {
            const data = await parseInventoryExcel(selectedFile)

            // Smart Check: Verify which SKUs already exist
            try {
                const skusToCheck = data.filter(p => p.sku).map(p => p.sku!)
                if (skusToCheck.length > 0) {
                    const { data: existingProducts } = await supabase
                        .from('products')
                        .select('sku')
                        .in('sku', skusToCheck)

                    const existingSkuSet = new Set(existingProducts?.map(p => p.sku) || [])

                    const newStatusMap: Record<string, 'new' | 'update'> = {}
                    data.forEach(p => {
                        // If has SKU and it exists -> update. Else -> new.
                        if (p.sku && existingSkuSet.has(p.sku)) {
                            newStatusMap[p.sku] = 'update'
                        } else {
                            // If no SKU, we assume new (since we can't match reliably by name safely)
                            const key = p.sku || `temp_${Math.random()}`
                            newStatusMap[key] = 'new'
                        }
                    })
                    setStatusMap(newStatusMap)
                }
            } catch (err) {
                console.warn("Error verifying existing SKUs:", err)
            }

            setPreviewData(data)
        } catch (err) {
            console.error(err)
            setError("Error al leer el archivo. Asegúrate que sea un Excel válido.")
        } finally {
            setLoading(false)
        }
    }

    const handleImport = async () => {
        if (previewData.length === 0) return

        setImporting(true)
        try {
            // 1. Extract Unique Categories from import data
            const uniqueCategories = Array.from(new Set(
                previewData
                    .map(p => p.category?.trim())
                    .filter((c): c is string => !!c && c.length > 0)
            ))

            // 2. Fetch Existing Categories from DB to avoid duplicates
            // We'll trust the DB constraints but checking here saves error logs
            const { data: existingCats } = await supabase
                .from('categories')
                .select('name')

            const existingCatNames = new Set(existingCats?.map(c => c.name.toLowerCase()) || [])

            // 3. Filter only NEW categories
            const newCategories = uniqueCategories.filter(
                catName => !existingCatNames.has(catName.toLowerCase())
            )

            // 4. Create New Categories if any
            if (newCategories.length > 0) {
                const { error: catError } = await supabase
                    .from('categories')
                    .insert(newCategories.map(name => ({ name })))
                // If there's a race condition or duplicate, we largely ignore it 
                // assuming the DB handles it or it exists now.
                // But typically we want to be safe.
                if (catError) {
                    // Log but try to proceed (maybe some existed)
                    console.warn("Error creating categories:", catError)
                }
            }

            // 5. Smart Upsert (Separating Updates and Inserts)
            const updates = previewData.filter(p => p.sku && statusMap[p.sku] === 'update')
            const inserts = previewData.filter(p => !p.sku || statusMap[p.sku] !== 'update')

            // Get User ID for logging
            const { data: { user } } = await supabase.auth.getUser()
            const userId = user?.id

            // --- PROCESSING UPDATES ---
            if (updates.length > 0) {
                // Fetch existing IDs and Stocks for these SKUs to log movements correctly
                const skus = updates.map(u => u.sku).filter(s => !!s) as string[]
                const { data: currentProducts } = await supabase
                    .from('products')
                    .select('id, sku, stock')
                    .in('sku', skus)

                const productMap = new Map(currentProducts?.map(p => [p.sku, p]))

                const movementsToLog: any[] = []

                for (const item of updates) {
                    if (!item.sku) continue
                    const current = productMap.get(item.sku)
                    if (!current) continue // Should not happen if SKU matched before

                    // Update Product
                    const { error } = await supabase
                        .from('products')
                        .update({
                            stock: item.stock,
                            price_usd: item.price,
                            cost_usd: item.cost,
                            updated_at: new Date()
                        } as any)
                        .eq('id', current.id)

                    if (error) throw error

                    // Log Movement if stock changed
                    if (current.stock !== item.stock) {
                        const diff = item.stock - current.stock
                        movementsToLog.push({
                            product_id: current.id,
                            type: 'ADJUSTMENT',
                            quantity: Math.abs(diff),
                            previous_stock: current.stock,
                            new_stock: item.stock,
                            reference: 'Importación Excel (Actualización)',
                            user_id: userId,
                        })
                    }
                }

                // Batch Insert Movements
                if (movementsToLog.length > 0) {
                    await supabase.from('stock_movements').insert(movementsToLog)
                }
            }

            // --- PROCESSING INSERTS ---
            if (inserts.length > 0) {
                const dbData = inserts.map(p => ({
                    name: p.name,
                    sku: p.sku,
                    category: p.category || 'General',
                    stock: p.stock,
                    cost_usd: p.cost,
                    price_usd: p.price,
                    description: p.description,
                    created_at: new Date(),
                    updated_at: new Date()
                }))

                // Insert and Select to get IDs
                const { data: newProducts, error: insertError } = await supabase
                    .from('products')
                    .insert(dbData)
                    .select('id, stock')

                if (insertError) throw insertError

                // Log Movements for New Products
                if (newProducts) {
                    const newMovements = newProducts.map(p => ({
                        product_id: p.id,
                        type: 'IN', // Initial stock
                        quantity: p.stock,
                        previous_stock: 0,
                        new_stock: p.stock,
                        reference: 'Importación Excel (Nuevo)',
                        user_id: userId,
                    }))
                    await supabase.from('stock_movements').insert(newMovements)
                }
            }

            onSuccess()
            handleClose()
        } catch (err: unknown) {
            console.error(err)
            const message = err instanceof Error ? err.message : 'Error desconocido'
            setError(`Error al importar: ${message}`)
        } finally {
            setImporting(false)
        }
    }

    const handleClose = () => {
        setFile(null)
        setPreviewData([])
        setStatusMap({})
        setError("")
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Inventario desde Excel">
            <div className="space-y-6">
                {/* File Drop / Input */}
                {!file && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                        <FileSpreadsheet className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <p className="text-lg font-medium text-slate-700">Haz clic para subir tu Excel</p>
                        <p className="text-sm text-slate-500">Soporta .xlsx y .xls</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                        <p className="text-slate-600">Procesando archivo...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start">
                        <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Preview State */}
                {file && !loading && (
                    previewData.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-800">Vista Previa ({previewData.length} productos)</h3>
                                <button
                                    onClick={() => setFile(null)}
                                    className="text-sm text-red-600 hover:underline"
                                >
                                    Cambiar archivo
                                </button>
                            </div>

                            <div className="max-h-64 overflow-y-auto border rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0">
                                        <tr>
                                            <th className="p-2 border-b">Nombre</th>
                                            <th className="p-2 border-b">SKU</th>
                                            <th className="p-2 border-b text-right">Stock</th>
                                            <th className="p-2 border-b text-right">Costo</th>
                                            <th className="p-2 border-b text-right">Precio</th>
                                            <th className="p-2 border-b text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.slice(0, 10).map((p, i) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="p-2 truncate max-w-[150px] font-medium text-slate-900 bg-white/50">{p.name}</td>
                                                <td className="p-2 text-slate-700 font-medium">{p.sku || '-'}</td>
                                                <td className="p-2 text-right font-mono text-slate-700 font-medium">{p.stock}</td>
                                                <td className="p-2 text-right font-mono text-slate-700 font-medium">${p.cost}</td>
                                                <td className="p-2 text-right font-mono text-slate-700 font-medium">${p.price}</td>
                                                <td className="p-2 text-center">
                                                    {p.sku && statusMap[p.sku] === 'update' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                                            Actualizar
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                                            Nuevo
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 10 && (
                                    <div className="p-2 text-center text-xs text-slate-500 bg-slate-50 border-t">
                                        ... y {previewData.length - 10} más
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    onClick={handleClose}
                                    disabled={importing}
                                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importing}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center min-w-[120px]"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Importar Todo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                            <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                            <h3 className="text-lg font-medium text-slate-900">No se encontraron productos</h3>
                            <p className="text-slate-500 mb-4 max-w-sm mx-auto">
                                El archivo parece vacío o no tiene las columnas requeridas (Nombre, Stock, Costo, Precio).
                            </p>
                            <button
                                onClick={() => setFile(null)}
                                className="text-indigo-600 font-medium hover:underline"
                            >
                                Intentar con otro archivo
                            </button>
                        </div>
                    )
                )}
            </div>
        </Modal>
    )
}
