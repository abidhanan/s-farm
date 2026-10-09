# 🐔 S-Farm — Sistem Peternakan Desa Singopuran

Aplikasi web untuk mengelola peternakan **ayam petelur** & **kambing** milik BUMDesa "MAPAN",
Desa Singopuran: monitoring harian, penjualan (diantar/diambil), pengeluaran + bukti nota,
dan laporan keuangan. Responsif (HP & desktop), tema gelap/terang, cepat (Lighthouse 90+).

> ## 🌐 SUDAH ONLINE → **https://s-farm.vercel.app**

---

## 1. Cara Masuk

Buka **https://s-farm.vercel.app** lalu masuk.

| Akun Admin (sudah dibuat) | |
|---|---|
| Email | `abid@maua.ai` |
| Kata sandi | (yang Anda buat saat mendaftar) |
| Peran | **Admin** — akses penuh |

Lupa sandi? Supabase → **Authentication → Users** → pilih user → **Reset password**.

---

## 2. Tiga Peran

| Fitur | Admin | Peternak | Bendahara |
|---|:---:|:---:|:---:|
| Lihat semua data & laporan | ✅ | ✅ | ✅ |
| Input ayam, kambing, penjualan, pengeluaran | ✅ | ✅ | ❌ |
| Unggah nota | ✅ | ✅ | ❌ |
| Kelola pengguna (peran & status) | ✅ | ❌ | ❌ |

---

## 3. Menambah Pengguna Baru

1. Minta orangnya buka **https://s-farm.vercel.app** → tab **Daftar** → isi nama, email, sandi → **Daftar**.
   (Langsung aktif, tanpa verifikasi email.)
2. Anda (admin) buka menu **Pengguna** → ubah **Peran** (mis. jadi *Bendahara*) atau **Nonaktifkan** bila perlu.

> Pengguna baru default berperan **Peternak**.

---

## 4. Panduan Fitur

- **Dashboard** — ringkasan bulan ini: pemasukan, pengeluaran, laba, telur, HD%.
- **Ayam Petelur** — catatan harian: populasi (hidup/mati), pakan (gram & total kg),
  telur (butir/kg/pecah). **HD%** & **FCR** dihitung otomatis.
- **Kambing** — catatan **suntik** & **vaksin** (nama obat, jumlah ekor).
- **Penjualan** — pembeli, jumlah, harga, total otomatis, **diantar/diambil**, **lunas/belum bayar**.
- **Pengeluaran** — biaya operasional + **upload foto nota** (galeri/kamera HP).
- **Laporan** — grafik keuangan & produksi, rekap bulanan, **Ekspor CSV** (halaman utama Bendahara).

---

## 5. Infrastruktur (GRATIS 100%)

| Bagian | Layanan | Keterangan |
|---|---|---|
| Hosting web | **Vercel** — proyek `s-farm` | `s-farm.vercel.app` |
| Database + Login + Storage | **Supabase** — proyek `s-farm` | Region **Singapore**, paket Free |
| Foto nota | Supabase Storage bucket `nota` | publik-baca |

Kredensial aplikasi ada di `.env.production` (URL + *anon key* Supabase — aman bersifat publik).

---

## 6. Update & Deploy Ulang (setelah ubah kode)

```bash
npx vercel deploy --prod
```

Jalankan dari folder `s-farm` (login Vercel diminta sekali di browser).

---

## 7. Menjalankan di Komputer (opsional, pengembang)

```bash
npm install
npm run dev        # http://localhost:5173
```

- Ada `.env` (URL + anon key) → terhubung ke Supabase asli.
- Tanpa `.env` → **Mode Demo** (data di browser), akun uji:
  `admin@s-farm.id`/`admin123`, `peternak@s-farm.id`/`peternak123`, `bendahara@s-farm.id`/`bendahara123`.

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Mode pengembangan |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Pratinjau hasil build |
| `npm run typecheck` | Cek tipe TypeScript |

---

## 8. Teknologi & Struktur

**React + Vite + TypeScript + TailwindCSS** (UI, tema, responsif) · **Supabase**
(Postgres, Auth, Storage, Row-Level Security) · **Recharts** (grafik, lazy-load).
Kode dipecah per-halaman → **Lighthouse 90+** di mobile.

```
src/
  lib/        # db.ts (Supabase/Demo), auth, tema, tipe, util
  components/ # Layout + komponen UI
  pages/      # Dashboard, Ayam, Kambing, Penjualan, Pengeluaran, Laporan, Users, Login
supabase/
  schema.sql  # skema database + RLS + storage (sudah dijalankan)
```

---

## 9. Keamanan

- **RLS aktif** di semua tabel: Bendahara hanya baca; Peternak/Admin boleh tulis; ubah peran hanya Admin.
- Verifikasi email dimatikan agar pendaftaran instan. Untuk lebih ketat: aktifkan kembali di
  Supabase → Authentication → Sign In / Providers → **Confirm email**, atau nonaktifkan akun asing
  lewat menu **Pengguna**.

---

Dibuat untuk **BUMDesa "MAPAN" — Desa Singopuran**. 🌾
