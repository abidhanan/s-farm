// ---------------------------------------------------------------------------
// Lapisan data terpadu. Memakai Supabase bila dikonfigurasi, jika tidak jatuh
// ke MODE DEMO (localStorage). Seluruh UI memakai API ini, tidak peduli mode.
// ---------------------------------------------------------------------------
import { isSupabaseConfigured, supabase, supabaseAnonKey, supabaseUrl } from './supabase'
import * as demo from './demo'
import type {
  AyamRecord,
  KambingRecord,
  PengeluaranRecord,
  PenjualanRecord,
  Profile,
  Role,
} from './types'

export const mode: 'supabase' | 'demo' = isSupabaseConfigured ? 'supabase' : 'demo'

if (mode === 'demo') demo.seedDemo()

// ------------------------------- AUTH --------------------------------------
export const auth = {
  async signIn(email: string, password: string): Promise<{ profile: Profile | null; error: string | null }> {
    if (mode === 'demo') {
      const { user, error } = demo.demoSignIn(email, password)
      return { profile: user, error }
    }
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) return { profile: null, error: error.message }
    const profile = await profiles.get(data.user!.id)
    if (profile && !profile.active) {
      await supabase!.auth.signOut()
      return { profile: null, error: 'Akun dinonaktifkan. Hubungi admin.' }
    }
    return { profile, error: null }
  },

  async signUp(email: string, password: string, full_name: string): Promise<{ error: string | null }> {
    if (mode === 'demo') {
      return demo.demoCreateUser({ email, password, full_name, role: 'peternak' })
    }
    const { error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    })
    return { error: error?.message ?? null }
  },

  async signOut() {
    if (mode === 'demo') return demo.demoSignOut()
    await supabase!.auth.signOut()
  },

  async currentProfile(): Promise<Profile | null> {
    if (mode === 'demo') return demo.demoCurrentProfile()
    const { data } = await supabase!.auth.getUser()
    if (!data.user) return null
    return profiles.get(data.user.id)
  },
}

// ----------------------------- PROFILES ------------------------------------
export const profiles = {
  async get(id: string): Promise<Profile | null> {
    if (mode === 'demo') return demo.demoListUsers().find((u) => u.id === id) ?? null
    const { data } = await supabase!.from('profiles').select('*').eq('id', id).maybeSingle()
    return (data as Profile) ?? null
  },
  async list(): Promise<Profile[]> {
    if (mode === 'demo') return demo.demoListUsers()
    const { data } = await supabase!.from('profiles').select('*').order('created_at', { ascending: true })
    return (data as Profile[]) ?? []
  },
  async create(input: { email: string; password: string; full_name: string; role: Role }): Promise<{ error: string | null }> {
    if (mode === 'demo') return demo.demoCreateUser(input)
    // Supabase: buat akun via endpoint signup (pakai fetch mentah agar sesi admin
    // tidak ikut berganti), lalu set peran & nama lewat tabel profiles (izin admin RLS).
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: input.email, password: input.password, data: { full_name: input.full_name } }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { error: body?.msg || body?.error_description || body?.error || 'Gagal membuat pengguna.' }
      }
      const newId: string | undefined = body?.user?.id || body?.id
      if (newId) {
        await supabase!.from('profiles').update({ role: input.role, full_name: input.full_name }).eq('id', newId)
      }
      return { error: null }
    } catch (e) {
      return { error: (e as Error).message }
    }
  },
  async setRole(id: string, role: Role) {
    if (mode === 'demo') return demo.demoUpdateUser(id, { role })
    await supabase!.from('profiles').update({ role }).eq('id', id)
  },
  async setActive(id: string, active: boolean) {
    if (mode === 'demo') return demo.demoUpdateUser(id, { active })
    await supabase!.from('profiles').update({ active }).eq('id', id)
  },
  async remove(id: string) {
    if (mode === 'demo') return demo.demoDeleteUser(id)
    // Menghapus akun auth butuh service role; di sini kita nonaktifkan saja.
    await supabase!.from('profiles').update({ active: false }).eq('id', id)
  },
}

