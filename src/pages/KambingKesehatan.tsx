import { useEffect, useState } from 'react'
import { Pencil, Plus, Syringe, Trash2 } from 'lucide-react'
import { kambing as kambingDb } from '../lib/db'
import { useAuth } from '../lib/auth'
import type { KambingRecord } from '../lib/types'
import { formatNumber, formatTanggal, todayISO } from '../lib/format'
import { DateInput, EmptyState, Field, Modal, PageHeader, PageLoader, StatCard } from '../components/ui'

type FormState = Omit<KambingRecord, 'id' | 'created_at' | 'created_by'>
const empty: FormState = { tanggal: todayISO(), jenis: 'vaksin', nama_obat: '', jumlah_kambing: 0, keterangan: null }

export default function KambingKesehatan() {
  const { can } = useAuth()
  const canWrite = can(['admin', 'peternak'])
  const [rows, setRows] = useState<KambingRecord[] | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<KambingRecord | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    setRows(await kambingDb.list())
  }
  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ ...empty, tanggal: todayISO() })
    setOpen(true)
  }
  function openEdit(r: KambingRecord) {
    setEditing(r)
    const { id, created_at, created_by, ...rest } = r
    setForm(rest)
    setOpen(true)
  }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) await kambingDb.update(editing.id, form)
      else await kambingDb.create(form)
      setOpen(false)
      await load()
    } catch (err) {
      alert('Gagal menyimpan: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }
  async function remove(r: KambingRecord) {
    if (!confirm(`Hapus data ${r.nama_obat}?`)) return
    await kambingDb.remove(r.id)
    await load()
  }

  if (!rows) return <PageLoader />

  const vaksinCount = rows.filter((r) => r.jenis === 'vaksin').length
  const suntikCount = rows.filter((r) => r.jenis === 'suntik').length

  return (
    <div>
      <PageHeader
        title="Kesehatan Kambing"
        subtitle="Catatan suntik & vaksinasi ternak kambing"
        icon={<Syringe size={22} />}
        action={canWrite && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Tambah</button>}
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Total Tindakan" value={formatNumber(rows.length)} />
        <StatCard label="Vaksinasi" value={formatNumber(vaksinCount)} tone="blue" />
        <StatCard label="Suntik" value={formatNumber(suntikCount)} tone="amber" />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Belum ada catatan" hint="Catat vaksinasi atau suntik kambing dengan tombol Tambah." icon={<Syringe size={40} />} />
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div key={r.id} className="card flex items-center gap-4 p-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${r.jenis === 'vaksin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                <Syringe size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">{r.nama_obat}</span>
                  <span className={`badge ${r.jenis === 'vaksin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                    {r.jenis === 'vaksin' ? 'Vaksin' : 'Suntik'}
                  </span>
                </div>
                <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {formatTanggal(r.tanggal, true)} · {formatNumber(r.jumlah_kambing)} ekor
                  {r.keterangan ? ` · ${r.keterangan}` : ''}
                </div>
              </div>
              {canWrite && (
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => openEdit(r)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Edit"><Pencil size={16} /></button>
                  <button onClick={() => remove(r)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" aria-label="Hapus"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Kesehatan' : 'Tambah Kesehatan'}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Tanggal">
            <DateInput value={form.tanggal} onChange={(v) => setForm({ ...form, tanggal: v })} required />
          </Field>
          <Field label="Jenis Tindakan">
            <div className="grid grid-cols-2 gap-2">
              {(['vaksin', 'suntik'] as const).map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setForm({ ...form, jenis: j })}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition ${
                    form.jenis === j ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Nama Vaksin / Obat / Penyakit">
            <input className="input" value={form.nama_obat} onChange={(e) => setForm({ ...form, nama_obat: e.target.value })} placeholder="mis. Vaksin PMK" required />
          </Field>
          <Field label="Jumlah Kambing (ekor)">
            <input type="number" min={0} className="input" value={form.jumlah_kambing || ''} onChange={(e) => setForm({ ...form, jumlah_kambing: Number(e.target.value) })} required />
          </Field>
          <Field label="Keterangan">
            <input className="input" value={form.keterangan ?? ''} onChange={(e) => setForm({ ...form, keterangan: e.target.value || null })} placeholder="opsional" />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
