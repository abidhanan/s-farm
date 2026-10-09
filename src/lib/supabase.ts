import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True bila kredensial Supabase tersedia. Jika tidak → MODE DEMO. */
export const isSupabaseConfigured = Boolean(url && anon)

export const supabaseUrl = url ?? ''
export const supabaseAnonKey = anon ?? ''

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anon as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
