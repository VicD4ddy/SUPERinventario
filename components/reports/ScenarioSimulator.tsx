"use client"

import { useState, useEffect } from "react"
import { Calculator, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface ScenarioSimulatorProps {
    currentMonthlyRevenue: number
    currentMonthlyCost: number
    currentMonthlyExpenses: number
}

export function ScenarioSimulator({
    currentMonthlyRevenue = 0,
    currentMonthlyCost = 0,
    currentMonthlyExpenses = 0
}: ScenarioSimulatorProps) {

    // Sliders state (percentages)
    const [priceChange, setPriceChange] = useState(0) // -50% to +50%
    const [costChange, setCostChange] = useState(0)   // -50% to +50%
    const [volumeChange, setVolumeChange] = useState(0) // -50% to +50%

    // Calculated values
    const [projectedRevenue, setProjectedRevenue] = useState(0)
    const [projectedCost, setProjectedCost] = useState(0)
    const [projectedProfit, setProjectedProfit] = useState(0)
    const [currentProfit, setCurrentProfit] = useState(0)

    useEffect(() => {
        // Base values
        const baseRevenue = currentMonthlyRevenue || 0
        const baseCost = currentMonthlyCost || 0
        const fixedExpenses = currentMonthlyExpenses || 0

        setCurrentProfit(baseRevenue - baseCost - fixedExpenses)

        // Scenario Calculation
        // 1. Volume impact
        const volumeMultiplier = 1 + (volumeChange / 100)

        // 2. Price impact (affects Revenue per unit)
        const priceMultiplier = 1 + (priceChange / 100)

        // 3. Cost impact (affects Cost per unit)
        const costMultiplier = 1 + (costChange / 100)

        // New Totals
        // Revenue = (BaseRev * VolumeMult) * PriceMult
        // We assume BaseRev = Price * Quantity. NewRev = (Price*PriceMult) * (Quantity*VolMult)
        const newRevenue = baseRevenue * volumeMultiplier * priceMultiplier

        // Cost = (BaseCost * VolumeMult) * CostMult
        // We assume BaseCost = UnitCost * Quantity. NewCost = (UnitCost*CostMult) * (Quantity*VolMult)
        const newCost = baseCost * volumeMultiplier * costMultiplier

        // Expenses are fixed (unless we added an expense slider, but for now fixed)
        const totalExpenses = fixedExpenses

        setProjectedRevenue(newRevenue)
        setProjectedCost(newCost)
        setProjectedProfit(newRevenue - newCost - totalExpenses)

    }, [currentMonthlyRevenue, currentMonthlyCost, currentMonthlyExpenses, priceChange, costChange, volumeChange])

    const profitDiff = projectedProfit - currentProfit
    const profitGrowth = currentProfit !== 0 ? (profitDiff / Math.abs(currentProfit)) * 100 : 0

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Calculator size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Simulador de Escenarios</h3>
                    <p className="text-sm text-slate-500">Juega con las variables para ver el futuro</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-6">
                    {/* Price Slider */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Precios de Venta</label>
                            <span className={`text-sm font-bold ${priceChange > 0 ? 'text-emerald-600' : priceChange < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                                {priceChange > 0 ? '+' : ''}{priceChange}%
                            </span>
                        </div>
                        <input
                            type="range" min="-50" max="50" step="1"
                            value={priceChange}
                            onChange={(e) => setPriceChange(parseInt(e.target.value))}
                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-slate-500 mt-1">Impacta directamente en el margen de ganancia.</p>
                    </div>

                    {/* Volume Slider */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Volumen de Ventas</label>
                            <span className={`text-sm font-bold ${volumeChange > 0 ? 'text-emerald-600' : volumeChange < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                                {volumeChange > 0 ? '+' : ''}{volumeChange}%
                            </span>
                        </div>
                        <input
                            type="range" min="-50" max="50" step="1"
                            value={volumeChange}
                            onChange={(e) => setVolumeChange(parseInt(e.target.value))}
                            className="w-full accent-blue-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-slate-500 mt-1">Aumentar ventas requiere más stock (costo).</p>
                    </div>

                    {/* Cost Slider */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Costos de Proveedor</label>
                            <span className={`text-sm font-bold ${costChange > 0 ? 'text-rose-600' : costChange < 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                {costChange > 0 ? '+' : ''}{costChange}%
                            </span>
                        </div>
                        <input
                            type="range" min="-50" max="50" step="1"
                            value={costChange}
                            onChange={(e) => setCostChange(parseInt(e.target.value))}
                            className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-slate-500 mt-1">Si negocias mejores precios o sube la inflación.</p>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col justify-center space-y-6">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Ganancia Actual</p>
                        <div className="text-2xl font-bold text-slate-900">${currentProfit.toFixed(2)}</div>
                    </div>

                    <div className="relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-slate-200"></div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-2 text-slate-400">
                            VS
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Ganancia Proyectada</p>
                        <div className={`text-4xl font-extrabold flex items-center gap-2 ${projectedProfit >= currentProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ${projectedProfit.toFixed(2)}
                            {projectedProfit >= currentProfit ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
                        </div>
                        <div className={`text-sm font-medium mt-1 ${profitDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {profitDiff >= 0 ? '+' : ''}{profitDiff.toFixed(2)} ({profitGrowth.toFixed(1)}%)
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
                        <div className="flex justify-between">
                            <span>Ingresos:</span>
                            <span className="font-medium">${projectedRevenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Costos:</span>
                            <span className="font-medium">-${projectedCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Gastos Fijos:</span>
                            <span className="font-medium">-${currentMonthlyExpenses.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
