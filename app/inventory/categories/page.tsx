"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Plus, Trash2, ArrowLeft, Tag } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import Link from "next/link"

interface Category {
    id: string
    name: string
}

export default function CategoriesPage() {
    const supabase = createClient()
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    const fetchCategories = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name')

        if (data) setCategories(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategoryName.trim()) return

        if (editingCategory) {
            // Edit Mode
            const oldName = editingCategory.name
            const newName = newCategoryName.trim()

            if (oldName === newName) {
                setEditingCategory(null)
                setNewCategoryName("")
                setIsModalOpen(false)
                return
            }

            // 1. Update Category
            const { error: catError } = await supabase
                .from('categories')
                .update({ name: newName })
                .eq('id', editingCategory.id)

            if (catError) {
                alert(`Error al actualizar categoría: ${catError.message}`)
                return
            }

            // 2. Update Products with old name (Manual cascade)
            const { error: prodError } = await supabase
                .from('products')
                .update({ category: newName })
                .eq('category', oldName)

            if (prodError) {
                console.error("Error updating cascade products:", prodError)
                alert("Categoría actualizada, pero hubo un error actualizando los productos asociados.")
            } else {
                fetchCategories()
            }
        } else {
            // Create Mode
            const { error } = await supabase
                .from('categories')
                .insert([{ name: newCategoryName.trim() }])

            if (error) {
                console.error("Error creating category:", error)
                if (error.code === '23505') {
                    alert("Error: Esa categoría ya existe.")
                } else {
                    alert(`Error al crear categoría: ${error.message}`)
                }
                return // Don't close modal on error
            } else {
                fetchCategories()
            }
        }

        // Cleanup
        setEditingCategory(null)
        setNewCategoryName("")
        setIsModalOpen(false)
    }

    const openEdit = (cat: Category) => {
        setEditingCategory(cat)
        setNewCategoryName(cat.name)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar categoría? Ten en cuenta que esto no afectará a los productos existentes (quedarán con la categoría de texto actual).")) return

        const { error } = await supabase.from('categories').delete().eq('id', id)
        if (!error) {
            setCategories(categories.filter(c => c.id !== id))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/inventory" className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Categorías</h2>
                        <p className="text-slate-600">Administra las clasificaciones de tus productos.</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingCategory(null)
                        setNewCategoryName("")
                        setIsModalOpen(true)
                    }}
                    className="flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity shadow-sm hover:opacity-90"
                    style={{ backgroundColor: 'var(--primary)' }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Categoría
                </button>
            </div>

            <div className="max-w-3xl bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Cargando...</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-6 py-3 font-medium">Nombre</th>
                                <th className="px-6 py-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                        <Tag size={16} className="text-slate-400" />
                                        {cat.name}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => openEdit(cat)}
                                            className="text-slate-400 hover:text-indigo-600 transition-colors mr-3"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingCategory(null)
                    setNewCategoryName("")
                }}
                title={editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Electrodomésticos"
                            className="w-full border border-slate-300 bg-white rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-500 font-medium focus:ring-2 focus:ring-[var(--primary)] outline-none"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            autoFocus
                        />
                        {editingCategory && (
                            <p className="text-xs text-amber-600 mt-1">
                                ⚠ Al editar, se actualizarán todos los productos que usen esta categoría.
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false)
                                setEditingCategory(null)
                                setNewCategoryName("")
                            }}
                            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: 'var(--primary)' }}
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
