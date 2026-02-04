import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface FloatingActionButtonProps {
    onClick: () => void
    icon: LucideIcon
    label?: string
    className?: string
}

export function FloatingActionButton({ onClick, icon: Icon, label, className = "" }: FloatingActionButtonProps) {
    return (
        <>
            {/* Mobile FAB */}
            <button
                onClick={onClick}
                className={`md:hidden fixed bottom-20 right-6 z-40 flex items-center gap-3 bg-[var(--primary)] text-white rounded-full shadow-2xl hover:shadow-xl active:scale-95 transition-all group ${className}`}
                aria-label={label}
            >
                <div className="p-4">
                    <Icon size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </div>
                {label && (
                    <span className="pr-5 font-semibold text-sm whitespace-nowrap">
                        {label}
                    </span>
                )}

                {/* Ripple effect background */}
                <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-active:scale-100 transition-transform duration-300" />
            </button>
        </>
    )
}
