// ---------------------------------------------------------------------------
// MODE DEMO — penyimpanan berbasis localStorage.
// Aktif otomatis ketika kredensial Supabase belum diisi. Memungkinkan aplikasi
// dipakai & dicoba 100% tanpa backend. Data hanya tersimpan di browser ini.
// ---------------------------------------------------------------------------
import type {
  AyamRecord,
  KambingRecord,
  PengeluaranRecord,
  PenjualanRecord,
  Profile,
  Role,
} from './types'
import { todayISO } from './format'

interface DemoUser extends Profile {
  password: string
}

const K = {
  users: 'sfarm-demo-users',
  session: 'sfarm-demo-session',
  ayam: 'sfarm-demo-ayam',
  kambing: 'sfarm-demo-kambing',
  penjualan: 'sfarm-demo-penjualan',
  pengeluaran: 'sfarm-demo-pengeluaran',
  seeded: 'sfarm-demo-seeded-v1',
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val))
}
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.floor(Math.random() * 1e9).toString(36)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function seedDemo() {
  if (localStorage.getItem(K.seeded)) return

  const users: DemoUser[] = [
    { id: uid(), email: 'admin@s-farm.id', password: 'admin123', full_name: 'Admin S-Farm', role: 'admin', active: true, created_at: new Date().toISOString() },
    { id: uid(), email: 'peternak@s-farm.id', password: 'peternak123', full_name: 'Pak Tani', role: 'peternak', active: true, created_at: new Date().toISOString() },
    { id: uid(), email: 'bendahara@s-farm.id', password: 'bendahara123', full_name: 'Bu Bendahara', role: 'bendahara', active: true, created_at: new Date().toISOString() },
  ]
  const peternakId = users[1].id
  write(K.users, users)

  const ayam: AyamRecord[] = Array.from({ length: 7 }).map((_, i) => {
    const hidup = 466
    const butir = 420 + Math.floor(Math.random() * 30)
    const telurKg = +(butir * 0.062).toFixed(1)
    return {
      id: uid(),
      tanggal: daysAgo(6 - i),
      umur_minggu: 45,
      ayam_hidup: hidup,
      ayam_mati: 0,
      pakan_gram: 115,
      pakan_total_kg: 53.5,
      telur_butir: butir,
      telur_kg: telurKg,
      telur_pecah: 2 + Math.floor(Math.random() * 4),
      keterangan: i % 3 === 0 ? 'Susut pakan sedikit' : null,
      created_by: peternakId,
      created_at: new Date().toISOString(),
    }
  })
  write(K.ayam, ayam)

  const kambing: KambingRecord[] = [
    { id: uid(), tanggal: daysAgo(10), jenis: 'vaksin', nama_obat: 'Vaksin PMK', jumlah_kambing: 12, keterangan: 'Vaksinasi rutin', created_by: peternakId, created_at: new Date().toISOString() },
    { id: uid(), tanggal: daysAgo(3), jenis: 'suntik', nama_obat: 'Vitamin B-Complex', jumlah_kambing: 12, keterangan: null, created_by: peternakId, created_at: new Date().toISOString() },
  ]
  write(K.kambing, kambing)

  const penjualan: PenjualanRecord[] = [
    { id: uid(), tanggal: daysAgo(2), ternak: 'ayam', produk: 'Telur', pembeli: 'Bu Tutik', jumlah: 6, satuan: 'kg', harga_satuan: 21000, total: 126000, metode: 'diambil', status_bayar: 'lunas', keterangan: null, created_by: peternakId, created_at: new Date().toISOString() },
    { id: uid(), tanggal: daysAgo(2), ternak: 'ayam', produk: 'Telur', pembeli: 'P. Bojo', jumlah: 10, satuan: 'kg', harga_satuan: 21000, total: 210000, metode: 'diantar', status_bayar: 'belum', keterangan: 'Warung timur', created_by: peternakId, created_at: new Date().toISOString() },
    { id: uid(), tanggal: daysAgo(1), ternak: 'ayam', produk: 'Telur', pembeli: 'P. Plastik', jumlah: 7, satuan: 'kg', harga_satuan: 21000, total: 147000, metode: 'diambil', status_bayar: 'lunas', keterangan: null, created_by: peternakId, created_at: new Date().toISOString() },
    { id: uid(), tanggal: todayISO(), ternak: 'ayam', produk: 'Telur Pecah', pembeli: 'Warga', jumlah: 2, satuan: 'kg', harga_satuan: 15000, total: 30000, metode: 'diambil', status_bayar: 'lunas', keterangan: null, created_by: peternakId, created_at: new Date().toISOString() },
    { id: uid(), tanggal: daysAgo(5), ternak: 'kambing', produk: 'Kambing Jantan', pembeli: 'H. Dogol', jumlah: 1, satuan: 'ekor', harga_satuan: 2500000, total: 2500000, metode: 'diambil', status_bayar: 'lunas', keterangan: null, created_by: peternakId, created_at: new Date().toISOString() },
  ]
  write(K.penjualan, penjualan)

  const pengeluaran: PengeluaranRecord[] = [
    { id: uid(), tanggal: daysAgo(4), kategori: 'Pakan', deskripsi: 'Beli pakan 25 kg', jumlah: 300000, nota_url: null, created_by: peternakId, created_at: new Date().toISOString() },
    { id: uid(), tanggal: daysAgo(2), kategori: 'Obat', deskripsi: 'Vitamin & vaksin', jumlah: 150000, nota_url: null, created_by: peternakId, created_at: new Date().toISOString() },
  ]
  write(K.pengeluaran, pengeluaran)

  localStorage.setItem(K.seeded, '1')
}

