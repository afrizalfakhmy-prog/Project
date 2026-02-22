# Backend Starter (Express)

Backend awal untuk Project App yang bisa dikembangkan langsung di VS Code.

## Fitur awal
- Auth sederhana dengan JWT (`/api/auth/login`)
- CRUD KTA (`/api/kta`)
- CRUD TTA (`/api/tta`)
- Tasklist gabungan (`/api/tasklist`)
- Upload multi gambar (`/api/upload/images`)
- Penyimpanan awal berbasis file JSON (`backend/data/*.json`)

## Menjalankan
1. Buka terminal di folder `backend`
2. Install dependency:

```powershell
npm install
```

3. Salin env:

```powershell
Copy-Item .env.example .env
```

4. Jalankan development server:

```powershell
npm run dev
```

Server default: `http://localhost:4000`

## Endpoint utama
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST /api/kta`
- `PUT/DELETE /api/kta/:id`
- `GET/POST /api/tta`
- `PUT/DELETE /api/tta/:id`
- `GET /api/tasklist`
- `POST /api/upload/images` (form-data field name: `images`)

## Catatan penting
- Ini starter untuk percepatan development.
- Password user seed masih plaintext; untuk production wajib hash + database (PostgreSQL/MySQL).
- Data saat ini disimpan di file JSON, cocok untuk prototipe. Untuk production sebaiknya migrasi ke DB.

## Deploy Online (Netlify + Render)

### 1) Deploy Backend ke Render
1. Push repo ke GitHub.
2. Di Render, buat service baru dari repo ini.
3. Render akan membaca `render.yaml` otomatis.
4. Isi environment variable:
	- `JWT_SECRET` = string acak panjang
	- `CLIENT_ORIGIN` = URL frontend kamu (contoh: `https://my-aios.netlify.app`)
5. Setelah deploy, catat URL backend, contoh: `https://my-aios-api.onrender.com`.

### 2) Deploy Frontend ke Netlify
1. Import repo yang sama ke Netlify.
2. Publish directory: root project (`.`), karena aplikasi ini static HTML.
3. Setelah online, buka file `app-config.js` di root dan ubah:

```javascript
window.AIOS_API_BASE = 'https://my-aios-api.onrender.com/api';
```

4. Commit perubahan itu agar frontend mengarah ke backend online.

### 3) Atur Link Sesuai Keinginan
- Netlify: Site settings → Domain management → ubah subdomain atau pasang custom domain.
- Render: Settings → Custom Domains untuk backend API (opsional).

Contoh target akhir:
- Frontend: `https://aios-permit.mycompany.com`
- Backend API: `https://api-aios.mycompany.com/api`
