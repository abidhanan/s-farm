import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { auth as dbAuth, mode } from './db'
import { supabase } from './supabase'
import type { Profile, Role } from './types'

const ROLE_LABEL: Record<Role, string> = { admin: 'Admin', peternak: 'Peternak', bendahara: 'Bendahara' }

interface AuthCtx {
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string, expectedRole?: Role) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  can: (roles: Role[]) => boolean
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  // Menahan handler onAuthStateChange agar tidak menyetel profil di tengah proses
  // verifikasi peran (mencegah kilatan redirect saat role tidak cocok).
  const suppressLoad = useRef(false)

  async function load() {
    const p = await dbAuth.currentProfile()
    setProfile(p)
    setLoading(false)
  }

  useEffect(() => {
    load()
    if (mode === 'supabase' && supabase) {
      const { data } = supabase.auth.onAuthStateChange(() => {
        if (suppressLoad.current) return
        load()
      })
      return () => data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthCtx>(
    () => ({
      profile,
      loading,
      async signIn(email, password, expectedRole) {
        suppressLoad.current = true
        try {
          const { profile: p, error } = await dbAuth.signIn(email, password)
          if (error) return { error }
          if (expectedRole && p && p.role !== expectedRole) {
            await dbAuth.signOut()
            setProfile(null)
            return { error: `Akun ini terdaftar sebagai ${ROLE_LABEL[p.role]}. Silakan pilih tab ${ROLE_LABEL[p.role]}.` }
          }
          setProfile(p)
          return { error: null }
        } finally {
          suppressLoad.current = false
        }
      },
      async signOut() {
        await dbAuth.signOut()
        setProfile(null)
      },
      refresh: load,
      can: (roles) => !!profile && roles.includes(profile.role),
    }),
    [profile, loading],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
