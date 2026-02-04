"use client"

import { useEffect, useState, useRef } from "react"

interface PullToRefreshProps {
    onRefresh: () => Promise<void> | void
    children: React.ReactNode
    disabled?: boolean
}

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
    const [isPulling, setIsPulling] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [pullDistance, setPullDistance] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const startY = useRef(0)
    const isAtTop = useRef(true)

    const PULL_THRESHOLD = 80 // Pixels to pull before refresh
    const MAX_PULL = 120 // Maximum pull distance

    useEffect(() => {
        const container = containerRef.current
        if (!container || disabled) return

        const handleTouchStart = (e: TouchEvent) => {
            const scrollTop = container.scrollTop
            isAtTop.current = scrollTop === 0

            if (isAtTop.current) {
                startY.current = e.touches[0].clientY
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!isAtTop.current || isRefreshing) return

            const currentY = e.touches[0].clientY
            const diff = currentY - startY.current

            if (diff > 0) {
                // Pulling down
                const pull = Math.min(diff * 0.5, MAX_PULL) // Dampen effect
                setPullDistance(pull)

                if (pull > 10) {
                    setIsPulling(true)
                }
            }
        }

        const handleTouchEnd = async () => {
            if (!isPulling) return

            if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
                setIsRefreshing(true)
                try {
                    await onRefresh()
                } finally {
                    setIsRefreshing(false)
                    setIsPulling(false)
                    setPullDistance(0)
                }
            } else {
                setIsPulling(false)
                setPullDistance(0)
            }
        }

        container.addEventListener('touchstart', handleTouchStart, { passive: true })
        container.addEventListener('touchmove', handleTouchMove, { passive: true })
        container.addEventListener('touchend', handleTouchEnd)

        return () => {
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
        }
    }, [isPulling, pullDistance, isRefreshing, onRefresh, disabled])

    const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1)
    const rotation = (pullDistance / PULL_THRESHOLD) * 360

    return (
        <div ref={containerRef} className="relative h-full overflow-y-auto">
            {/* Pull Indicator */}
            <div
                className="md:hidden absolute top-0 left-0 right-0 flex justify-center z-10 pointer-events-none"
                style={{
                    transform: `translateY(${Math.max(pullDistance - 40, 0)}px)`,
                    transition: isPulling ? 'none' : 'transform 0.3s ease-out',
                    opacity: opacity
                }}
            >
                <div className="bg-white rounded-full p-2 shadow-lg">
                    <svg
                        className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`}
                        style={!isRefreshing ? { transform: `rotate(${rotation}deg)` } : {}}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
            </div>

            {children}
        </div>
    )
}
