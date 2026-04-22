// Shared types and simple state manager using localStorage

export interface PendapatanItem {
  id: string;
  kodeRekening: string;
  namaRekening: string;
  uraian: string;
  anggaran: number;
  perubahanAnggaran: number;
  sumberDana: string;
  jumlahSatuan: string;
  hargaSatuan: number;
}

export interface BelanjaItem {
  id: string;
  kodeBidang: string;
  kodeKegiatan: string;
  namaKegiatan: string;
  kodeRekening: string;
  namaRekening: string;
  nomorUrut: string;
  uraian: string;
  anggaran: number;
  perubahanAnggaran: number;
  jumlahSatuan: string;
  hargaSatuan: number;
  sumberDana: string;
}

export interface PembiayaanItem {
  id: string;
  jenis: 'penerimaan' | 'pengeluaran';
  kodeRekening: string;
  namaRekening: string;
  uraian: string;
  anggaran: number;
  perubahanAnggaran: number;
  jumlahSatuan: string;
  hargaSatuan: number;
  sumberDana: string;
}

export interface PenerimaanRincian {
  id: string;
  kodeRekening: string;
  namaRekening: string;
  sumberDana: string;
  nilai: number;
}

export interface PenerimaanItem {
  id: string;
  jenis: 'tunai' | 'bank' | 'silpa';
  tanggal: string;
  noBukti: string;
  uraian: string;
  jumlah: number;
  kodeRekening: string;
  namaRekening: string;
  penyetor: string;
  nama: string;
  alamat: string;
  ttd: string;
  rekening?: string;
  namaBank?: string;
  kppn?: string;
  rincian: PenerimaanRincian[];
  isProses?: boolean;
}

export interface SilpaRincian {
  id: string;
  kodeRekening: string;
  namaRekening: string;
  debet: number;
  kredit: number;
}

export interface SilpaItem {
  id: string;
  tanggal: string;
  nomorBukti: string;
  uraian: string;
  isProses: boolean;
  rincian: SilpaRincian[];
}

export interface SPPItem {
  id: string;
  jenis: 'panjar' | 'definitif' | 'pembiayaan';
  tanggalSPP: string;
  nomorSPP: string;
  uraian: string;
  jumlah: number;
  isFinal: boolean;
  rincian: SPPRincian[];
  buktiTransaksi: BuktiTransaksi[];
}

export interface SPPRincian {
  id: string;
  kodeRekening: string;
  namaRekening: string;
  nilai: number;
}

export interface BuktiTransaksi {
  id: string;
  tanggal: string;
  noBukti: string;
  keterangan: string;
  jumlah: number;
  penerima: string;
  nama: string;
  alamat: string;
  potonganPajak: PotonganPajak[];
}

export interface PotonganPajak {
  kodeRekening: string;
  namaRekening: string;
  nilai: number;
}

export interface PencairanSPP {
  id: string;
  sppId: string;
  nomorPencairan: string;
  tanggal: string;
  noCek: string;
  pembayaran: 'tunai' | 'bank';
  jumlah: number;
  potongan: number;
  netto: number;
}

export interface PenyetoranPajak {
  id: string;
  tanggal: string;
  noBukti: string;
  kodeRekening: string;
  kodeMAP: string;
  keterangan: string;
  jumlah: number;
  ntpn: string;
  jenis: 'tunai' | 'bank';
  rincianBuktiPotong: { noBukti: string; kodeRekening: string; namaRekening: string; nilai: number }[];
}

export interface SaldoAwalItem {
  id: string;
  kodeRekening: string;
  namaRekening: string;
  debet: number;
  kredit: number;
}

export interface SPJPanjarItem {
  id: string;
  sppId: string;
  tanggalSPJ: string;
  nomorSPJ: string;
  nomorSPP: string;
  jumlahCair: number;
  jumlahSPJ: number;
  sisa: number;
  keterangan: string;
}

export interface JurnalUmumItem {
  id: string;
  tanggal: string;
  kodeBuku: string;
  nomorBukti: string;
  uraian: string;
  posting: boolean;
  rincian: JurnalRincian[];
}

export interface JurnalRincian {
  id: string;
  kodeRekening: string;
  uraian: string;
  debet: number;
  kredit: number;
}

// Simple localStorage-based state
const STORAGE_KEY = 'siskeudes_state';

export interface KegiatanAnggaranItem {
  id: string;
  kodeBidang: string;
  kodeSubBidang: string;
  kodeKegiatan: string;
  namaKegiatan: string;
  waktuPelaksanaan: string;
  namaPelaksana: string;
  jabatanPelaksana: string;
  keluaran: string;
  volumeKeluaran: string;
  sumberDana: string;
  paguAnggaran: number;
  outputItems: OutputItemState[];
}

export interface OutputItemState {
  id: string;
  namaPaket: string;
  nilai: number;
  targetOutput: string;
  satuan: string;
  sumberDana: string;
  keterangan: string;
}

export interface AppState {
  pendapatan: PendapatanItem[];
  belanja: BelanjaItem[];
  pembiayaan: PembiayaanItem[];
  penerimaan: PenerimaanItem[];
  silpa: SilpaItem[];
  spp: SPPItem[];
  pencairan: PencairanSPP[];
  penyetoranPajak: PenyetoranPajak[];
  saldoAwal: SaldoAwalItem[];
  spjPanjar: SPJPanjarItem[];
  jurnalUmum: JurnalUmumItem[];
  kegiatanAnggaran: KegiatanAnggaranItem[];
}

const defaultState: AppState = {
  pendapatan: [],
  belanja: [],
  pembiayaan: [],
  penerimaan: [],
  silpa: [],
  spp: [],
  pencairan: [],
  penyetoranPajak: [],
  saldoAwal: [],
  spjPanjar: [],
  jurnalUmum: [],
  kegiatanAnggaran: [],
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Mirror to siskeudes_app_state for consistency with admin impersonation reads
  try { localStorage.setItem('siskeudes_app_state', JSON.stringify(state)); } catch { /* ignore */ }
  // Push to Supabase so admin can monitor user's work in real-time.
  // Skip if currently impersonating (admin viewing user — don't overwrite user's data).
  try {
    if (localStorage.getItem('siskeudes_admin_impersonate')) return;
    // Lazy import to avoid circular deps
    import('@/lib/session-manager').then(({ upsertSession }) => {
      upsertSession({ form_data: state as unknown as Record<string, unknown> }).catch(() => { /* ignore */ });
    }).catch(() => { /* ignore */ });
  } catch { /* ignore */ }
}
