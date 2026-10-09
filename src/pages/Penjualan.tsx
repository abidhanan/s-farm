import { useEffect, useMemo, useState } from 'react'
import { Check, Pencil, Plus, ShoppingCart, Trash2, Truck } from 'lucide-react'
import { penjualan as penjualanDb } from '../lib/db'
import { useAuth } from '../lib/auth'
import type { PenjualanRecord } from '../lib/types'
import { formatNumber, formatRupiah, formatTanggal, todayISO } from '../lib/format'
import { DateInput, EmptyState, Field, Modal, PageHeader, PageLoader, Select, StatCard } from '../components/ui'

type FormState = Omit<PenjualanRecord, 'id' | 'created_at' | 'created_by' | 'total'>
const empty: FormState = {
  tanggal: todayISO(),
  ternak: 'ayam',
  produk: 'Telur',
  pembeli: '',
  jumlah: 0,
  satuan: 'kg',
  harga_satuan: 0,
  metode: 'diambil',
  status_bayar: 'lunas',
  keterangan: null,
}

export default function Penjualan() {
  const { can } = useAuth()
  const canWrite = can(['admin', 'peternak'])
  const [rows, setRows] = useState<PenjualanRecord[] | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PenjualanRecord | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | 'diantar' | 'diambil'>('all')

  async function load() {
    setRows(await penjualanDb.list())
  }
  useEffect(() => {
    load()
  }, [])

  const total = form.jumlah * form.harga_satuan

  const view = useMemo(() => (rows ?? []).filter((r) => filter === 'all' || r.metode === filter), [rows, filter])
  const stats = useMemo(() => {
    const list = rows ?? []
    return {
      total: list.reduce((s, r) => s + r.total, 0),
      belum: list.filter((r) => r.status_bayar === 'belum').reduce((s, r) => s + r.total, 0),
      diantar: list.filter((r) => r.metode === 'diantar').length,
      diambil: list.filter((r) => r.metode === 'diambil').length,
    }
  }, [rows])

  function openCreate() {
    setEditing(null)
    setForm({ ...empty, tanggal: todayISO() })
    setOpen(true)
  }
  function openEdit(r: PenjualanRecord) {
    setEditing(r)
    const { id, created_at, created_by, total, ...rest } = r
    setForm(rest)
    setOpen(true)
  }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, total: form.jumlah * form.harga_satuan }
      if (editing) await penjualanDb.update(editing.id, payload)
      else await penjualanDb.create(payload)
      setOpen(false)
      await load()
    } catch (err) {
      alert('Gagal menyimpan: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }
  async function remove(r: PenjualanRecord) {
    if (!confirm(`Hapus penjualan ke ${r.pembeli}?`)) return
    await penjualanDb.remove(r.id)
    await load()
  }
  async function toggleBayar(r: PenjualanRecord) {
    if (!canWrite) return
    await penjualanDb.update(r.id, { status_bayar: r.status_bayar === 'lunas' ? 'belum' : 'lunas' })
    await load()
  }

  if (!rows) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Penjualan Harian"
        subtitle="Telur & ternak yang diantar atau diambil sendiri"
        icon={<ShoppingCart size={22} />}
        action={canWrite && <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Tambah</button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Penjualan" value={formatRupiah(stats.total)} />
        <StatCard label="Belum Dibayar" value={formatRupiah(stats.belum)} tone="red" />
        <StatCard label="Diantar" value={formatNumber(stats.diantar)} tone="blue" />
        <StatCard label="Diambil" value={formatNumber(stats.diambil)} tone="amber" />
      </div>

      <div className="mb-4 flex gap-1.5">
        {(['all', 'diantar', 'diambil'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {f === 'all' ? 'Semua' : f}
          </button>
        ))}
      </div>

      {view.length === 0 ? (
        <EmptyState title="Belum ada penjualan" hint="Catat penjualan telur/ternak dengan tombol Tambah." icon={<ShoppingCart size={40} />} />
      ) : (
        <div className="grid gap-3">
          {view.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{r.pembeli}</span>
                    <span className={`badge ${r.metode === 'diantar' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                      {r.metode === 'diantar' ? <><Truck size={12} /> Diantar</> : 'Diambil'}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {formatTanggal(r.tanggal)} · {r.produk} · {formatNumber(r.jumlah, 1)} {r.satuan} × {formatRupiah(r.harga_satuan)}
                  </div>
                  {r.keterangan && <div className="mt-0.5 text-xs text-slate-400">{r.keterangan}</div>}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold text-slate-900 dark:text-white">{formatRupiah(r.total)}</div>
                  <button
                    onClick={() => toggleBayar(r)}
                    disabled={!canWrite}
                    className={`badge mt-1 ${r.status_bayar === 'lunas' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'} ${canWrite ? 'cursor-pointer' : ''}`}
                  >
                    {r.status_bayar === 'lunas' ? <><Check size={12} /> Lunas</> : 'Belum bayar'}
                  </button>
                </div>
              </div>
              {canWrite && (
                <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-2 dark:border-slate-800/60">
                  <button onClick={() => openEdit(r)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Edit"><Pencil size={16} /></button>
                  <button onClick={() => remove(r)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" aria-label="Hapus"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Penjualan' : 'Tambah Penjualan'} wide>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tanggal">
              <DateInput value={form.tanggal} onChange={(v) => setForm({ ...form, tanggal: v })} required />
            </Field>
            <Field label="Jenis Ternak">
              <Select
                value={form.ternak}
                onChange={(v) => setForm({ ...form, ternak: v as FormState['ternak'], satuan: v === 'kambing' ? 'ekor' : 'kg' })}
                options={[
                  { value: 'ayam', label: 'Ayam / Telur' },
                  { value: 'kambing', label: 'Kambing' },
                ]}
              />
            </Field>
            <Field label="Produk">
              <input className="input" value={form.produk} onChange={(e) => setForm({ ...form, produk: e.target.value })} placeholder="mis. Telur" required />
            </Field>
            <Field label="Pembeli">
              <input className="input" value={form.pembeli} onChange={(e) => setForm({ ...form, pembeli: e.target.value })} placeholder="Nama pembeli" required />
            </Field>
            <Field label="Jumlah">
              <input type="number" min={0} step="0.1" className="input" value={form.jumlah || ''} onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })} required />
            </Field>
            <Field label="Satuan">
              <Select
                value={form.satuan}
                onChange={(v) => setForm({ ...form, satuan: v })}
                options={[
                  { value: 'kg', label: 'kg' },
                  { value: 'butir', label: 'butir' },
                  { value: 'ekor', label: 'ekor' },
                ]}
              />
            </Field>
            <Field label="Harga / Satuan">
              <input type="number" min={0} className="input" value={form.harga_satuan || ''} onChange={(e) => setForm({ ...form, harga_satuan: Number(e.target.value) })} required />
            </Field>
            <Field label="Total">
              <div className="input flex items-center bg-slate-100 font-bold dark:bg-slate-800">{formatRupiah(total)}</div>
            </Field>
            <Field label="Metode">
              <Select
                value={form.metode}
                onChange={(v) => setForm({ ...form, metode: v as FormState['metode'] })}
                options={[
                  { value: 'diambil', label: 'Diambil sendiri' },
                  { value: 'diantar', label: 'Diantar' },
                ]}
              />
            </Field>
            <Field label="Status Bayar">
              <Select
                value={form.status_bayar}
                onChange={(v) => setForm({ ...form, status_bayar: v as FormState['status_bayar'] })}
                options={[
                  { value: 'lunas', label: 'Lunas' },
                  { value: 'belum', label: 'Belum bayar' },
                ]}
              />
            </Field>
          </div>
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
