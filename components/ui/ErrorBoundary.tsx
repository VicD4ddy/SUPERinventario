"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
                    <h2 className="text-lg font-bold text-red-800 mb-2">Algo salió mal</h2>
                    <pre className="text-sm text-red-600 overflow-auto max-h-40">
                        {this.state.error?.message}
                    </pre>
                    <button
                        className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
                        onClick={() => this.setState({ hasError: false })}
                    >
                        Intentar de nuevo
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
