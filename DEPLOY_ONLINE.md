# Deploy Online (Frontend + Backend)

Dokumen ini dibuat agar aplikasi bisa online dengan link sesuai keinginan kamu.

## 1) Tentukan link yang kamu mau
Contoh (ganti sesuai preferensi):
- Frontend: `https://a-ios.netlify.app`
- Backend API: `https://a-ios-api.onrender.com`

## 2) Deploy backend ke Render
1. Push project ke GitHub.
2. Buka Render → **New +** → **Blueprint** (agar `render.yaml` terbaca otomatis).
3. Pilih repo ini.
4. Isi env var di service backend:
   - `JWT_SECRET` = string panjang acak.
   - `CLIENT_ORIGIN` = URL frontend final kamu.
5. Deploy, lalu pastikan endpoint health hidup:
   - `https://<domain-backend>/api/health`

## 3) Set URL API frontend
Setelah domain backend jadi, jalankan dari root project:

```powershell
.\set-api-base.ps1 -ApiBase "https://<domain-backend>"
```

Script otomatis menambahkan `/api` bila belum ada.

## 4) Deploy frontend ke Netlify
1. Buka Netlify → **Add new site** → **Import an existing project**.
2. Pilih repo ini.
3. Build command kosongkan (static site), publish directory: `.`
4. Deploy.

## 5) Custom domain (sesuai keinginan)
- Netlify: **Site settings → Domain management**
- Render (opsional API): **Settings → Custom Domains**

## 6) Final checklist
- Frontend bisa login dari [index.html](index.html).
- Endpoint `GET /api/health` dari backend menjawab `ok: true`.
- CRUD di halaman:
  - [daftar_user.html](daftar_user.html)
  - [daftar_departemen.html](daftar_departemen.html)
  - [daftar_perusahaan.html](daftar_perusahaan.html)
  - [daftar_pja.html](daftar_pja.html)

## Catatan penting
- Saat ini data backend disimpan di file JSON (`backend/data`).
- Untuk production jangka panjang, disarankan pindah ke database (PostgreSQL/MySQL/MongoDB) agar lebih aman dan stabil.
