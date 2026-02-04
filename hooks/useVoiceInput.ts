"use client"

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseVoiceInputProps {
    onResult: (text: string) => void
    onError?: (error: string) => void
}

export function useVoiceInput({ onResult, onError }: UseVoiceInputProps) {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState("")
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = false // Stop after one sentence/command
            recognitionRef.current.interimResults = true
            recognitionRef.current.lang = 'es-ES' // Spanish by default

            recognitionRef.current.onstart = () => {
                setIsListening(true)
            }

            recognitionRef.current.onend = () => {
                setIsListening(false)
            }

            recognitionRef.current.onresult = (event: any) => {
                let interm = ""
                let final = ""

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript
                    } else {
                        interm += event.results[i][0].transcript
                    }
                }

                setTranscript(interm || final)

                if (final) {
                    onResult(final)
                }
            }

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech Error:", event.error)
                if (onError) onError(event.error)
                setIsListening(false)
            }
        }
    }, [onResult, onError])

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start()
            } catch (e) {
                console.error("Already started", e)
            }
        } else {
            if (onError) onError("Browser not supported (Chrome/Edge required)")
        }
    }, [onError])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
    }, [])

    return {
        isListening,
        transcript,
        startListening,
        stopListening
    }
}
