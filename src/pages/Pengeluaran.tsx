import { useEffect, useMemo, useState } from 'react'
import { FileText, ImageIcon, Pencil, Plus, Receipt, Trash2, Upload } from 'lucide-react'
import { pengeluaran as pengeluaranDb } from '../lib/db'
import { useAuth } from '../lib/auth'
import type { PengeluaranRecord } from '../lib/types'
import { formatRupiah, formatTanggal, todayISO } from '../lib/format'
import { DateInput, EmptyState, Field, Modal, PageHeader, PageLoader, Select, StatCard } from '../components/ui'

type FormState = Omit<PengeluaranRecord, 'id' | 'created_at' | 'created_by'>
const empty: FormState = { tanggal: todayISO(), kategori: 'Pakan', deskripsi: '', jumlah: 0, nota_url: null }
const KATEGORI = ['Pakan', 'Obat', 'Vaksin', 'Listrik', 'Perawatan', 'Gaji', 'Transport', 'Lainnya']

export default function Pengeluaran() {
  const { can } = useAuth()
  const canWrite = can(['admin', 'peternak'])
  const [rows, setRows] = useState<PengeluaranRecord[] | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PengeluaranRecord | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function load() {
    setRows(await pengeluaranDb.list())
  }
  useEffect(() => {
    load()
  }, [])

  const total = useMemo(() => (rows ?? []).reduce((s, r) => s + r.jumlah, 0), [rows])
  const bulanIni = useMemo(() => {
    const m = todayISO().slice(0, 7)
    return (rows ?? []).filter((r) => r.tanggal.startsWith(m)).reduce((s, r) => s + r.jumlah, 0)
  }, [rows])

  function openCreate() {
    setEditing(null)
    setForm({ ...empty, tanggal: todayISO() })
    setOpen(true)
  }
  function openEdit(r: PengeluaranRecord) {
    setEditing(r)
    const { id, created_at, created_by, ...rest } = r
    setForm(rest)
    setOpen(true)
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await pengeluaranDb.uploadNota(file)
      setForm((f) => ({ ...f, nota_url: url }))
    } catch (err) {
      alert('Gagal mengunggah: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) await pengeluaranDb.update(editing.id, form)
      else await pengeluaranDb.create(form)
      setOpen(false)
      await load()
    } catch (err) {
      alert('Gagal menyimpan: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }
  async function remove(r: PengeluaranRecord) {
    if (!confirm(`Hapus pengeluaran "${r.deskripsi}"?`)) return
    await pengeluaranDb.remove(r.id)
    await load()
  }

  if (!rows) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Pengeluaran"
        subtitle="Catatan biaya operasional + bukti nota"
        icon={<Receipt size={22} />}
        action={canWrite && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Tambah</button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label="Total Pengeluaran" value={formatRupiah(total)} tone="red" />
        <StatCard label="Bulan Ini" value={formatRupiah(bulanIni)} tone="amber" />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Belum ada pengeluaran" hint="Catat biaya dan unggah foto nota dengan tombol Tambah." icon={<Receipt size={40} />} />
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div key={r.id} className="card flex items-center gap-3 p-4">
              <button
                onClick={() => r.nota_url && setPreview(r.nota_url)}
                disabled={!r.nota_url}
                className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl ${r.nota_url ? 'ring-1 ring-slate-200 dark:ring-slate-700' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                aria-label="Lihat nota"
              >
                {r.nota_url ? <img src={r.nota_url} alt="nota" className="h-full w-full object-cover" /> : <FileText size={20} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white">{r.deskripsi}</span>
                  <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{r.kategori}</span>
                </div>
                <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{formatTanggal(r.tanggal)}{r.nota_url ? ' · ada nota' : ''}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-bold text-red-600 dark:text-red-400">{formatRupiah(r.jumlah)}</div>
                {canWrite && (
                  <div className="mt-1 flex justify-end gap-1">
                    <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => remove(r)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" aria-label="Hapus"><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tanggal">
              <DateInput value={form.tanggal} onChange={(v) => setForm({ ...form, tanggal: v })} required />
            </Field>
            <Field label="Kategori">
              <Select
                value={form.kategori}
                onChange={(v) => setForm({ ...form, kategori: v })}
                options={KATEGORI.map((k) => ({ value: k, label: k }))}
              />
            </Field>
          </div>
          <Field label="Deskripsi">
            <input className="input" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} placeholder="mis. Beli pakan 25 kg" required />
          </Field>
          <Field label="Jumlah (Rp)">
            <input type="number" min={0} className="input" value={form.jumlah || ''} onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })} required />
          </Field>
          <Field label="Bukti Nota (foto)" hint="Opsional. JPG/PNG dari galeri atau kamera.">
            <div className="flex items-center gap-3">
              <label className="btn-ghost cursor-pointer">
                {uploading ? 'Mengunggah…' : <><Upload size={16} /> Pilih Foto</>}
                <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
              </label>
              {form.nota_url && (
                <div className="relative">
                  <img src={form.nota_url} alt="nota" className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                  <button type="button" onClick={() => setForm({ ...form, nota_url: null })} className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-red-600 text-xs text-white">×</button>
                </div>
              )}
              {!form.nota_url && !uploading && <span className="flex items-center gap-1 text-xs text-slate-400"><ImageIcon size={14} /> belum ada</span>}
            </div>
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1">Batal</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving || uploading}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Bukti Nota" wide>
        {preview && <img src={preview} alt="nota" className="mx-auto max-h-[70vh] rounded-xl" />}
      </Modal>
    </div>
  )
}
