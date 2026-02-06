"use client"


import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js"
import { useRouter, usePathname } from "next/navigation"

// ... imports

const supabase = createClient()

type Role = 'admin' | 'seller' | null

// ... imports
interface AuthContextType {
    user: User | null
    role: Role
    fullName: string | null
    businessName: string | null
    businessId: string | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    fullName: null,
    businessName: null,
    businessId: null,
    loading: true,
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<Role>(null)
    const [fullName, setFullName] = useState<string | null>(null)
    const [businessName, setBusinessName] = useState<string | null>(null)
    const [businessId, setBusinessId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                setUser(user)

                if (user) {
                    // Retry loop for Profile (handles race condition on registration)
                    let profile = null
                    let attempts = 0
                    while (!profile && attempts < 5) {
                        const { data } = await supabase
                            .from('profiles')
                            .select(`
                                role, 
                                full_name, 
                                business_id,
                                businesses ( name )
                            `)
                            .eq('id', user.id)
                            .single()

                        profile = data
                        if (!profile) {
                            attempts++
                            await new Promise(r => setTimeout(r, 500)) // Wait 500ms
                        }
                    }

                    if (profile) {
                        setRole(profile.role as Role)
                        setFullName(profile.full_name)
                        setBusinessId(profile.business_id)
                        // @ts-ignore - Supabase join typing can be tricky
                        setBusinessName(profile.businesses?.name || null)
                    } else {
                        // Still no profile? Fallback but log it.
                        console.warn("Profile not found after retries. Defaults to Seller.")
                        setRole('seller')
                    }
                }
            } catch (error) {
                console.error("Auth error:", error)
                setRole(null)
            } finally {
                setLoading(false)
            }
        }

        fetchUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session?.user) {
                    setUser(session.user)
                    // Refresh profile data on sign in
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select(`
                            role, 
                            full_name, 
                            business_id,
                            businesses ( name )
                        `)
                        .eq('id', session.user.id)
                        .single()

                    if (profile) {
                        setRole(profile.role as Role)
                        setFullName(profile.full_name)
                        setBusinessId(profile.business_id)
                        // @ts-ignore
                        setBusinessName(profile.businesses?.name || null)
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null)
                setRole(null)
                setFullName(null)
                setBusinessName(null)
                setBusinessId(null)
                router.push('/login')
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

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
        <AuthContext.Provider value={{ user, role, fullName, businessName, businessId, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
