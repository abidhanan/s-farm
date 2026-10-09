import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Download } from 'lucide-react'
import { ayam, penjualan, pengeluaran } from '../lib/db'
import { useTheme } from '../lib/theme'
import type { AyamRecord, PengeluaranRecord, PenjualanRecord } from '../lib/types'
import { formatNumber, formatRupiah, monthKey } from '../lib/format'
import { PageHeader, PageLoader, StatCard } from '../components/ui'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
function labelBulan(key: string) {
  const [y, m] = key.split('-')
  return `${MONTHS_SHORT[Number(m) - 1]} ${y.slice(2)}`
}

export default function Laporan() {
  const { theme } = useTheme()
  const [data, setData] = useState<{ ayam: AyamRecord[]; penjualan: PenjualanRecord[]; pengeluaran: PengeluaranRecord[] } | null>(null)

  useEffect(() => {
    Promise.all([ayam.list(), penjualan.list(), pengeluaran.list()]).then(([a, s, e]) =>
      setData({ ayam: a, penjualan: s, pengeluaran: e }),
    )
  }, [])

  const grid = theme === 'dark' ? '#1e293b' : '#e2e8f0'
  const axis = theme === 'dark' ? '#94a3b8' : '#64748b'

  const keuangan = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { key: string; pemasukan: number; pengeluaran: number }>()
    for (const r of data.penjualan) {
      const k = monthKey(r.tanggal)
      const e = map.get(k) ?? { key: k, pemasukan: 0, pengeluaran: 0 }
      e.pemasukan += r.total
      map.set(k, e)
    }
    for (const r of data.pengeluaran) {
      const k = monthKey(r.tanggal)
      const e = map.get(k) ?? { key: k, pemasukan: 0, pengeluaran: 0 }
      e.pengeluaran += r.jumlah
      map.set(k, e)
    }
    return Array.from(map.values())
      .sort((a, b) => (a.key < b.key ? -1 : 1))
      .slice(-6)
      .map((e) => ({ ...e, bulan: labelBulan(e.key), laba: e.pemasukan - e.pengeluaran }))
  }, [data])

  const telur = useMemo(() => {
    if (!data) return []
    return [...data.ayam]
      .sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))
      .slice(-14)
      .map((r) => ({ tgl: r.tanggal.slice(5), butir: r.telur_butir }))
  }, [data])

  const metode = useMemo(() => {
    if (!data) return []
    const diantar = data.penjualan.filter((r) => r.metode === 'diantar').reduce((s, r) => s + r.total, 0)
    const diambil = data.penjualan.filter((r) => r.metode === 'diambil').reduce((s, r) => s + r.total, 0)
    return [
      { name: 'Diantar', value: diantar },
      { name: 'Diambil', value: diambil },
    ].filter((d) => d.value > 0)
  }, [data])

  const totals = useMemo(() => {
    if (!data) return { pemasukan: 0, pengeluaran: 0, laba: 0 }
    const pemasukan = data.penjualan.reduce((s, r) => s + r.total, 0)
    const pengeluaranT = data.pengeluaran.reduce((s, r) => s + r.jumlah, 0)
    return { pemasukan, pengeluaran: pengeluaranT, laba: pemasukan - pengeluaranT }
  }, [data])

  function exportCSV() {
    if (!data) return
    const rows = [['Tanggal', 'Tipe', 'Keterangan', 'Masuk', 'Keluar']]
    for (const r of data.penjualan) rows.push([r.tanggal, 'Penjualan', `${r.pembeli} - ${r.produk}`, String(r.total), '0'])
    for (const r of data.pengeluaran) rows.push([r.tanggal, 'Pengeluaran', `${r.kategori} - ${r.deskripsi}`, '0', String(r.jumlah)])
    rows.sort((a, b) => (a[0] < b[0] ? -1 : 1))
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-s-farm-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!data) return <PageLoader />

  const PIE_COLORS = ['#3b82f6', '#f59e0b']

  return (
    <div>
      <PageHeader
        title="Laporan Keuangan & Produksi"
        subtitle="Ringkasan pemasukan, pengeluaran, dan produksi"
        icon={<BarChart3 size={22} />}
        action={<button onClick={exportCSV} className="btn-ghost"><Download size={16} /> Ekspor CSV</button>}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Pemasukan" value={formatRupiah(totals.pemasukan)} tone="brand" />
        <StatCard label="Total Pengeluaran" value={formatRupiah(totals.pengeluaran)} tone="red" />
        <StatCard label="Laba Bersih" value={formatRupiah(totals.laba)} tone={totals.laba >= 0 ? 'brand' : 'red'} sub={totals.laba >= 0 ? 'surplus' : 'defisit'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card min-w-0 p-5">
          <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Pemasukan vs Pengeluaran</h2>
          {keuangan.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={keuangan} margin={{ left: -10, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="bulan" tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={tooltipStyle(theme)} />
                <Legend />
                <Bar dataKey="pemasukan" name="Pemasukan" fill="#16a34a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card min-w-0 p-5">
          <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Produksi Telur (14 hari)</h2>
          {telur.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={telur} margin={{ left: -10, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="tgl" tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `${formatNumber(v)} butir`} contentStyle={tooltipStyle(theme)} />
                <Line type="monotone" dataKey="butir" name="Telur" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card min-w-0 p-5">
          <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Metode Penjualan</h2>
          {metode.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={metode} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.name}>
                  {metode.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={tooltipStyle(theme)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card min-w-0 p-5">
          <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Rekap Bulanan</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
                  <th className="py-2 pr-2">Bulan</th>
                  <th className="py-2 pr-2 text-right">Masuk</th>
                  <th className="py-2 pr-2 text-right">Keluar</th>
                  <th className="py-2 text-right">Laba</th>
                </tr>
              </thead>
              <tbody>
                {keuangan.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-400">Belum ada data</td></tr>
                ) : (
                  keuangan.map((r) => (
                    <tr key={r.key} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                      <td className="py-2 pr-2 font-medium">{r.bulan}</td>
                      <td className="py-2 pr-2 text-right text-brand-600 dark:text-brand-400">{formatRupiah(r.pemasukan)}</td>
                      <td className="py-2 pr-2 text-right text-red-600 dark:text-red-400">{formatRupiah(r.pengeluaran)}</td>
                      <td className={`py-2 text-right font-semibold ${r.laba >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-red-600'}`}>{formatRupiah(r.laba)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Empty() {
  return <div className="grid h-[260px] place-items-center text-sm text-slate-400">Belum ada data</div>
}
function tooltipStyle(theme: string) {
  return {
    borderRadius: 12,
    border: 'none',
    background: theme === 'dark' ? '#1e293b' : '#fff',
    color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
    boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
  }
}
