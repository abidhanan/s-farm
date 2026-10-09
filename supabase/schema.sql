-- ===========================================================================
-- S-FARM — Skema database Supabase
-- Jalankan seluruh isi file ini di Supabase Dashboard > SQL Editor > New query.
-- Aman dijalankan ulang (idempotent).
-- ===========================================================================

-- --------------------------------------------------------------------------
-- 1. TABEL PROFIL (perluasan auth.users)
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  role       text not null default 'peternak' check (role in ('admin', 'peternak', 'bendahara')),
  active      boolean not null default true,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- 2. FUNGSI BANTUAN (security definer → hindari rekursi RLS)
-- --------------------------------------------------------------------------
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active = true;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false);
$$;

-- admin & peternak boleh menulis; bendahara hanya baca
create or replace function public.can_write()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin', 'peternak'), false);
$$;

-- --------------------------------------------------------------------------
-- 3. TRIGGER: buat profil otomatis saat user mendaftar
-- --------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'peternak',
    true
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- --------------------------------------------------------------------------
-- 4. TABEL DATA
-- --------------------------------------------------------------------------
create table if not exists public.ayam_monitoring (
  id             uuid primary key default gen_random_uuid(),
  tanggal        date not null,
  umur_minggu    int,
  ayam_hidup     int not null default 0,
  ayam_mati      int not null default 0,
  pakan_gram     numeric,
  pakan_total_kg numeric,
  telur_butir    int not null default 0,
  telur_kg       numeric not null default 0,
  telur_pecah    int not null default 0,
  keterangan     text,
  created_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

create table if not exists public.kambing_kesehatan (
  id             uuid primary key default gen_random_uuid(),
  tanggal        date not null,
  jenis          text not null check (jenis in ('suntik', 'vaksin')),
  nama_obat      text not null,
  jumlah_kambing int not null default 0,
  keterangan     text,
  created_by     uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

create table if not exists public.penjualan (
  id           uuid primary key default gen_random_uuid(),
  tanggal      date not null,
  ternak       text not null default 'ayam' check (ternak in ('ayam', 'kambing')),
  produk       text not null,
  pembeli      text not null,
  jumlah       numeric not null default 0,
  satuan       text not null default 'kg',
  harga_satuan numeric not null default 0,
  total        numeric not null default 0,
  metode       text not null check (metode in ('diantar', 'diambil')),
  status_bayar text not null default 'lunas' check (status_bayar in ('lunas', 'belum')),
  keterangan   text,
  created_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.pengeluaran (
  id         uuid primary key default gen_random_uuid(),
  tanggal    date not null,
  kategori   text not null,
  deskripsi  text not null,
  jumlah     numeric not null default 0,
  nota_url   text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ayam_tanggal on public.ayam_monitoring (tanggal desc);
create index if not exists idx_penjualan_tanggal on public.penjualan (tanggal desc);
create index if not exists idx_pengeluaran_tanggal on public.pengeluaran (tanggal desc);
create index if not exists idx_kambing_tanggal on public.kambing_kesehatan (tanggal desc);

-- --------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- --------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.ayam_monitoring   enable row level security;
alter table public.kambing_kesehatan enable row level security;
alter table public.penjualan         enable row level security;
alter table public.pengeluaran       enable row level security;

-- PROFILES: baca profil sendiri atau (admin) semua; hanya admin boleh ubah.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- Macro RLS untuk tabel data: SELECT semua user aktif, tulis admin/peternak.
do $$
declare t text;
begin
  foreach t in array array['ayam_monitoring', 'kambing_kesehatan', 'penjualan', 'pengeluaran']
  loop
    execute format('drop policy if exists "%s_select" on public.%I;', t, t);
    execute format('create policy "%s_select" on public.%I for select using (public.my_role() is not null);', t, t);

    execute format('drop policy if exists "%s_insert" on public.%I;', t, t);
    execute format('create policy "%s_insert" on public.%I for insert with check (public.can_write());', t, t);

    execute format('drop policy if exists "%s_update" on public.%I;', t, t);
    execute format('create policy "%s_update" on public.%I for update using (public.can_write()) with check (public.can_write());', t, t);

    execute format('drop policy if exists "%s_delete" on public.%I;', t, t);
    execute format('create policy "%s_delete" on public.%I for delete using (public.can_write());', t, t);
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- 6. STORAGE: bucket "nota" untuk bukti pengeluaran
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('nota', 'nota', true)
on conflict (id) do nothing;

drop policy if exists "nota_read" on storage.objects;
create policy "nota_read" on storage.objects for select
  using (bucket_id = 'nota');

drop policy if exists "nota_write" on storage.objects;
create policy "nota_write" on storage.objects for insert
  with check (bucket_id = 'nota' and public.can_write());

drop policy if exists "nota_delete" on storage.objects;
create policy "nota_delete" on storage.objects for delete
  using (bucket_id = 'nota' and public.can_write());

-- ===========================================================================
-- 7. PENTING — Jadikan akun Anda sebagai ADMIN
-- ---------------------------------------------------------------------------
-- Setelah Anda mendaftar lewat aplikasi (tab "Daftar"), jalankan perintah ini
-- (ganti email sesuai akun Anda) agar menjadi admin:
--
--   update public.profiles set role = 'admin' where email = 'email-anda@contoh.com';
-- ===========================================================================
