import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Egg, Receipt, ShoppingCart, Syringe, TrendingUp, Wallet } from 'lucide-react'
import { ayam, kambing, penjualan, pengeluaran } from '../lib/db'
import { useAuth } from '../lib/auth'
import type { AyamRecord, KambingRecord, PengeluaranRecord, PenjualanRecord } from '../lib/types'
import { formatNumber, formatRupiah, formatTanggal, hitungHD, todayISO } from '../lib/format'
import { PageHeader, PageLoader, StatCard } from '../components/ui'

export default function Dashboard() {
  const { profile } = useAuth()
  const [data, setData] = useState<{
    ayam: AyamRecord[]
    kambing: KambingRecord[]
    penjualan: PenjualanRecord[]
    pengeluaran: PengeluaranRecord[]
  } | null>(null)

  useEffect(() => {
    Promise.all([ayam.list(), kambing.list(), penjualan.list(), pengeluaran.list()]).then(([a, k, s, e]) =>
      setData({ ayam: a, kambing: k, penjualan: s, pengeluaran: e }),
    )
  }, [])

  const stats = useMemo(() => {
    if (!data) return null
    const bulan = todayISO().slice(0, 7)
    const penjBulan = data.penjualan.filter((r) => r.tanggal.startsWith(bulan))
    const pengBulan = data.pengeluaran.filter((r) => r.tanggal.startsWith(bulan))
    const pemasukan = penjBulan.reduce((s, r) => s + r.total, 0)
    const biaya = pengBulan.reduce((s, r) => s + r.jumlah, 0)
    const lastAyam = data.ayam[0]
    return {
      pemasukan,
      biaya,
      laba: pemasukan - biaya,
      telurBulan: data.ayam.filter((r) => r.tanggal.startsWith(bulan)).reduce((s, r) => s + r.telur_butir, 0),
      hd: lastAyam ? hitungHD(lastAyam.telur_butir, lastAyam.ayam_hidup) : 0,
      ayamHidup: lastAyam?.ayam_hidup ?? 0,
      belumBayar: data.penjualan.filter((r) => r.status_bayar === 'belum').reduce((s, r) => s + r.total, 0),
    }
  }, [data])

  if (!data || !stats) return <PageLoader />

  const jam = new Date().getHours()
  const salam = jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 18 ? 'Selamat sore' : 'Selamat malam'

  const recent = [...data.penjualan].slice(0, 5)

  return (
    <div>
      <PageHeader title={`${salam}, ${profile?.full_name.split(' ')[0]} 👋`} subtitle="Ringkasan peternakan bulan ini" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pemasukan (bln ini)" value={formatRupiah(stats.pemasukan)} tone="brand" icon={<Wallet size={16} />} />
        <StatCard label="Pengeluaran (bln ini)" value={formatRupiah(stats.biaya)} tone="red" icon={<Receipt size={16} />} />
        <StatCard label="Laba Kotor" value={formatRupiah(stats.laba)} sub={stats.laba >= 0 ? 'surplus' : 'defisit'} tone={stats.laba >= 0 ? 'brand' : 'red'} icon={<TrendingUp size={16} />} />
        <StatCard label="Piutang (belum bayar)" value={formatRupiah(stats.belumBayar)} tone="amber" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ayam Hidup" value={`${formatNumber(stats.ayamHidup)} ekor`} icon={<Egg size={16} />} />
        <StatCard label="Telur (bln ini)" value={`${formatNumber(stats.telurBulan)} butir`} tone="blue" />
        <StatCard label="HD% Terakhir" value={`${formatNumber(stats.hd, 1)}%`} tone="amber" />
        <StatCard label="Catatan Kambing" value={formatNumber(data.kambing.length)} tone="slate" icon={<Syringe size={16} />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">Penjualan Terbaru</h2>
            <Link to="/penjualan" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Belum ada penjualan.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{r.pembeli}</div>
                    <div className="text-xs text-slate-400">{formatTanggal(r.tanggal)} · {r.produk}</div>
                  </div>
                  <div className="shrink-0 text-right text-sm font-semibold">{formatRupiah(r.total)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-bold text-slate-900 dark:text-white">Akses Cepat</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink to="/ayam" icon={<Egg size={20} />} label="Ayam Petelur" tone="brand" />
            <QuickLink to="/kambing" icon={<Syringe size={20} />} label="Kambing" tone="blue" />
            <QuickLink to="/penjualan" icon={<ShoppingCart size={20} />} label="Penjualan" tone="amber" />
            <QuickLink to="/pengeluaran" icon={<Receipt size={20} />} label="Pengeluaran" tone="red" />
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickLink({ to, icon, label, tone }: { to: string; icon: React.ReactNode; label: string; tone: string }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300',
    red: 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300',
  }
  return (
    <Link to={to} className={`flex items-center gap-2.5 rounded-xl p-3.5 text-sm font-semibold transition ${tones[tone]}`}>
      {icon} {label}
    </Link>
  )
}
