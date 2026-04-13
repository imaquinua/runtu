import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface Business {
  id: string
  name: string
  sector: string | null
  description: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  business: Business | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  saveBusiness: (name: string, sector: string, description: string) => Promise<{ error: string | null }>
  refreshBusiness: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBusiness = async (userId: string) => {
    const { data } = await supabase
      .from('businesses')
      .select('id, name, sector, description')
      .eq('user_id', userId)
      .maybeSingle()
    setBusiness(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchBusiness(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchBusiness(session.user.id)
      else setBusiness(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const saveBusiness = async (name: string, sector: string, description: string) => {
    if (!user) return { error: 'No hay sesión activa' }
    const { error } = await supabase.from('businesses').upsert(
      { user_id: user.id, name, sector, description },
      { onConflict: 'user_id' }
    )
    if (!error) await fetchBusiness(user.id)
    return { error: error?.message ?? null }
  }

  const refreshBusiness = async () => {
    if (user) await fetchBusiness(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, session, business, loading, signIn, signUp, signOut, saveBusiness, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
