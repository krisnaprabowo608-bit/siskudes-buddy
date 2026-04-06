

# Deploy ke Vercel — Panduan Lengkap

## Yang akan dilakukan di kode

### 1. Buat file `vercel.json`
File konfigurasi SPA routing agar semua halaman berfungsi normal di Vercel (tidak 404 saat refresh).

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Hanya ini satu-satunya perubahan kode yang diperlukan.

---

## Langkah Deploy (Step-by-Step)

### Langkah 1: Hubungkan ke GitHub
1. Di Lovable, klik **Settings** (ikon gear) → **GitHub** → **Connect project**
2. Authorize Lovable di GitHub
3. Klik **Create Repository** — kode otomatis ter-push ke GitHub

### Langkah 2: Daftar/Login Vercel
1. Buka [vercel.com](https://vercel.com)
2. Klik **Sign Up** → pilih **Continue with GitHub**
3. Authorize Vercel untuk akses GitHub Anda

### Langkah 3: Import Project
1. Di Vercel dashboard, klik **"Add New..." → Project**
2. Pilih repository yang baru dibuat dari daftar
3. Klik **Import**

### Langkah 4: Konfigurasi Build
Vercel biasanya auto-detect, tapi pastikan:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Langkah 5: Tambah Environment Variables
Di halaman yang sama sebelum deploy, buka bagian **Environment Variables** dan tambahkan:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://lvxxazfxtbinutrnoyui.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2eHhhemZ4dGJpbnV0cm5veXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTcwMjEsImV4cCI6MjA5MDEzMzAyMX0.rzFIKbe_T-xh1JQ5pdfTsI1ej8NxRyNNdwg6Nq-UNMk` |
| `VITE_SUPABASE_PROJECT_ID` | `lvxxazfxtbinutrnoyui` |

### Langkah 6: Deploy
Klik **Deploy** — tunggu 1-2 menit hingga selesai. Vercel akan memberikan URL seperti `nama-project.vercel.app`.

### Langkah 7: Custom Domain (Opsional)
Di Vercel → Project → **Settings → Domains** → tambahkan domain `.com` Anda dan ikuti instruksi DNS.

---

## Setelah Deploy

Setiap kali Anda edit di Lovable, perubahan otomatis sync:

```text
Lovable (edit) → GitHub (auto-sync) → Vercel (auto-deploy)
```

Tidak perlu langkah manual untuk update berikutnya.

