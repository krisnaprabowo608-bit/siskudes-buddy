# Restrukturisasi Penganggaran ↔ Penatausahaan (Final)

Plan ini menggabungkan 3 revisi tertulis + transkrip audio klien menjadi satu implementasi terpadu.

## Prinsip Utama Klien

> "Semua belanja & pendapatan harus mengacu ke baris yang sudah dianggarkan. LRA = bandingkan Anggaran vs Realisasi otomatis."

---

## A. Hapus & Routing
- **Hapus** `src/pages/PenganggaranAPBDesa.tsx`
- **`src/App.tsx`**: hapus import & route `/penganggaran`
- **`src/components/TopMenuBar.tsx`**: hapus item "Kegiatan APBDesa" di submenu Penganggaran (sisakan: Pendapatan, Belanja, Pembiayaan)

## B. Buang Field Perubahan (PAK)
- **`src/data/app-state.ts`**: hapus `perubahanAnggaran` dari `PendapatanItem`, `BelanjaItem`, `PembiayaanItem`
- **`PendapatanDesa.tsx`**, **`BelanjaDesa.tsx`**, **`PembiayaanDesa.tsx`**:
  - Buang kolom tabel "Anggaran PAK"
  - Buang input "Perubahan (Rp)" + ringkasan kanan jadi hanya "Anggaran"
  - View-mode rincian: hapus kolom Perubahan & Jumlah

## C. Bridge Belanja → SPP (No. Ref, Hard-Lock)
- **`src/data/app-state.ts`** — tambah ke `SPPRincian`:
  ```ts
  belanjaId?: string;     // id baris Belanja yang dirujuk
  noRef?: string;         // nomorUrut Belanja
  kodeKegiatan?: string;
  ```
- **`src/lib/financial-engine.ts`**:
  - `getPaguKegiatan` → SUM(`belanja[kodeKegiatan].anggaran`) (bukan dari `kegiatanAnggaran`)
  - Tambah `getSisaBelanjaItem(state, belanjaId, excludeRincianId?)` → anggaran − total terpakai SPP
  - Tambah `getBelanjaOptionsForKegiatan(state, kodeKegiatan)` → list `{belanjaId, noRef, kodeRekening, namaRekening, sisa}`
- **`SPPPanjar.tsx`** & **`SPPDefinitif.tsx`** — Tab "Rincian":
  - Tambah dropdown **Bidang → Kegiatan** di atas dropdown Rincian
  - Dropdown Rincian: list baris Belanja (No.Ref + Kode + Nama + Sisa) hasil `getBelanjaOptionsForKegiatan`
  - Auto-fill `kodeRekening`, `namaRekening`, `noRef`, `belanjaId`, `kodeKegiatan`
  - Validasi: `nilai > sisa` → **toast.error & block** (HARD-LOCK)
  - Tabel rincian: tambah kolom "No. Ref"
- **`SPPPembiayaan.tsx`** — hard-lock berdasarkan sisa anggaran `pembiayaan` (jenis pengeluaran)

## D. Bridge Pendapatan → Penerimaan (Warning Only)
- **`src/lib/financial-engine.ts`** — tambah `getPendapatanOptions(state)` → `{pendapatanId, kodeRekening, namaRekening, anggaran, terealisasi, sisa}`
- **`src/pages/PenerimaanDesa.tsx`** (Tab **Tunai** & **Bank** rincian):
  - Dropdown "Kd Rincian" diganti: ambil dari `getPendapatanOptions` (bukan master rekening pendapatan)
  - Tampilkan sisa anggaran di label opsi
  - Jika `nilai > sisa` → toast **warning only** + tetap simpan (sesuai aturan klien)
- **Tab SiLPA**: TIDAK diubah, tetap independen ambil dari rekening aset

## E. SPJ Kegiatan — Field Tambahan
- **`src/pages/SPJKegiatan.tsx`**: tambah kolom & field input **Kode Rincian** dan **Nama Rincian** yang otomatis terisi dari rincian SPP yang dirujuk (warisi `noRef`/`belanjaId`/`kodeRekening`/`namaRekening` dari SPP)

## F. Bug Data Demo
- **`src/data/demo-seed-data.ts`** & lokasi reset di `Beranda.tsx` / `DataUmumDesa.tsx`:
  - Pastikan user baru / hasil "Reset Semua Progres" → state benar-benar kosong
  - LRA tidak boleh menampilkan angka demo saat tidak ada input user
  - Pastikan demo seed hanya aktif via toggle eksplisit di Admin

## G. Pembersihan
- Hapus referensi `kegiatanAnggaran` di seed bila menyebabkan error TS (pertahankan field di interface untuk backward compat state lama)
- Update memory `mem://logic/budgetary-control` & `mem://logic/input-flow`

---

## Aturan Validasi Final

| Modul | Sumber Anggaran | Aturan |
|---|---|---|
| Belanja | Bebas (jadi sumber pagu) | — |
| SPP Panjar/Definitif | Baris Belanja per No.Ref | **Hard-lock** |
| SPP Pembiayaan | Pembiayaan Pengeluaran | **Hard-lock** |
| Penerimaan (Tunai/Bank) | Pendapatan | **Warning only** |
| SiLPA | Saldo Awal / aset | Independen |

## Diagram Alur Baru

```text
Parameter (Bidang/Kegiatan, Rekening)
        │
        ▼
PENGANGGARAN
  ├── Pendapatan Desa  ────────►  Penerimaan Desa (warning)
  ├── Belanja Desa     ────────►  SPP Panjar/Definitif (hard-lock per No.Ref)
  │                                   │
  │                                   ▼
  │                               SPJ Kegiatan (warisi Kode/Nama Rincian)
  └── Pembiayaan Desa  ────────►  SPP Pembiayaan (hard-lock)
                                      │
                                      ▼
                                Pencairan → Pembukuan → LRA (auto Anggaran vs Realisasi)
```

Setelah disetujui, saya implementasikan semua perubahan di atas dalam satu pass.