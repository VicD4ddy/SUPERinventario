"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Shield, User, Clock, AlertTriangle } from "lucide-react"

interface UserData {
    id: string
    email: string
    full_name: string
    role: 'admin' | 'seller'
    created_at: string
    last_sign_in_at: string
}

export default function UserManagementPage() {
    const supabase = createClient()
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        checkPermissionAndFetch()
    }, [])

    const checkPermissionAndFetch = async () => {
        try {
            setLoading(true)
            // 1. Check current user role
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            setCurrentUserRole(profile?.role)

            if (profile?.role !== 'admin') {
                setError(`No tienes permisos de administrador. Tu rol actual es: ${profile?.role || 'Ninguno'}`)
                setLoading(false)
                return
            }

            // 2. Fetch users using RPC
            const { data, error: rpcError } = await supabase.rpc('get_users_management')

            if (rpcError) throw rpcError
            if (data) setUsers(data)

        } catch (err: any) {
            console.error(err)
            setError(err.message || "Error al cargar usuarios")
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase.rpc('update_user_role', {
                target_user_id: userId,
                new_role: newRole
            })

            if (error) throw error

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as 'admin' | 'seller' } : u))

        } catch (err: any) {
            alert("Error al actualizar rol: " + err.message)
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando usuarios...</div>

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="p-4 bg-red-50 text-red-600 rounded-full">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Acceso Restringido</h2>
                <p className="text-slate-600">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Shield className="text-indigo-600" />
                        Gestión de Usuarios
                    </h2>
                    <p className="text-slate-600">Administra los roles y permisos de acceso al sistema.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Usuario</th>
                            <th className="px-6 py-4 font-semibold">Rol</th>
                            <th className="px-6 py-4 font-semibold">Actividad</th>
                            <th className="px-6 py-4 font-semibold">Registro</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                            {user.full_name?.[0]?.toUpperCase() || <User size={16} />}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">
                                                {user.full_name || "Sin nombre"}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={user.role || 'seller'}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-xs font-semibold border-0 ring-1 shadow-sm cursor-pointer outline-none focus:ring-2
                                            ${user.role === 'admin'
                                                ? 'bg-purple-50 text-purple-700 ring-purple-200 focus:ring-purple-500'
                                                : 'bg-emerald-50 text-emerald-700 ring-emerald-200 focus:ring-emerald-500'
                                            }
                                        `}
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="seller">Vendedor</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    {user.last_sign_in_at ? (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Clock size={14} className="text-slate-400" />
                                            {new Date(user.last_sign_in_at).toLocaleDateString()}
                                            <span className="text-slate-300 mx-1">|</span>
                                            {new Date(user.last_sign_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400">Nunca</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-400">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