// ---- Auth ----
export function demoSignIn(email: string, password: string): { user: Profile | null; error: string | null } {
  const users = read<DemoUser[]>(K.users, [])
  const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
  if (!u || u.password !== password) return { user: null, error: 'Email atau kata sandi salah.' }
  if (!u.active) return { user: null, error: 'Akun dinonaktifkan. Hubungi admin.' }
  write(K.session, u.id)
  const { password: _p, ...profile } = u
  return { user: profile, error: null }
}
export function demoSignOut() {
  localStorage.removeItem(K.session)
}
export function demoCurrentProfile(): Profile | null {
  const id = read<string | null>(K.session, null)
  if (!id) return null
  const users = read<DemoUser[]>(K.users, [])
  const u = users.find((x) => x.id === id)
  if (!u || !u.active) return null
  const { password: _p, ...profile } = u
  return profile
}

// ---- Users ----
export function demoListUsers(): Profile[] {
  return read<DemoUser[]>(K.users, []).map(({ password: _p, ...rest }) => rest)
}
export function demoCreateUser(input: { email: string; password: string; full_name: string; role: Role }): { error: string | null } {
  const users = read<DemoUser[]>(K.users, [])
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase()))
    return { error: 'Email sudah terdaftar.' }
  users.push({ id: uid(), created_at: new Date().toISOString(), active: true, ...input })
  write(K.users, users)
  return { error: null }
}
export function demoUpdateUser(id: string, patch: Partial<DemoUser>) {
  const users = read<DemoUser[]>(K.users, [])
  const idx = users.findIndex((u) => u.id === id)
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...patch }
    write(K.users, users)
  }
}
export function demoDeleteUser(id: string) {
  const users = read<DemoUser[]>(K.users, []).filter((u) => u.id !== id)
  write(K.users, users)
}

// ---- Generic table CRUD ----
type TableKey = 'ayam' | 'kambing' | 'penjualan' | 'pengeluaran'
const keyMap: Record<TableKey, string> = {
  ayam: K.ayam,
  kambing: K.kambing,
  penjualan: K.penjualan,
  pengeluaran: K.pengeluaran,
}

export function demoList<T>(table: TableKey): T[] {
  const rows = read<T[]>(keyMap[table], [])
  return rows.sort((a: any, b: any) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0))
}
export function demoCreate<T extends { id: string }>(table: TableKey, row: Omit<T, 'id' | 'created_at'>): T {
  const rows = read<any[]>(keyMap[table], [])
  const created_by = read<string | null>(K.session, null)
  const full = { ...row, id: uid(), created_at: new Date().toISOString(), created_by } as unknown as T
  rows.unshift(full)
  write(keyMap[table], rows)
  return full
}
export function demoUpdate<T extends { id: string }>(table: TableKey, id: string, patch: Partial<T>) {
  const rows = read<any[]>(keyMap[table], [])
  const idx = rows.findIndex((r) => r.id === id)
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...patch }
    write(keyMap[table], rows)
  }
}
export function demoDelete(table: TableKey, id: string) {
  const rows = read<any[]>(keyMap[table], []).filter((r) => r.id !== id)
  write(keyMap[table], rows)
}

export function resetDemo() {
  Object.values(K).forEach((k) => localStorage.removeItem(k))
  seedDemo()
}
