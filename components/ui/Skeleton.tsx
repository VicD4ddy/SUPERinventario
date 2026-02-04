export function SkeletonCard() {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-slate-200 rounded-full w-16"></div>
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-full"></div>
                <div className="h-3 bg-slate-100 rounded w-5/6"></div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <div className="flex-1 h-9 bg-slate-200 rounded-xl"></div>
                <div className="w-10 h-9 bg-slate-200 rounded-xl"></div>
            </div>
        </div>
    )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
            <div className="hidden md:block">
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-3 bg-slate-200 rounded flex-1"></div>
                    ))}
                </div>
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="border-b border-slate-100 p-4 flex gap-4">
                        {[...Array(4)].map((_, j) => (
                            <div key={j} className="h-4 bg-slate-100 rounded flex-1"></div>
                        ))}
                    </div>
                ))}
            </div>
            {/* Mobile skeleton cards */}
            <div className="md:hidden space-y-4 p-4">
                {[...Array(rows)].map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </div>
    )
}

export function SkeletonKPI() {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                <div className="h-4 bg-slate-100 rounded w-8"></div>
            </div>
            <div className="h-4 bg-slate-100 rounded w-24 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-32 mb-1"></div>
            <div className="h-3 bg-slate-100 rounded w-20"></div>
        </div>
    )
}

export function SkeletonChart() {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-40 mb-6"></div>
            <div className="h-64 bg-slate-100 rounded"></div>
        </div>
    )
}
