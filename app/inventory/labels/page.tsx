"use client"

import { useState, useEffect, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { createClient } from "@/utils/supabase/client"
import { Barcode as BarcodeIcon, QrCode as QrCodeIcon, Printer, Search, CheckSquare, Square, X } from "lucide-react"
import Barcode from "react-barcode"
import { QRCodeSVG } from "qrcode.react"

export default function LabelGeneratorPage() {
    const supabase = createClient()
    const [products, setProducts] = useState<any[]>([])
    const [filteredProducts, setFilteredProducts] = useState<any[]>([])
    const [selectedProducts, setSelectedProducts] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [labelType, setLabelType] = useState<'barcode' | 'qr'>('barcode')
    const [paperSize, setPaperSize] = useState<'letter_30' | 'thermal'>('letter_30') // letter_30 = 30-up Avery style, thermal = single label

    // Values for "Print All Stock" or "Quantity 1"
    const [printMode, setPrintMode] = useState<'single' | 'stock'>('single')

    const componentRef = useRef<HTMLDivElement>(null)

    // Handle Print
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Etiquetas_Inventario_${new Date().toISOString().split('T')[0]}`,
    })

    useEffect(() => {
        fetchProducts()
    }, [])

    useEffect(() => {
        if (searchTerm === "") {
            setFilteredProducts(products)
        } else {
            const lower = searchTerm.toLowerCase()
            setFilteredProducts(products.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                (p.barcode && p.barcode.includes(searchTerm))
            ))
        }
    }, [searchTerm, products])

    async function fetchProducts() {
        setLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('id, name, stock, sku, price_usd')
            .order('name')

        if (error) {
            console.error("Error fetching products:", error)
        }

        if (data) {
            // Ensure every product has a unique ID for selection logic
            const mapped = data.map((p: any) => ({
                ...p,
                barcode: p.sku || p.id.split('-')[0].toUpperCase() // Fallback to ID part if no sku
            }))
            setProducts(mapped)
            setFilteredProducts(mapped)
        }
        setLoading(false)
    }

    const toggleSelect = (product: any) => {
        if (selectedProducts.find(p => p.id === product.id)) {
            setSelectedProducts(selectedProducts.filter(p => p.id !== product.id))
        } else {
            setSelectedProducts([...selectedProducts, product])
        }
    }

    const selectAllFiltered = () => {
        if (selectedProducts.length === filteredProducts.length) {
            setSelectedProducts([])
        } else {
            setSelectedProducts([...filteredProducts])
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Generador de Etiquetas</h2>
                    <p className="text-slate-500">Imprime códigos para etiquetar tu mercancía física.</p>
                </div>
                <button
                    onClick={() => handlePrint && handlePrint()}
                    disabled={selectedProducts.length === 0}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Printer size={20} />
                    Imprimir Selección ({selectedProducts.length})
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Selection */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-200px)]">
                    <div className="p-4 border-b border-slate-100 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <button onClick={selectAllFiltered} className="text-indigo-600 font-medium hover:underline">
                                {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? "Deseleccionar Todo" : "Seleccionar Todo"}
                            </button>
                            <span className="text-slate-500 font-medium">{filteredProducts.length} productos</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading ? (
                            <div className="p-4 text-center text-slate-500">Cargando...</div>
                        ) : filteredProducts.map(product => {
                            const isSelected = !!selectedProducts.find(p => p.id === product.id)
                            return (
                                <div
                                    key={product.id}
                                    onClick={() => toggleSelect(product)}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
                                >
                                    <div className={`flex-shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`font-medium truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{product.name}</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-2">
                                            <span>Code: {product.barcode}</span>
                                            <span>•</span>
                                            <span>Stock: {product.stock}</span>
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Right Panel: Preview & Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Settings Toolbar */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">Formato:</span>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button
                                    onClick={() => setLabelType('barcode')}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${labelType === 'barcode' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <BarcodeIcon size={16} /> Barras
                                </button>
                                <button
                                    onClick={() => setLabelType('qr')}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${labelType === 'qr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <QrCodeIcon size={16} /> QR
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">Papel:</span>
                            <select
                                value={paperSize}
                                onChange={(e) => setPaperSize(e.target.value as any)}
                                className="text-sm border-slate-200 rounded-lg focus:ring-indigo-500 text-slate-700 font-medium"
                            >
                                <option value="letter_30">Carta (30 etiquetas/pag)</option>
                                <option value="thermal">Térmica (Rollo)</option>
                            </select>
                        </div>
                    </div>

                    {/* Print Preview Area */}
                    <div className="bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 min-h-[500px] flex justify-center p-8 overflow-auto">
                        {/* Hidden Printable Area (but visible for preview here, styled by CSS) */}
                        <style type="text/css" media="print">
                            {`
                                @page { size: auto; margin: 0mm; }
                                body { background: white; }
                             `}
                        </style>
                        <div ref={componentRef} className={`bg-white shadow-lg ${paperSize === 'letter_30' ? 'w-[216mm] min-h-[279mm] p-[10mm]' : 'w-[80mm] min-h-[50mm] p-[2mm]'}`}>

                            {selectedProducts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <Printer size={48} className="mb-4 opacity-50" />
                                    <p>Selecciona productos para previsualizar</p>
                                </div>
                            ) : (
                                <div className={paperSize === 'letter_30' ? "grid grid-cols-3 gap-x-4 gap-y-6" : "flex flex-col gap-4"}>
                                    {selectedProducts.map((product, idx) => (
                                        <div key={`${product.id}-${idx}`} className={`border border-slate-200 rounded p-2 flex flex-col items-center justify-center text-center overflow-hidden h-[26mm] ${paperSize === 'thermal' ? 'h-auto py-4' : ''}`}>
                                            <p className="text-xs font-bold truncate w-full px-1 mb-1">{product.name}</p>

                                            <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                                                {labelType === 'barcode' ? (
                                                    <div className="scale-x-110 origin-center"> {/* Slightly stretch barcode width */}
                                                        <Barcode
                                                            value={product.barcode}
                                                            width={1.5}
                                                            height={40}
                                                            fontSize={12}
                                                            margin={2}
                                                            displayValue={true}
                                                        />
                                                    </div>
                                                ) : (
                                                    <QRCodeSVG
                                                        value={product.barcode}
                                                        size={70}
                                                        level="M"
                                                    />
                                                )}
                                            </div>

                                            {labelType === 'qr' && <p className="text-[10px] font-mono mt-1 text-slate-600">{product.barcode}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
