"use client"
import { useEffect, useRef, useState } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string, decodedResult: any) => void
    onScanFailure?: (error: any) => void
    width?: number
    height?: number
}

export default function BarcodeScanner({ onScanSuccess, onScanFailure, width = 300, height = 300 }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)
    const [mountError, setMountError] = useState<string | null>(null)

    useEffect(() => {
        // Prevent double visualization in React Strict Mode or fast remounts
        if (scannerRef.current) {
            return
        }

        try {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                /* verbose= */ false
            )

            scanner.render(
                (decodedText, decodedResult) => {
                    // Stop scanning on success if desired, but for now just callback
                    // In auto-add mode, the parent likely closes this modal
                    onScanSuccess(decodedText, decodedResult)
                },
                (error) => {
                    if (onScanFailure) onScanFailure(error)
                }
            )

            scannerRef.current = scanner

        } catch (err: any) {
            console.error("Failed to mount scanner", err)
            setMountError(err.message || "Error starting camera")
        }

        return () => {
            if (scannerRef.current) {
                try {
                    (scannerRef.current as any).clear().catch((err: any) => console.error("Failed to clear scanner", err))
                } catch (e) {
                    console.error("Cleanup error", e)
                }
                scannerRef.current = null
            }
        }
    }, [onScanSuccess, onScanFailure])

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-black rounded-lg">
            {/* CSS Override for html5-qrcode readability */}
            <style dangerouslySetInnerHTML={{
                __html: `
                #reader button {
                    padding: 10px 20px !important;
                    font-size: 16px !important;
                    background-color: #2563eb !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 6px !important;
                    margin: 10px 0 !important;
                    cursor: pointer !important;
                }
                #reader select {
                    padding: 8px !important;
                    font-size: 14px !important;
                    margin-bottom: 10px !important;
                    width: 100% !important;
                }
                #html5-qrcode-anchor-scan-type-change {
                    font-size: 14px !important;
                    color: #2563eb !important;
                    text-decoration: underline !important;
                    display: block !important;
                    margin-top: 10px !important;
                }
            `}} />

            {mountError ? (
                <div className="text-red-500 font-bold p-4 bg-white rounded">
                    Error: {mountError}
                </div>
            ) : (
                <div id="reader" style={{ width: "100%", maxWidth: "400px" }} className="overflow-hidden rounded-lg bg-white" />
            )}
            <p className="text-white text-sm font-medium mt-2 text-center max-w-xs">
                Apunta la cámara al código de barras. Asegúrate de tener buena luz.
            </p>
        </div>
    )
}