// --------------------------- GENERIC HELPERS -------------------------------
async function listTable<T>(table: string, demoKey: any): Promise<T[]> {
  if (mode === 'demo') return demo.demoList<T>(demoKey)
  const { data } = await supabase!.from(table).select('*').order('tanggal', { ascending: false }).order('created_at', { ascending: false })
  return (data as T[]) ?? []
}
async function createRow<T extends { id: string }>(table: string, demoKey: any, row: any): Promise<T> {
  if (mode === 'demo') return demo.demoCreate<T>(demoKey, row)
  const { data, error } = await supabase!.from(table).insert(row).select().single()
  if (error) throw new Error(error.message)
  return data as T
}
async function updateRow(table: string, demoKey: any, id: string, patch: any) {
  if (mode === 'demo') return demo.demoUpdate(demoKey, id, patch)
  const { error } = await supabase!.from(table).update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}
async function deleteRow(table: string, demoKey: any, id: string) {
  if (mode === 'demo') return demo.demoDelete(demoKey, id)
  const { error } = await supabase!.from(table).delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ------------------------------- AYAM --------------------------------------
export const ayam = {
  list: () => listTable<AyamRecord>('ayam_monitoring', 'ayam'),
  create: (row: Omit<AyamRecord, 'id' | 'created_at' | 'created_by'>) =>
    createRow<AyamRecord>('ayam_monitoring', 'ayam', row),
  update: (id: string, patch: Partial<AyamRecord>) => updateRow('ayam_monitoring', 'ayam', id, patch),
  remove: (id: string) => deleteRow('ayam_monitoring', 'ayam', id),
}

// ------------------------------ KAMBING ------------------------------------
export const kambing = {
  list: () => listTable<KambingRecord>('kambing_kesehatan', 'kambing'),
  create: (row: Omit<KambingRecord, 'id' | 'created_at' | 'created_by'>) =>
    createRow<KambingRecord>('kambing_kesehatan', 'kambing', row),
  update: (id: string, patch: Partial<KambingRecord>) => updateRow('kambing_kesehatan', 'kambing', id, patch),
  remove: (id: string) => deleteRow('kambing_kesehatan', 'kambing', id),
}

// ----------------------------- PENJUALAN -----------------------------------
export const penjualan = {
  list: () => listTable<PenjualanRecord>('penjualan', 'penjualan'),
  create: (row: Omit<PenjualanRecord, 'id' | 'created_at' | 'created_by'>) =>
    createRow<PenjualanRecord>('penjualan', 'penjualan', row),
  update: (id: string, patch: Partial<PenjualanRecord>) => updateRow('penjualan', 'penjualan', id, patch),
  remove: (id: string) => deleteRow('penjualan', 'penjualan', id),
}

// ---------------------------- PENGELUARAN ----------------------------------
export const pengeluaran = {
  list: () => listTable<PengeluaranRecord>('pengeluaran', 'pengeluaran'),
  create: (row: Omit<PengeluaranRecord, 'id' | 'created_at' | 'created_by'>) =>
    createRow<PengeluaranRecord>('pengeluaran', 'pengeluaran', row),
  update: (id: string, patch: Partial<PengeluaranRecord>) => updateRow('pengeluaran', 'pengeluaran', id, patch),
  remove: (id: string) => deleteRow('pengeluaran', 'pengeluaran', id),
  async uploadNota(file: File): Promise<string> {
    if (mode === 'demo') {
      // Simpan sebagai data URL (khusus demo).
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Gagal membaca file'))
        reader.readAsDataURL(file)
      })
    }
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase!.storage.from('nota').upload(path, file, { upsert: false })
    if (error) throw new Error(error.message)
    const { data } = supabase!.storage.from('nota').getPublicUrl(path)
    return data.publicUrl
  },
}

export function resetDemoData() {
  demo.resetDemo()
}
