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

### 3) Set konfigurasi global untuk semua user Vercel

Isi file `config/cloud-config.json`:

```json
{
	"supabaseUrl": "https://YOUR_PROJECT.supabase.co",
	"supabaseAnonKey": "YOUR_SUPABASE_ANON_KEY",
	"tableName": "aios_kv"
}
```

Dengan ini, semua role (Super Admin/Admin/User) dan semua device/browser di domain Vercel yang sama memakai endpoint cloud yang sama.

### 4) Opsi override (opsional)

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

## Email API untuk SPIP (otomatis kirim PDF)

Untuk mengaktifkan kirim email otomatis saat `Simpan Komisioning`, jalankan backend sederhana di folder `email-api`.

### 1) Setup backend

```bash
cd email-api
npm install
```

Copy file env:

```bash
copy .env.example .env
```

Lalu isi nilai SMTP di `.env`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Opsional keamanan:

- `EMAIL_API_BEARER_TOKEN` untuk validasi token Bearer
- `ALLOWED_ORIGINS` untuk whitelist origin frontend

### 2) Jalankan backend

```bash
npm start
```

Default endpoint: `http://localhost:8080/api/spip/send-email`

### 3) Konfigurasi frontend SPIP

Tambahkan script global sebelum `scripts/pages/spip.js` dimuat (contoh di `pages/spip.html`):

```html
<script>
	window.AIOS_SPIP_EMAIL_API = {
		endpoint: 'http://localhost:8080/api/spip/send-email',
		token: 'isi-jika-menggunakan-bearer-token'
	};
</script>
```

Jika endpoint tidak diisi / gagal, aplikasi tetap fallback ke draft email (`mailto`).

### 4) Checklist testing manual (end-to-end)

1. Jalankan backend email API:
	- `cd email-api`
	- `npm install`
	- `copy .env.example .env`
	- isi SMTP valid di `.env`
	- `npm start`
2. Buka halaman SPIP dari frontend.
3. Buat / pilih data SPIP, lalu buka `Detail Komisioning`.
4. Isi field wajib:
	- `Tanggal Komisioning`
	- `Tanggal Expired`
	- `Email` (bisa lebih dari satu, pisahkan koma/baris baru)
	- `Komisioner`
5. Klik `Simpan Komisioning`.
6. Verifikasi hasil:
	- dialog print/export PDF muncul
	- backend menerima request `POST /api/spip/send-email`
	- email diterima oleh seluruh penerima pada field `Email`
	- lampiran PDF terbaca normal
7. Uji validasi email:
	- isi salah satu email invalid
	- pastikan muncul alert format email tidak valid dan proses kirim dibatalkan
8. Uji fallback `mailto`:
	- matikan backend / kosongkan `endpoint`
	- klik `Simpan Komisioning`
	- pastikan draft email terbuka otomatis sebagai fallback.
