"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCcw } from "lucide-react"

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    info: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        info: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, info: null }
    }

    public componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Uncaught error:", error, info)
        this.setState({ info })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-4">
                    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center">
                        <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="text-red-600 w-8 h-8" />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Algo salió mal</h1>
                        <p className="text-slate-500 mb-6">La aplicación encontró un error inesperado.</p>

                        <div className="bg-slate-100 p-4 rounded-lg text-left text-xs font-mono text-red-600 overflow-auto max-h-40 mb-6 border border-slate-200">
                            {this.state.error?.toString()}
                            {this.state.info?.componentStack?.slice(0, 200)}...
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCcw size={18} />
                            Recargar Aplicación
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
