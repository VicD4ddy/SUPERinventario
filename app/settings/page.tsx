"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSettings } from "@/contexts/SettingsContext"
import { createClient } from "@/utils/supabase/client"
import { Save, Shield, ChevronRight, Store, Receipt, Calculator, Settings2, Download } from "lucide-react"

export default function SettingsPage() {
    const settings = useSettings() // Get all settings from context
    const { updateSettings } = settings

    // Local state for all fields
    const [formData, setFormData] = useState({
        businessName: "",
        logoUrl: "",
        themeColor: "#4f46e5",
        phoneNumber: "",
        receiptFooter: "",
        showTaxId: true,
        paperSize: '80mm',
        defaultTaxRate: 0,
        currencySymbol: "$",
        allowNegativeStock: false,
        lowStockThreshold: 5,
        enableSounds: true,
        tableDensity: 'comfortable'
    })

    const [activeTab, setActiveTab] = useState<'general' | 'receipts' | 'rules' | 'system'>('general')

    // Hydrate state from context
    useEffect(() => {
        setFormData({
            businessName: settings.businessName,
            logoUrl: settings.logoUrl || "",
            themeColor: settings.themeColor,
            phoneNumber: settings.phoneNumber,
            receiptFooter: settings.receiptFooter,
            showTaxId: settings.showTaxId,
            paperSize: settings.paperSize,
            defaultTaxRate: settings.defaultTaxRate,
            currencySymbol: settings.currencySymbol,
            allowNegativeStock: settings.allowNegativeStock,
            lowStockThreshold: settings.lowStockThreshold,
            enableSounds: settings.enableSounds,
            tableDensity: settings.tableDensity
        })
    }, [settings.businessName, settings.receiptFooter]) // Simple dep check

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await updateSettings(formData)
        alert("Configuración guardada exitosamente.")
    }

    const [isExporting, setIsExporting] = useState(false)
    const supabase = createClient() // We need this here for the direct fetch

    const handleExportBackup = async () => {
        try {
            setIsExporting(true)

            // 1. Fetch Full Backup (via RPC)
            const { data, error } = await supabase.rpc('get_full_database_backup')

            if (error) throw error

            // 2. Create Blob and Download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `full-backup-inventario-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            alert("Respaldo completo descargado correctamente.")

        } catch (error) {
            console.error("Backup failed:", error)
            alert("Error al generar el respaldo. Revisa la consola.")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2 text-slate-900">Configuración Avanzada</h2>
                <p className="text-slate-600">Personaliza cada aspecto de tu sistema.</p>
            </div>

            {/* Quick Access Users */}
            <Link href="/settings/users">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-xl shadow-md flex items-center justify-between cursor-pointer hover:shadow-lg transition-all text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold">Gestión de Usuarios</h3>
                            <p className="text-xs text-indigo-100">Administrar roles y permisos</p>
                        </div>
                    </div>
                    <ChevronRight className="text-white/70" />
                </div>
            </Link>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                    {[
                        { id: 'general', label: 'General & Marca', icon: Store },
                        { id: 'receipts', label: 'Punto de Venta', icon: Receipt },
                        { id: 'rules', label: 'Reglas de Negocio', icon: Calculator },
                        { id: 'system', label: 'Sistema & Datos', icon: Settings2 },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <form onSubmit={handleSubmit} className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">

                    {/* --- GENERAL TAB --- */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Identidad del Negocio</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-base font-medium text-slate-900">Nombre del Negocio</label>
                                    <input
                                        type="text"
                                        value={formData.businessName}
                                        onChange={e => handleChange('businessName', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-slate-900 placeholder:text-slate-400 px-3 py-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-900">Teléfono (WhatsApp)</label>
                                    <input
                                        type="text"
                                        value={formData.phoneNumber}
                                        onChange={e => handleChange('phoneNumber', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-slate-900 placeholder:text-slate-400 px-3 py-2 border"
                                        placeholder="Ej: 58412..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-base font-medium text-slate-900">URL del Logo</label>
                                <input
                                    type="text"
                                    value={formData.logoUrl}
                                    onChange={e => handleChange('logoUrl', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-slate-900 placeholder:text-slate-400 px-3 py-2 border"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-base font-medium text-slate-900 mb-2">Color Principal</label>
                                <div className="flex flex-wrap gap-2">
                                    {["#4f46e5", "#ea580c", "#dc2626", "#16a34a", "#2563eb", "#9333ea", "#db2777", "#0f172a"].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => handleChange('themeColor', c)}
                                            className={`w-8 h-8 rounded-full border-2 ${formData.themeColor === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- RECEIPTS TAB --- */}
                    {activeTab === 'receipts' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Configuración de Recibos</h3>

                            <div>
                                <label className="block text-base font-medium text-slate-900">Mensaje Pie de Página</label>
                                <textarea
                                    rows={3}
                                    value={formData.receiptFooter}
                                    onChange={e => handleChange('receiptFooter', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-slate-900 placeholder:text-slate-400 px-3 py-2 border"
                                    placeholder="Gracias por su compra. No se aceptan devoluciones después de 3 días."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-base font-medium text-slate-900">Tamaño de Papel</label>
                                    <select
                                        value={formData.paperSize}
                                        onChange={e => handleChange('paperSize', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-slate-900 placeholder:text-slate-400 px-3 py-2 border"
                                    >
                                        <option value="80mm">80mm (Estándar)</option>
                                        <option value="58mm">58mm (Pequeño)</option>
                                    </select>
                                </div>
                                <div className="flex items-center h-full pt-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.showTaxId}
                                            onChange={e => handleChange('showTaxId', e.target.checked)}
                                            className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-base text-slate-900">Mostrar RIF/ID Fiscal en ticket</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- RULES TAB --- */}
                    {activeTab === 'rules' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Finanzas e Inventario</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-base font-medium text-slate-900">Moneda (Símbolo)</label>
                                    <input
                                        type="text"
                                        value={formData.currencySymbol}
                                        onChange={e => handleChange('currencySymbol', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-slate-900 placeholder:text-slate-400 px-3 py-2 border"
                                        placeholder="$"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-slate-900">IVA por Defecto (%)</label>
                                    <input
                                        type="number"
                                        value={formData.defaultTaxRate}
                                        onChange={e => handleChange('defaultTaxRate', parseFloat(e.target.value))}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-slate-900 placeholder:text-slate-400 px-3 py-2 border"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="font-semibold text-slate-800 mb-3">Control de Stock</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.allowNegativeStock}
                                                onChange={e => handleChange('allowNegativeStock', e.target.checked)}
                                                className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <span className="block text-sm font-medium text-slate-900">Permitir Stock Negativo</span>
                                                <span className="block text-xs text-slate-500">Si se activa, podrás vender productos incluso con stock en 0.</span>
                                            </div>
                                        </div>
                                    </label>

                                    <div>
                                        <label className="block text-base font-medium text-slate-900">Umbral de Alerta de Stock Bajo</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={formData.lowStockThreshold}
                                                onChange={e => handleChange('lowStockThreshold', parseInt(e.target.value))}
                                                className="mt-1 w-24 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-slate-900 px-3 py-2 border"
                                            />
                                            <span className="text-sm text-slate-500">unidades</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SYSTEM TAB --- */}
                    {activeTab === 'system' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Sistema y Preferencias</h3>

                            <div className="space-y-4">
                                <h4 className="font-medium text-slate-800">Interfaz</h4>
                                <div>
                                    <label className="block text-base font-medium text-slate-900">Densidad de Tablas</label>
                                    <select
                                        value={formData.tableDensity}
                                        onChange={e => handleChange('tableDensity', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base text-slate-900 placeholder:text-slate-400 px-3 py-2 border"
                                    >
                                        <option value="comfortable">Cómoda (Espaciosa)</option>
                                        <option value="compact">Compacta (Más datos)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.enableSounds}
                                            onChange={e => handleChange('enableSounds', e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 rounded border-slate-300"
                                        />
                                        <span className="text-base text-slate-900">Habilitar Efectos de Sonido</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-6 border-t">
                                <h4 className="font-medium text-slate-800 mb-2">Zona de Datos</h4>
                                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <h5 className="font-bold text-slate-900">Respaldo de Datos</h5>
                                        <p className="text-xs text-slate-500">Descarga una copia local de tus productos y clientes.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleExportBackup}
                                        disabled={isExporting}
                                        className="flex items-center gap-2 bg-white border border-slate-300 text-slate-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Download size={16} className={isExporting ? "animate-bounce" : ""} />
                                        {isExporting ? "Exportando..." : "Exportar JSON"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-6 border-t flex justify-end">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Save size={18} />
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
