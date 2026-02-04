import { useState, useMemo } from "react"

interface UseBulkSelectionProps<T> {
    items: T[]
    getItemId: (item: T) => string
}

export function useBulkSelection<T>({ items, getItemId }: UseBulkSelectionProps<T>) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const selectedItems = useMemo(() => {
        return items.filter(item => selectedIds.has(getItemId(item)))
    }, [items, selectedIds, getItemId])

    const toggleItem = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const toggleAll = () => {
        if (selectedIds.size === items.length) {
            // Deselect all
            setSelectedIds(new Set())
        } else {
            // Select all
            setSelectedIds(new Set(items.map(getItemId)))
        }
    }

    const clearSelection = () => {
        setSelectedIds(new Set())
    }

    const isSelected = (id: string) => selectedIds.has(id)

    const isAllSelected = items.length > 0 && selectedIds.size === items.length
    const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length

    return {
        selectedIds,
        selectedItems,
        selectedCount: selectedIds.size,
        toggleItem,
        toggleAll,
        clearSelection,
        isSelected,
        isAllSelected,
        isSomeSelected,
        hasSelection: selectedIds.size > 0
    }
}
