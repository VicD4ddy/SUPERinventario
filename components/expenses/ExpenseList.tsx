import { Expense } from "@/types";
import { format } from "date-fns";
import { User, Trash2, FileText } from "lucide-react";

interface ExpenseListProps {
    expenses: Expense[];
    onDelete?: (id: string) => void;
}

export function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
    if (expenses.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
                <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <FileText className="text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-medium">No hay gastos registrados</h3>
                <p className="text-slate-500 text-sm mt-1">Registra un nuevo gasto para comenzar.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 font-medium text-slate-700">Fecha</th>
                            <th className="px-4 py-3 font-medium text-slate-700">Descripción</th>
                            <th className="px-4 py-3 font-medium text-slate-700">Categoría</th>
                            <th className="px-4 py-3 font-medium text-slate-700">Monto</th>
                            <th className="px-4 py-3 font-medium text-slate-700">Método</th>
                            <th className="px-4 py-3 font-medium text-slate-700 hidden md:table-cell">Registrado Por</th>
                            {onDelete && <th className="px-4 py-3 font-medium text-slate-700 text-right">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                    {format(new Date(expense.date), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-slate-900 font-medium">{expense.description}</p>
                                    {expense.notes && <p className="text-xs text-slate-500 truncate max-w-[150px]">{expense.notes}</p>}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
                                        ${expense.category?.type === 'fixed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {expense.category?.name || 'Sin Categoría'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-slate-900 font-bold">${expense.amount.toFixed(2)}</p>
                                    <p className="text-xs text-slate-500">{expense.amount_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</p>
                                </td>
                                <td className="px-4 py-3 text-slate-600 capitalize">
                                    {expense.payment_method.replace('_', ' ')}
                                </td>
                                <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                                    <div className="flex items-center gap-2">
                                        <User size={14} />
                                        <span>{expense.user_id ? "Usuario" : "-"}</span>
                                    </div>
                                </td>
                                {onDelete && (
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => onDelete(expense.id)}
                                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                                            title="Eliminar Gasto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
                {expenses.map((expense) => (
                    <div key={expense.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-slate-900">{expense.description}</p>
                                <p className="text-xs text-slate-500">
                                    {format(new Date(expense.date), 'dd MMM yyyy')}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-900 text-lg">${expense.amount.toFixed(2)}</p>
                                <p className="text-xs text-slate-500">{expense.amount_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })} Bs</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                ${expense.category?.type === 'fixed' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                {expense.category?.name || 'Sin Categoría'}
                            </span>

                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 capitalize bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                    {expense.payment_method.replace('_', ' ')}
                                </span>
                                {onDelete && (
                                    <button
                                        onClick={() => onDelete(expense.id)}
                                        className="p-1.5 bg-white text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors shadow-sm"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {expense.notes && (
                            <p className="mt-2 text-xs text-slate-400 italic break-words bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                                "{expense.notes}"
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
