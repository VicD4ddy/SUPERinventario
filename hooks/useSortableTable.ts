import { useState, useMemo } from "react"

export type SortDirection = 'asc' | 'desc' | null

interface UseSortableTableProps<T> {
    data: T[]
    initialSortKey?: keyof T
    initialDirection?: SortDirection
}

export function useSortableTable<T>({
    data,
    initialSortKey,
    initialDirection = 'asc'
}: UseSortableTableProps<T>) {
    const [sortKey, setSortKey] = useState<keyof T | null>(initialSortKey || null)
    const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection)

    const sortedData = useMemo(() => {
        if (!sortKey || !sortDirection) return data

        return [...data].sort((a, b) => {
            const aVal = a[sortKey]
            const bVal = b[sortKey]

            // Handle null/undefined
            if (aVal === null || aVal === undefined) return 1
            if (bVal === null || bVal === undefined) return -1

            // String comparison
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                const comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase())
                return sortDirection === 'asc' ? comparison : -comparison
            }

            // Number comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
            }

            // Date comparison
            if (aVal instanceof Date && bVal instanceof Date) {
                return sortDirection === 'asc'
                    ? aVal.getTime() - bVal.getTime()
                    : bVal.getTime() - aVal.getTime()
            }

            // Boolean comparison
            if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
                return sortDirection === 'asc'
                    ? (aVal === bVal ? 0 : aVal ? 1 : -1)
                    : (aVal === bVal ? 0 : aVal ? -1 : 1)
            }

            return 0
        })
    }, [data, sortKey, sortDirection])

    const handleSort = (key: keyof T) => {
        if (sortKey === key) {
            // Cycle: asc → desc → null
            if (sortDirection === 'asc') {
                setSortDirection('desc')
            } else if (sortDirection === 'desc') {
                setSortDirection(null)
                setSortKey(null)
            }
        } else {
            setSortKey(key)
            setSortDirection('asc')
        }
    }

    return {
        sortedData,
        sortKey,
        sortDirection,
        handleSort
    }
}
