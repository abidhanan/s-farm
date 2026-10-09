import { useEffect, useState } from 'react'
import { Plus, ShieldCheck, Users as UsersIcon } from 'lucide-react'
import { profiles as profilesDb, mode, resetDemoData } from '../lib/db'
import { useAuth } from '../lib/auth'
import type { Profile, Role } from '../lib/types'
import { EmptyState, Field, Modal, PageHeader, PageLoader, Select } from '../components/ui'

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'admin', label: 'Admin', desc: 'Akses penuh & kelola pengguna' },
  { value: 'peternak', label: 'Peternak', desc: 'Input data harian & penjualan' },
  { value: 'bendahara', label: 'Bendahara', desc: 'Hanya melihat laporan' },
]
const roleTone: Record<Role, string> = {
  admin: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
  peternak: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  bendahara: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

export default function Users() {
  const { profile: me, refresh } = useAuth()
  const [rows, setRows] = useState<Profile[] | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'peternak' as Role })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setRows(await profilesDb.list())
  }
  useEffect(() => {
    load()
  }, [])

  async function changeRole(u: Profile, role: Role) {
    await profilesDb.setRole(u.id, role)
    if (u.id === me?.id) await refresh()
    await load()
  }
  async function toggleActive(u: Profile) {
    await profilesDb.setActive(u.id, !u.active)
    await load()
  }
  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const { error } = await profilesDb.create(form)
    setSaving(false)
    if (error) setError(error)
    else {
      setOpen(false)
      setForm({ full_name: '', email: '', password: '', role: 'peternak' })
      await load()
    }
  }

  if (!rows) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Manajemen Pengguna"
        subtitle="Atur peran & status akses pengguna"
        icon={<UsersIcon size={22} />}
        action={<button onClick={() => setOpen(true)} className="btn-primary"><Plus size={18} /> Tambah</button>}
      />

      <div className="card mb-4 flex items-start gap-3 p-4 text-sm">
        <ShieldCheck className="mt-0.5 shrink-0 text-brand-600" size={18} />
        <p className="text-slate-600 dark:text-slate-300">
          Hanya admin yang dapat menambah pengguna. Tekan <b>Tambah</b> untuk membuat akun baru beserta perannya.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Belum ada pengguna" icon={<UsersIcon size={40} />} />
      ) : (
        <div className="grid gap-3">
          {rows.map((u) => (
            <div key={u.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white">
                  {u.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{u.full_name}</span>
                    {u.id === me?.id && <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800">Anda</span>}
                    {!u.active && <span className="badge bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Nonaktif</span>}
                  </div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-[150px]">
                  <Select
                    value={u.role}
                    onChange={(v) => changeRole(u, v as Role)}
                    disabled={u.id === me?.id}
                    ariaLabel="Ubah peran"
                    buttonClassName="py-2 text-sm"
                    options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
                  />
                </div>
                <button
                  onClick={() => toggleActive(u)}
                  disabled={u.id === me?.id}
                  className={`btn ${u.active ? 'btn-ghost' : 'btn-primary'} px-3 py-2 text-xs`}
                >
                  {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'demo' && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">
          <span className="text-slate-500 dark:text-slate-400">Reset seluruh data demo ke kondisi awal.</span>
          <button
            onClick={() => {
              if (confirm('Reset semua data demo?')) {
                resetDemoData()
                location.reload()
              }
            }}
            className="btn-danger px-3 py-2 text-xs"
          >
            Reset Data Demo
          </button>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Pengguna">
        <form onSubmit={addUser} className="space-y-4">
          <Field label="Nama Lengkap">
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </Field>
          <Field label="Email">
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label="Kata Sandi" hint="Minimal 6 karakter. Beri tahu pengguna sandi ini.">
            <input type="text" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </Field>
          <Field label="Peran">
            <Select
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v as Role })}
              options={ROLES.map((r) => ({ value: r.value, label: `${r.label} · ${r.desc}` }))}
            />
          </Field>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
