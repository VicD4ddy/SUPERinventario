"use client"

import { X } from "lucide-react"
import { useEffect } from "react"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    fullscreenMobile?: boolean
}

export function Modal({ isOpen, onClose, title, children, fullscreenMobile = true }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }

        // Prevent body scroll when modal is open
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        window.addEventListener("keydown", handleEsc)
        return () => {
            window.removeEventListener("keydown", handleEsc)
            document.body.style.overflow = 'unset'
        }
    }, [onClose, isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm md:p-4 animate-in fade-in duration-200">
            <div
                className={`w-full bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col
                    ${fullscreenMobile
                        ? 'h-full md:h-auto md:max-h-[85vh] md:rounded-2xl md:max-w-lg'
                        : 'rounded-t-3xl md:rounded-2xl max-h-[90vh] md:max-h-[85vh] md:max-w-lg'
                    }`}
            >
                {/* Header - Sticky */}
                <div className="flex items-center justify-between p-4 md:p-6 pb-3 md:pb-4 shrink-0 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-slate-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 md:p-1.5 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0 active:scale-95"
                        aria-label="Cerrar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-4 md:p-6 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>
    )
}
