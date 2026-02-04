import { useState, useEffect } from "react";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { createClient } from "@/utils/supabase/client";
import { ExpenseCategory } from "@/types";
import { Loader2, Plus, Calendar } from "lucide-react";

interface ExpenseFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
    const supabase = createClient();
    const { rate } = useExchangeRate();

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);

    // Form State
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState<"USD" | "VES">("USD");
    const [categoryId, setCategoryId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash_usd");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState("");

    // Custom Exchange Rate (optional override)
    const [customRate, setCustomRate] = useState<string>("");

    useEffect(() => {
        // Fetch Categories
        async function fetchCategories() {
            const { data } = await supabase
                .from('expense_categories')
                .select('*')
                .order('name');
            if (data) setCategories(data);
        }
        fetchCategories();
    }, []);

    // Calculated fields
    const activeRate = customRate ? parseFloat(customRate) : rate;
    const amountUSD = currency === "USD" ? parseFloat(amount || "0") : (parseFloat(amount || "0") / (activeRate || 1));
    const amountVES = currency === "VES" ? parseFloat(amount || "0") : (parseFloat(amount || "0") * activeRate);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return alert("Monto inválido");
        if (!categoryId) return alert("Selecciona una categoría");

        setLoading(true);
        try {
            const { error } = await supabase.rpc('create_expense', {
                p_description: description,
                p_amount: amountUSD,
                p_amount_ves: amountVES,
                p_exchange_rate: activeRate,
                p_category_id: categoryId,
                p_payment_method: paymentMethod,
                p_notes: notes,
                p_date: date
            });

            if (error) throw error;
            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Error al registrar gasto");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700">Descripción del Gasto</label>
                <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej. Pago de Alquiler Enero"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Monto</label>
                    <div className="relative mt-1">
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="block w-full rounded-md border border-slate-300 pl-3 pr-12 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                            <select
                                value={currency}
                                onChange={(e) => {
                                    setCurrency(e.target.value as "USD" | "VES");
                                    // Reset payment method to default likely matching currency
                                    if (e.target.value === "USD") setPaymentMethod("cash_usd");
                                    else setPaymentMethod("pago_movil");
                                }}
                                className="h-full rounded-r-md border-0 bg-transparent py-0 pl-2 pr-2 text-slate-500 text-xs focus:ring-0"
                            >
                                <option value="USD">USD</option>
                                <option value="VES">Bs</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Tasa de Cambio</label>
                    <input
                        type="number"
                        step="0.01"
                        value={customRate || rate}
                        onChange={(e) => setCustomRate(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Conversion Preview */}
            <div className="text-xs text-slate-500 text-right">
                {currency === "USD"
                    ? `Equivalente: ${amountVES.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs`
                    : `Equivalente: $${amountUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                }
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Categoría</label>
                    <select
                        required
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">Seleccionar...</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Fecha</label>
                    <div className="relative mt-1">
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            style={{ colorScheme: 'light' }}
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">Método de Pago</label>
                <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="cash_usd">Efectivo USD</option>
                    <option value="cash_ves">Efectivo Bs</option>
                    <option value="zelle">Zelle</option>
                    <option value="pago_movil">Pago Móvil</option>
                    <option value="transfer_ves">Transferencia Bs</option>
                    <option value="transfer_usd">Transferencia USD</option>
                    <option value="other">Otro</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700">Notas (Opcional)</label>
                <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md border border-slate-300"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center"
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Registrar Gasto
                </button>
            </div>
        </form>
    );
}
