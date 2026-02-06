"use client"

import { Modal } from "@/components/ui/Modal"
import { FileSpreadsheet, FileText } from "lucide-react"

interface ExportModalProps {
    isOpen: boolean
    onClose: () => void
    onExportExcel: () => void
    onExportPDF: () => void
}

export function ExportModal({ isOpen, onClose, onExportExcel, onExportPDF }: ExportModalProps) {

    const handleExcelClick = () => {
        onExportExcel()
        onClose()
    }

    const handlePDFClick = () => {
        onExportPDF()
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Exportar Inventario">
            <div className="space-y-4">
                <p className="text-base font-semibold" style={{ color: '#000000' }}>
                    Selecciona el formato en el que deseas exportar tu inventario
                </p>

                {/* Excel Export Button */}
                <button
                    onClick={handleExcelClick}
                    className="w-full group"
                >
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all duration-200 cursor-pointer">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl" style={{ color: '#000000' }}>
                                    Exportar en Excel
                                </h3>
                                <p className="text-base mt-1 font-medium" style={{ color: '#000000' }}>
                                    Formato .xlsx • Editable • Con fórmulas
                                </p>
                            </div>
                        </div>
                    </div>
                </button>

                {/* PDF Export Button */}
                <button
                    onClick={handlePDFClick}
                    className="w-full group"
                >
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 cursor-pointer">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl" style={{ color: '#000000' }}>
                                    Exportar en PDF
                                </h3>
                                <p className="text-base mt-1 font-medium" style={{ color: '#000000' }}>
                                    Formato .pdf • Para imprimir • No editable
                                </p>
                            </div>
                        </div>
                    </div>
                </button>
            </div>
        </Modal>
    )
}
