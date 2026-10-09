import { useEffect, useMemo, useState } from 'react'
import { Egg, Pencil, Plus, Trash2 } from 'lucide-react'
import { ayam as ayamDb } from '../lib/db'
import { useAuth } from '../lib/auth'
import type { AyamRecord } from '../lib/types'
import { formatNumber, formatTanggal, hitungFCR, hitungHD, todayISO } from '../lib/format'
import { DateInput, EmptyState, Field, Modal, PageHeader, PageLoader, StatCard } from '../components/ui'

type FormState = Omit<AyamRecord, 'id' | 'created_at' | 'created_by'>

const empty: FormState = {
  tanggal: todayISO(),
  umur_minggu: null,
  ayam_hidup: 0,
  ayam_mati: 0,
  pakan_gram: null,
  pakan_total_kg: null,
  telur_butir: 0,
  telur_kg: 0,
  telur_pecah: 0,
  keterangan: null,
}

export default function AyamMonitoring() {
  const { can } = useAuth()
  const canWrite = can(['admin', 'peternak'])
  const [rows, setRows] = useState<AyamRecord[] | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AyamRecord | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)

  async function load() {
    setRows(await ayamDb.list())
  }
  useEffect(() => {
    load()
  }, [])

  const totals = useMemo(() => {
    const list = rows ?? []
    const butir = list.reduce((s, r) => s + (r.telur_butir || 0), 0)
    const kg = list.reduce((s, r) => s + (r.telur_kg || 0), 0)
    const pakan = list.reduce((s, r) => s + (r.pakan_total_kg || 0), 0)
    const last = list[0]
    return {
      butir,
      kg,
      hd: last ? hitungHD(last.telur_butir, last.ayam_hidup) : 0,
      fcr: kg ? hitungFCR(pakan, kg) : 0,
    }
  }, [rows])

  function openCreate() {
    setEditing(null)
    setForm({ ...empty, tanggal: todayISO() })
    setOpen(true)
  }
  function openEdit(r: AyamRecord) {
    setEditing(r)
    const { id, created_at, created_by, ...rest } = r
    setForm(rest)
    setOpen(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) await ayamDb.update(editing.id, form)
      else await ayamDb.create(form)
      setOpen(false)
      await load()
    } catch (err) {
      alert('Gagal menyimpan: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(r: AyamRecord) {
    if (!confirm(`Hapus data tanggal ${formatTanggal(r.tanggal)}?`)) return
    await ayamDb.remove(r.id)
    await load()
  }

  const num = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value === '' ? (k === 'ayam_hidup' || k === 'telur_butir' ? 0 : null) : Number(e.target.value) }))

  if (!rows) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Monitoring Ayam Petelur"
        subtitle="Catatan harian: populasi, pakan, dan produksi telur"
        icon={<Egg size={22} />}
        action={
          canWrite && (
            <button onClick={openCreate} className="btn-primary">
              <Plus size={18} /> Tambah
            </button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Telur" value={`${formatNumber(totals.butir)} butir`} sub={`${formatNumber(totals.kg, 1)} kg`} />
        <StatCard label="HD% Terakhir" value={`${formatNumber(totals.hd, 1)}%`} tone="blue" />
        <StatCard label="FCR" value={formatNumber(totals.fcr, 2)} sub="pakan : telur" tone="amber" />
        <StatCard label="Jumlah Catatan" value={formatNumber(rows.length)} tone="slate" />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Belum ada data" hint="Tekan tombol Tambah untuk mencatat monitoring harian." icon={<Egg size={40} />} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-3 py-3">Umur</th>
                  <th className="px-3 py-3">Hidup</th>
                  <th className="px-3 py-3">Mati</th>
                  <th className="px-3 py-3">Pakan (kg)</th>
                  <th className="px-3 py-3">Telur (butir)</th>
                  <th className="px-3 py-3">Kg</th>
                  <th className="px-3 py-3">Pecah</th>
                  <th className="px-3 py-3">HD%</th>
                  <th className="px-3 py-3">FCR</th>
                  {canWrite && <th className="px-3 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{formatTanggal(r.tanggal)}</td>
                    <td className="px-3 py-3">{r.umur_minggu ? `${r.umur_minggu} mg` : '-'}</td>
                    <td className="px-3 py-3">{formatNumber(r.ayam_hidup)}</td>
                    <td className="px-3 py-3">{r.ayam_mati ? <span className="text-red-600">{r.ayam_mati}</span> : 0}</td>
                    <td className="px-3 py-3">{r.pakan_total_kg ? formatNumber(r.pakan_total_kg, 1) : '-'}</td>
                    <td className="px-3 py-3 font-semibold">{formatNumber(r.telur_butir)}</td>
                    <td className="px-3 py-3">{formatNumber(r.telur_kg, 1)}</td>
                    <td className="px-3 py-3">{r.telur_pecah || 0}</td>
                    <td className="px-3 py-3">{formatNumber(hitungHD(r.telur_butir, r.ayam_hidup), 1)}%</td>
                    <td className="px-3 py-3">{r.pakan_total_kg ? formatNumber(hitungFCR(r.pakan_total_kg, r.telur_kg), 2) : '-'}</td>
                    {canWrite && (
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(r)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Edit">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => remove(r)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" aria-label="Hapus">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 lg:hidden">
            {rows.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{formatTanggal(r.tanggal, true)}</div>
                  {canWrite && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => remove(r)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" aria-label="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <Cell label="Telur" value={`${formatNumber(r.telur_butir)} btr`} />
                  <Cell label="Berat" value={`${formatNumber(r.telur_kg, 1)} kg`} />
                  <Cell label="Pecah" value={String(r.telur_pecah || 0)} />
                  <Cell label="Hidup" value={formatNumber(r.ayam_hidup)} />
                  <Cell label="Mati" value={String(r.ayam_mati || 0)} />
                  <Cell label="HD%" value={`${formatNumber(hitungHD(r.telur_butir, r.ayam_hidup), 1)}%`} />
                </div>
                {r.keterangan && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{r.keterangan}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Monitoring' : 'Tambah Monitoring'} wide>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tanggal">
              <DateInput value={form.tanggal} onChange={(v) => setForm({ ...form, tanggal: v })} required />
            </Field>
            <Field label="Umur (minggu)">
              <input type="number" min={0} className="input" value={form.umur_minggu ?? ''} onChange={num('umur_minggu')} placeholder="mis. 45" />
            </Field>
            <Field label="Ayam Hidup">
              <input type="number" min={0} className="input" value={form.ayam_hidup || ''} onChange={num('ayam_hidup')} required />
            </Field>
            <Field label="Ayam Mati">
              <input type="number" min={0} className="input" value={form.ayam_mati || ''} onChange={num('ayam_mati')} />
            </Field>
            <Field label="Pakan (gram/ekor)">
              <input type="number" min={0} step="0.1" className="input" value={form.pakan_gram ?? ''} onChange={num('pakan_gram')} placeholder="mis. 115" />
            </Field>
            <Field label="Total Pakan (kg)">
              <input type="number" min={0} step="0.1" className="input" value={form.pakan_total_kg ?? ''} onChange={num('pakan_total_kg')} placeholder="mis. 53.5" />
            </Field>
            <Field label="Telur (butir)">
              <input type="number" min={0} className="input" value={form.telur_butir || ''} onChange={num('telur_butir')} required />
            </Field>
            <Field label="Telur (kg)">
              <input type="number" min={0} step="0.1" className="input" value={form.telur_kg || ''} onChange={num('telur_kg')} />
            </Field>
            <Field label="Telur Pecah">
              <input type="number" min={0} className="input" value={form.telur_pecah || ''} onChange={num('telur_pecah')} />
            </Field>
            <div className="flex items-end">
              <div className="w-full rounded-xl bg-slate-100 px-3 py-2.5 text-sm dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400">HD% </span>
                <span className="font-bold">{formatNumber(hitungHD(form.telur_butir, form.ayam_hidup), 1)}%</span>
                <span className="ml-2 text-slate-500 dark:text-slate-400">FCR </span>
                <span className="font-bold">{form.pakan_total_kg ? formatNumber(hitungFCR(form.pakan_total_kg, form.telur_kg), 2) : '-'}</span>
              </div>
            </div>
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

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/50">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="font-semibold text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  )
}
