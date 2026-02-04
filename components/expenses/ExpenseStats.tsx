import { ArrowDown, DollarSign, Wallet, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface ExpenseStatsProps {
    financials: {
        sales: number;
        cogs: number; // Cost of Goods Sold
        expenses: number;
        profit: number;
        margin: number;
    };
    totalVES: number; // Keep for reference if needed
}

export function ExpenseStats({ financials, totalVES }: ExpenseStatsProps) {
    const { sales, cogs, expenses, profit, margin } = financials;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Income Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                        <TrendingUp size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ventas</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">${sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                <p className="text-xs text-slate-500 mt-1">Ingresos brutos</p>
            </div>

            {/* Expenses Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded-lg bg-red-100 text-red-600">
                        <TrendingDown size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Gastos Op.</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">${expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                <p className="text-xs text-slate-500 mt-1">
                    Operativos + Nómina
                </p>
            </div>

            {/* Costs Card (COGS) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                        <PackageIcon size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Costo Venta</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">${cogs.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
                <p className="text-xs text-slate-500 mt-1">Costo de mercadería</p>
            </div>


            {/* Net Profit Card */}
            <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 ${profit >= 0 ? 'ring-1 ring-emerald-500/20' : 'ring-1 ring-red-500/20'}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className={`p-2 rounded-lg ${profit >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        <Activity size={20} />
                    </div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ganancia Real</span>
                </div>
                <h3 className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    ${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                    Margen Neto: {margin}%
                </p>
            </div>
        </div>
    );
}

function PackageIcon({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22v-9" /></svg>
    )
}
