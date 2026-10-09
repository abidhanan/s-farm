export type Role = 'admin' | 'peternak' | 'bendahara'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  active: boolean
  created_at: string
}

/** Monitoring harian ayam petelur (sesuai lembar BUMDesa). */
export interface AyamRecord {
  id: string
  tanggal: string // ISO date (yyyy-mm-dd)
  umur_minggu: number | null // umur ayam dalam minggu
  ayam_hidup: number
  ayam_mati: number
  pakan_gram: number | null // gram / ekor
  pakan_total_kg: number | null // total pakan (kg)
  telur_butir: number
  telur_kg: number
  telur_pecah: number
  keterangan: string | null
  created_by: string | null
  created_at: string
}

/** Kesehatan kambing: hanya suntik / vaksin. */
export interface KambingRecord {
  id: string
  tanggal: string
  jenis: 'suntik' | 'vaksin'
  nama_obat: string // nama vaksin / obat / penyakit
  jumlah_kambing: number
  keterangan: string | null
  created_by: string | null
  created_at: string
}

export type MetodePenjualan = 'diantar' | 'diambil'
export type StatusBayar = 'lunas' | 'belum'
export type JenisTernak = 'ayam' | 'kambing'

/** Penjualan harian (sesuai papan tulis). */
export interface PenjualanRecord {
  id: string
  tanggal: string
  ternak: JenisTernak
  produk: string // mis. "Telur", "Telur Pecah", "Kambing"
  pembeli: string
  jumlah: number // kg / ekor
  satuan: string // "kg" | "ekor" | "butir"
  harga_satuan: number
  total: number
  metode: MetodePenjualan
  status_bayar: StatusBayar
  keterangan: string | null
  created_by: string | null
  created_at: string
}

/** Pengeluaran + bukti nota. */
export interface PengeluaranRecord {
  id: string
  tanggal: string
  kategori: string // pakan, obat, listrik, gaji, lainnya
  deskripsi: string
  jumlah: number
  nota_url: string | null
  created_by: string | null
  created_at: string
}

export type TableName = 'ayam' | 'kambing' | 'penjualan' | 'pengeluaran'
