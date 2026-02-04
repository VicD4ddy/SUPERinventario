"use client"

import { CommandPalette } from "@/components/ui/CommandPalette"
import { KeyboardShortcutsHelp } from "@/components/ui/KeyboardShortcutsHelp"
import { useCommandPaletteData } from "@/contexts/CommandPaletteContext"

export function CommandPaletteWrapper() {
    const { products, customers } = useCommandPaletteData()

    return (
        <>
            <CommandPalette products={products} customers={customers} />
            <KeyboardShortcutsHelp />
        </>
    )
}
