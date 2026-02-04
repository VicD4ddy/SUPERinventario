import { useState, useEffect } from "react"
import { Product } from "@/types"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { createClient } from "@/utils/supabase/client"
import imageCompression from 'browser-image-compression';
import { Loader2, UploadCloud, ScanBarcode, Sparkles } from "lucide-react";
import BarcodeScanner from "@/components/ui/BarcodeScanner"
import { Modal } from "@/components/ui/Modal"

interface ProductFormProps {
    initialData?: Product | null
    onSubmit: (data: Partial<Product>) => void
    onCancel: () => void
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
    const supabase = createClient()
    const { rate } = useExchangeRate()
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])

    // Upload state
    const [uploading, setUploading] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        barcode: "",
        stock: "" as string | number,
        costUSD: "" as string | number,
        priceUSD: "" as string | number,
        category: "",
        imageUrl: "",
        description: "",
    })

    useEffect(() => {
        async function fetchCategories() {
            const { data } = await supabase.from('categories').select('id, name').order('name')
            if (data) setCategories(data)
        }
        fetchCategories()
    }, [])

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                sku: initialData.sku || "",
                barcode: initialData.barcode || "",
                stock: initialData.stock,
                costUSD: initialData.costUSD,
                priceUSD: initialData.priceUSD,
                category: initialData.category || "",
                imageUrl: initialData.imageUrl || "",
                description: initialData.description || "",
            })
            if (initialData.imageUrl) setImagePreview(initialData.imageUrl)
        }
    }, [initialData])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === "number" ? (value === "" ? "" : parseFloat(value)) : value
        }))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return
        }
        setUploading(true)
        const file = e.target.files[0]

        try {
            // Compress image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true
            }
            const compressedFile = await imageCompression(file, options)

            // Upload to Supabase
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, compressedFile)

            if (uploadError) throw uploadError

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath)

            setFormData(prev => ({ ...prev, imageUrl: publicUrl }))
            setImagePreview(publicUrl)

        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Error al subir la imagen')
        } finally {
            setUploading(false)
        }
    }

    // Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false)

    const handleScanSuccess = (decodedText: string) => {
        setFormData(prev => ({ ...prev, barcode: decodedText }))
        setIsScannerOpen(false)
        // Optional beep
        const audio = new Audio('/sounds/beep.mp3')
        audio.play().catch(() => { })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Ensure numbers are numbers
        const submissionData = {
            ...formData,
            stock: Number(formData.stock),
            costUSD: Number(formData.costUSD),
            priceUSD: Number(formData.priceUSD)
        }
        onSubmit(submissionData)
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-900">Nombre del Producto</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-slate-900"
                        placeholder="Ej: Monitor 24 Pulgadas"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-900">SKU / Código Interno</label>
                    <input
                        type="text"
                        name="sku"
                        required
                        value={formData.sku}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-slate-900"
                        placeholder="Ej: MON-24-DELL"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-900">Código de Barras (EAN/UPC)</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="barcode"
                            value={formData.barcode || ""}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-slate-900"
                            placeholder="Ej: 7501055312345"
                        />
                        <button
                            type="button"
                            onClick={() => setIsScannerOpen(true)}
                            className="p-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 border border-slate-300"
                            title="Escanear Código"
                        >
                            <ScanBarcode size={20} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                        Escanea el producto para llenar esto automáticamente.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1 flex justify-between items-center">
                            Categoría
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!formData.name) return alert("Escribe un nombre primero");
                                    const btn = document.getElementById('btn-gen-cat') as HTMLButtonElement;
                                    const icon = btn.querySelector('svg');
                                    icon?.classList.add('animate-spin');

                                    try {
                                        const res = await fetch('/api/ai/generate', {
                                            method: 'POST',
                                            body: JSON.stringify({ prompt: formData.name, type: 'category' })
                                        });
                                        const data = await res.json();
                                        if (data.result && data.result !== 'General') {
                                            // Check if category exists, if not maybe just set it or warn?
                                            // Ideally we should match with existing categories or create new one.
                                            // For this simple demo, we'll suggest it in a prompt
                                            const matches = categories.find(c => c.name.toLowerCase() === data.result.toLowerCase());
                                            if (matches) {
                                                setFormData(prev => ({ ...prev, category: matches.name }));
                                            } else {
                                                // Ask user if they want to create it
                                                if (confirm(`La IA sugiere: "${data.result}". Esta categoría no existe. ¿Quieres crearla automáticamente?`)) {
                                                    try {
                                                        // Create category
                                                        const { data: newCat, error: catError } = await supabase
                                                            .from('categories')
                                                            .insert([{ name: data.result }])
                                                            .select()
                                                            .single();

                                                        if (newCat && !catError) {
                                                            setCategories(prev => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
                                                            setFormData(prev => ({ ...prev, category: newCat.name }));
                                                        } else {
                                                            console.error(catError);
                                                            alert("Error al crear la categoría. Verifica permisos o intenta manual.");
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert("Error al procesar la solicitud.");
                                                    }
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        icon?.classList.remove('animate-spin');
                                    }
                                }}
                                id="btn-gen-cat"
                                className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-purple-200 transition-colors"
                                title="Sugerir Categoría con IA"
                            >
                                <Sparkles size={10} />
                                Auto
                            </button>
                        </label>
                        <select
                            name="category"
                            required
                            value={formData.category || ""}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] bg-white"
                        >
                            <option value="">Sin Categoría</option>
                            {categories.map(cat => (
                                <option key={cat.name} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-900">Stock Actual</label>
                        <input
                            type="number"
                            name="stock"
                            min="0"
                            required
                            value={formData.stock}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1 flex justify-between items-center">
                        Descripción (Opcional)
                        <button
                            type="button"
                            onClick={async () => {
                                if (!formData.name) return alert("Escribe un nombre primero");
                                const btn = document.getElementById('btn-gen-desc') as HTMLButtonElement;
                                const originalText = btn.innerHTML;
                                btn.innerHTML = '<svg class="animate-spin w-3 h-3 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generando...';
                                btn.disabled = true;

                                try {
                                    const res = await fetch('/api/ai/generate', {
                                        method: 'POST',
                                        body: JSON.stringify({ prompt: formData.name, type: 'description' })
                                    });
                                    const data = await res.json();
                                    if (data.result) {
                                        setFormData(prev => ({ ...prev, description: data.result }));
                                    }
                                } catch (e) {
                                    console.error(e);
                                    alert("Error al generar descripción");
                                } finally {
                                    btn.innerHTML = originalText;
                                    btn.disabled = false;
                                }
                            }}
                            id="btn-gen-desc"
                            className="text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-full flex items-center gap-1.5 hover:shadow-sm transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                        >
                            <Sparkles size={12} className="text-purple-600" />
                            Generar con IA
                        </button>
                    </label>
                    <textarea
                        name="description"
                        value={formData.description || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        placeholder="Detalles técnicos, características, etc."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-900">Costo ($ USD)</label>
                        <input
                            type="number"
                            name="costUSD"
                            min="0"
                            step="0.01"
                            required
                            value={formData.costUSD}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-900">Precio Venta ($ USD)</label>
                        <input
                            type="number"
                            name="priceUSD"
                            min="0"
                            step="0.01"
                            required
                            value={formData.priceUSD}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                    </div>
                </div>

                {/* Image Upload Section */}
                <div className="border rounded-lg p-4 bg-slate-50">
                    <label className="block text-sm font-medium text-slate-900 mb-2">Imagen del Producto</label>

                    <div className="flex items-start gap-4">
                        {/* Preview */}
                        <div className="h-24 w-24 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative group">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="h-full w-full object-contain" />
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-300">
                                    <span className="text-xs text-center px-1">Sin Imagen</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-3">
                            {/* URL Input */}
                            <input
                                type="text"
                                name="imageUrl"
                                value={formData.imageUrl}
                                onChange={(e) => {
                                    setFormData({ ...formData, imageUrl: e.target.value })
                                    setImagePreview(e.target.value)
                                }}
                                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                placeholder="Pegar URL de imagen (Recomendado)"
                            />

                            {/* File Upload Button */}
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    disabled={uploading}
                                    className="w-full flex items-center justify-center px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Comprimiendo y Subiendo...
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="mr-2 h-4 w-4" />
                                            Subir desde el dispositivo
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-slate-600">
                                * Tip: Si tienes la URL, pégala arriba para ahorrar espacio en la base de datos.
                                Si subes un archivo, se comprimirá automáticamente.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-md bg-slate-50 p-3 border border-slate-200">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-900 font-medium">Precio Estimado en Bolívares:</span>
                        <span className="font-bold" style={{ color: 'var(--primary)' }}>
                            ~{(Number(formData.priceUSD) * rate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1 text-right">Calculado a tasa: {rate.toFixed(2)} Bs/$</p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={uploading}
                        className="rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: 'var(--primary)' }}
                    >
                        {uploading ? "Subiendo..." : (initialData ? "Guardar Cambios" : "Crear Producto")}
                    </button>
                </div>
            </form>

            <Modal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                title="Escanear para Registrar"
            >
                <div className="flex flex-col items-center gap-4">
                    <BarcodeScanner
                        onScanSuccess={(code) => handleScanSuccess(code)}
                    />
                    <button
                        onClick={() => setIsScannerOpen(false)}
                        className="mt-2 text-slate-500 hover:text-slate-700 underline"
                    >
                        Cancelar
                    </button>
                </div>
            </Modal>
        </>
    )
}
