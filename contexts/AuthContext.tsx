"use client"


import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { User } from "@supabase/supabase-js"
import { useRouter, usePathname } from "next/navigation"

// ... imports

const supabase = createClient()

type Role = 'admin' | 'seller' | null

interface AuthContextType {
    user: User | null
    role: Role
    fullName: string | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    fullName: null,
    loading: true,
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<Role>(null)
    const [fullName, setFullName] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // 1. Get Auth User
                const { data: { user } } = await supabase.auth.getUser()
                setUser(user)

                if (user) {
                    // 2. Get Profile Role & Name
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role, full_name')
                        .eq('id', user.id)
                        .single()

                    if (profile) {
                        setRole(profile.role as Role)
                        setFullName(profile.full_name)
                    } else {
                        // Fallback if profile missing (should be created by trigger, but safety first)
                        setRole('seller')
                    }
                } else {
                    setRole(null)
                    setFullName(null)
                }
            } catch (error) {
                console.error("Auth error:", error)
                setRole(null)
                setFullName(null)
            } finally {
                setLoading(false)
            }
        }

        fetchUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    setUser(session.user)
                    const { data } = await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single()
                    setRole(data?.role as Role || 'seller')
                    setFullName(data?.full_name || null)
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null)
                setRole(null)
                setFullName(null)
                router.push('/login')
            }
        })

        return () => subscription.unsubscribe()
    }, [router])

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
        } catch (error) {
            console.error("Error signing out:", error)
        } finally {
            window.location.href = '/login'
        }
    }

    return (
        <AuthContext.Provider value={{ user, role, fullName, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
