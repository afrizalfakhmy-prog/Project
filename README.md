# Project App

Struktur proyek telah disederhanakan untuk desain website baru dari nol.

## Struktur

- `index.html` → Halaman utama
- `styles/main.css` → Styling utama
- `scripts/main.js` → Interaksi utama
- `assets/` → Tempat file gambar/icon baru
- `pages/` → Tempat halaman tambahan bila dibutuhkan
- `components/` → Tempat komponen reusable

## Cara jalankan

Buka `index.html` langsung di browser.

## Sinkronisasi lintas device (Vercel) dengan Supabase

App sekarang mendukung sinkronisasi cloud untuk data master (`Daftar User`, `Daftar Departemen`, `Daftar Perusahaan`, `Daftar PJA`) dan data operasional utama lewat file `scripts/cloud_sync.js` + `scripts/storage_guard.js`.

### 1) Buat tabel di Supabase

Jalankan SQL berikut di Supabase SQL Editor:

```sql
create table if not exists public.aios_kv (
	key text primary key,
	value jsonb not null default '[]'::jsonb,
	updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
	new.updated_at = now();
	return new;
end;
$$ language plpgsql;

drop trigger if exists trg_aios_kv_updated_at on public.aios_kv;
create trigger trg_aios_kv_updated_at
before update on public.aios_kv
for each row execute function public.set_updated_at();
```

### 2) Aktifkan policy (RLS)

Jika RLS aktif, buat policy agar role `anon` bisa `select/insert/update` pada tabel `aios_kv`.

### 3) Set konfigurasi di browser/Vercel

Tambahkan konfigurasi global sebelum memuat `scripts/cloud_sync.js`:

```html
<script>
	window.AIOS_CLOUD_CONFIG = {
		supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
		supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
		tableName: 'aios_kv'
	};
</script>
```

Atau set manual via `localStorage`:

```js
localStorage.setItem('aios_supabase_url', 'https://YOUR_PROJECT.supabase.co');
localStorage.setItem('aios_supabase_anon_key', 'YOUR_SUPABASE_ANON_KEY');
```

Setelah itu, perubahan data dari Super Admin akan otomatis dipull oleh sesi Admin/User secara periodik.
