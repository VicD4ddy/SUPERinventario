import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    description?: string;
    action?: React.ReactNode;
}

export function KPICard({ title, value, icon: Icon, trend, trendUp, description, action }: KPICardProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-slate-600">{title}</h3>
                <Icon className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <div className="text-2xl font-bold text-slate-900">{value}</div>
                    {(trend || description) && (
                        <p className="text-xs text-slate-700 mt-1">
                            {trend && (
                                <span className={cn("font-medium mr-1", trendUp ? "text-emerald-700" : "text-rose-700")}>
                                    {trend}
                                </span>
                            )}
                            {description}
                        </p>
                    )}
                </div>
                {action && <div>{action}</div>}
            </div>
        </div>
    );
}
