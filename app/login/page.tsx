'use client'

import { login, signup } from './actions'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
    const [isLogin, setIsLogin] = useState(true)
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-slate-100">
            {/* Left: Branding */}
            <div className="hidden lg:flex flex-col justify-center items-center text-white p-12" style={{ backgroundColor: 'var(--primary)' }}>
                <h1 className="text-4xl font-black tracking-tight mb-4">Empower Your Business</h1>
                <p className="text-lg text-white/80 text-center max-w-md">
                    Gestión de inventario inteligente, ventas rápidas y control total de tu negocio.
                </p>
            </div>

            {/* Right: Login Form */}
            <div className="flex flex-col justify-center items-center p-8 bg-white">
                <div className="w-full max-w-sm space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-slate-900">
                            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                        </h2>
                        <p className="text-slate-600 font-medium mt-2">
                            {isLogin ? 'Ingresa tus credenciales para acceder' : 'Regístrate para comenzar a usar el sistema'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100 text-center animate-in fade-in slide-in-from-top-2">
                            {error === 'Invalid credentials' ? 'Credenciales incorrectas. Intenta de nuevo.' : error}
                        </div>
                    )}

                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-1" htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                                placeholder="usuario@ejemplo.com"
                            />
                        </div>

                        {!isLogin && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1" htmlFor="business_name">Nombre de tu Negocio</label>
                                    <input
                                        id="business_name"
                                        name="business_name"
                                        type="text"
                                        required={!isLogin}
                                        className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                                        placeholder="Ej: Zapatería La Moda"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1" htmlFor="full_name">Nombre Completo</label>
                                    <input
                                        id="full_name"
                                        name="full_name"
                                        type="text"
                                        required={!isLogin}
                                        className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-1" htmlFor="password">Contraseña</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            formAction={isLogin ? login : signup}
                            className="w-full py-3 px-4 text-white font-bold rounded-lg shadow-md transition-colors hover:opacity-90"
                            style={{ backgroundColor: 'var(--primary)' }}
                        >
                            {isLogin ? 'Ingresar' : 'Registrarse'}
                        </button>

                        <div className="text-center mt-6">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">o</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="w-full py-3 px-4 border-2 font-bold rounded-lg transition-colors hover:bg-slate-50"
                                style={{
                                    borderColor: 'var(--primary)',
                                    color: 'var(--primary)',
                                    backgroundColor: 'rgba(var(--primary-rgb), 0.05)'
                                }}
                            >
                                {isLogin ? 'Crear cuenta nueva' : 'Volver a Iniciar Sesión'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <LoginForm />
        </Suspense>
    )
}
