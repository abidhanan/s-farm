export function formatRupiah(n: number | null | undefined): string {
  const v = Number(n || 0)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v)
}

export function formatNumber(n: number | null | undefined, digits = 0): string {
  const v = Number(n || 0)
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(v)
}

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function formatTanggal(iso: string, withDay = false): string {
  if (!iso) return '-'
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return iso
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  return withDay ? `${DAYS[d.getDay()]}, ${base}` : base
}

export function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function monthKey(iso: string): string {
  return iso ? iso.slice(0, 7) : ''
}

/** Hen-Day %: (butir telur / ayam hidup) * 100 */
export function hitungHD(butir: number, ayamHidup: number): number {
  if (!ayamHidup) return 0
  return (butir / ayamHidup) * 100
}

/**
 * FCR (Feed Conversion Ratio) = total pakan (kg) / total massa telur (kg).
 * Semakin kecil semakin efisien.
 */
export function hitungFCR(pakanKg: number, telurKg: number): number {
  if (!telurKg) return 0
  return pakanKg / telurKg
}
