"use client"

import { useState } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface VoiceAssistantProps {
    onItemsDetected: (items: any[]) => void
}

export function VoiceAssistant({ onItemsDetected }: VoiceAssistantProps) {
    const [isProcessing, setIsProcessing] = useState(false)

    // Handler for when speech ends and we have text
    const handleVoiceResult = async (text: string) => {
        if (!text.trim()) return

        setIsProcessing(true)
        try {
            const res = await fetch('/api/ai/parse-order', {
                method: 'POST',
                body: JSON.stringify({ text })
            })
            const data = await res.json()

            if (data.items && Array.isArray(data.items)) {
                onItemsDetected(data.items)
            }
        } catch (error) {
            console.error("Processing failed", error)
        } finally {
            setIsProcessing(false)
        }
    }

    const { isListening, startListening, stopListening, transcript } = useVoiceInput({
        onResult: handleVoiceResult,
        onError: (e) => console.error(e)
    })

    return (
        <div className="relative">
            {/* Transcript Popup */}
            {(isListening || isProcessing) && (
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 bg-slate-900 text-white text-sm p-4 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2 z-50 text-center">
                    {isProcessing ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin w-4 h-4" />
                            <span>Procesando...</span>
                        </div>
                    ) : (
                        <div>
                            <p className="opacity-70 text-xs uppercase tracking-wider mb-1">Escuchando...</p>
                            <p className="font-medium">"{transcript}"</p>
                        </div>
                    )}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2 border-8 border-transparent border-t-slate-900"></div>
                </div>
            )}

            <button
                onClick={isListening ? stopListening : startListening}
                className={`p-4 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center ${isListening
                        ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
                    }`}
            >
                {isListening ? (
                    <MicOff className="text-white w-6 h-6" />
                ) : (
                    <Mic className="text-white w-6 h-6" />
                )}
            </button>
        </div>
    )
}
