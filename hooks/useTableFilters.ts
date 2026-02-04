import { useState, useMemo } from "react"

export interface Filter<T> {
    id: string
    label: string
    predicate: (item: T) => boolean
    color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

interface UseTableFiltersProps<T> {
    data: T[]
    filters: Filter<T>[]
}

export function useTableFilters<T>({ data, filters }: UseTableFiltersProps<T>) {
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())

    const filteredData = useMemo(() => {
        if (activeFilters.size === 0) return data

        return data.filter(item => {
            // Item must match ALL active filters (AND logic)
            return Array.from(activeFilters).every(filterId => {
                const filter = filters.find(f => f.id === filterId)
                return filter ? filter.predicate(item) : true
            })
        })
    }, [data, activeFilters, filters])

    const toggleFilter = (filterId: string) => {
        setActiveFilters(prev => {
            const newSet = new Set(prev)
            if (newSet.has(filterId)) {
                newSet.delete(filterId)
            } else {
                newSet.add(filterId)
            }
            return newSet
        })
    }

    const clearFilters = () => {
        setActiveFilters(new Set())
    }

    const getFilterCount = (filterId: string): number => {
        const filter = filters.find(f => f.id === filterId)
        if (!filter) return 0
        return data.filter(filter.predicate).length
    }

    return {
        filteredData,
        activeFilters,
        toggleFilter,
        clearFilters,
        getFilterCount,
        hasActiveFilters: activeFilters.size > 0
    }
}
