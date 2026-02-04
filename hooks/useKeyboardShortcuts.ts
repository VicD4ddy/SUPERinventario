"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcut {
    key: string
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
    callback: (e: KeyboardEvent) => void
    description?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in inputs/textareas
        const target = e.target as HTMLElement
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            // Allow Escape to work even in inputs
            if (e.key !== 'Escape') {
                return
            }
        }

        for (const shortcut of shortcuts) {
            const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase()
            const ctrlMatches = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
            const shiftMatches = shortcut.shift ? e.shiftKey : !e.shiftKey
            const altMatches = shortcut.alt ? e.altKey : !e.altKey

            if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
                e.preventDefault()
                shortcut.callback(e)
                break
            }
        }
    }, [shortcuts])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}

// Global shortcuts helper
export function isMac() {
    return typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

export function getModifierKey() {
    return isMac() ? '⌘' : 'Ctrl'
}
