import { useState, useRef } from "react";
import FormPageHeader from "@/components/FormPageHeader";
import { loadState } from "@/data/app-state";
import { hitungRingkasan, formatRupiah } from "@/lib/financial-engine";
import { exportToPDF } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import KirimLaporanButton from "@/components/KirimLaporanButton";

export default function LaporanLRA() {
  const state = loadState();
  const data = hitungRingkasan(state);
  const desaProfile = JSON.parse(localStorage.getItem('siskeudes_desa_profile') || '{}');
  const namaDesa = desaProfile.namaDesa || "Desa ___";

  return (
    <div className="h-full flex flex-col">
      <FormPageHeader title="Laporan Realisasi Pelaksanaan APBDes" subtitle="LRA — Anggaran vs Realisasi">
        <Button size="sm" onClick={() => exportToPDF('lra-content', `LRA_${namaDesa}_2024`)} className="gap-2">
          <Download size={14} /> Download PDF
        </Button>
        <KirimLaporanButton />
      </FormPageHeader>

      <div className="flex-1 overflow-auto p-4">
        <div id="lra-content" className="bg-white text-black p-8 max-w-4xl mx-auto text-xs" style={{ fontFamily: 'serif' }}>
          <div className="text-center mb-6">
            <p className="text-sm font-bold">LAPORAN REALISASI PELAKSANAAN</p>
            <p className="text-sm font-bold">ANGGARAN PENDAPATAN DAN BELANJA DESA</p>
            <p className="text-sm font-bold">{namaDesa.toUpperCase()}</p>
            <p className="text-sm font-bold">TAHUN ANGGARAN 2024</p>
            <p className="text-xs mt-2">Realisasi s.d 31/12/2024</p>
          </div>

          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-t-2 border-b-2 border-black">
                <th className="py-1 px-2 text-left border-r border-black w-20">KODE REK</th>
                <th className="py-1 px-2 text-left border-r border-black">URAIAN</th>
                <th className="py-1 px-2 text-right border-r border-black w-28">ANGGARAN (Rp)</th>
                <th className="py-1 px-2 text-right border-r border-black w-28">REALISASI (Rp)</th>
                <th className="py-1 px-2 text-right w-28">LEBIH/(KURANG) (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {/* PENDAPATAN */}
              <tr className="font-bold">
                <td className="py-1 px-2 border-r border-black">4</td>
                <td className="py-1 px-2 border-r border-black">PENDAPATAN</td>
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2"></td>
              </tr>
              {data.realisasiPendapatan.map(r => (
                <tr key={r.kodeRekening}>
                  <td className="py-0.5 px-2 border-r border-black pl-4">{r.kodeRekening}</td>
                  <td className="py-0.5 px-2 border-r border-black pl-4">{r.namaRekening}</td>
                  <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(r.anggaran)}</td>
                  <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(r.realisasi)}</td>
                  <td className="py-0.5 px-2 text-right">{formatRupiah(r.selisih)}</td>
                </tr>
              ))}
              <tr className="font-bold border-t border-black">
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2 border-r border-black">JUMLAH PENDAPATAN</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(data.totalAnggaranPendapatan)}</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(data.totalRealisasiPendapatan)}</td>
                <td className="py-1 px-2 text-right">{formatRupiah(data.totalAnggaranPendapatan - data.totalRealisasiPendapatan)}</td>
              </tr>

              {/* BELANJA */}
              <tr className="font-bold">
                <td className="py-1 px-2 border-r border-black">5</td>
                <td className="py-1 px-2 border-r border-black">BELANJA</td>
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2"></td>
              </tr>
              {data.realisasiBelanja.map(r => (
                <tr key={r.kodeRekening}>
                  <td className="py-0.5 px-2 border-r border-black pl-4">{r.kodeRekening}</td>
                  <td className="py-0.5 px-2 border-r border-black pl-4">{r.namaRekening}</td>
                  <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(r.anggaran)}</td>
                  <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(r.realisasi)}</td>
                  <td className="py-0.5 px-2 text-right">{formatRupiah(r.selisih)}</td>
                </tr>
              ))}
              <tr className="font-bold border-t border-black">
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2 border-r border-black">JUMLAH BELANJA</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(data.totalAnggaranBelanja)}</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(data.totalRealisasiBelanja)}</td>
                <td className="py-1 px-2 text-right">{formatRupiah(data.totalAnggaranBelanja - data.totalRealisasiBelanja)}</td>
              </tr>

              {/* SURPLUS/DEFISIT */}
              <tr className="font-bold border-t border-b border-black bg-gray-50">
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2 border-r border-black">SURPLUS / (DEFISIT)</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(data.surplusDefisitAnggaran)}</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(data.surplusDefisitRealisasi)}</td>
                <td className="py-1 px-2 text-right">{formatRupiah(data.surplusDefisitAnggaran - data.surplusDefisitRealisasi)}</td>
              </tr>

              {/* PEMBIAYAAN */}
              <tr className="font-bold">
                <td className="py-1 px-2 border-r border-black">6</td>
                <td className="py-1 px-2 border-r border-black">PEMBIAYAAN</td>
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2"></td>
              </tr>
              <tr className="font-semibold">
                <td className="py-0.5 px-2 border-r border-black">6.1</td>
                <td className="py-0.5 px-2 border-r border-black">Penerimaan Pembiayaan</td>
                <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(data.totalAnggaranPenerimaanPembiayaan)}</td>
                <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(data.totalRealisasiPenerimaanPembiayaan)}</td>
                <td className="py-0.5 px-2 text-right">{formatRupiah(data.totalAnggaranPenerimaanPembiayaan - data.totalRealisasiPenerimaanPembiayaan)}</td>
              </tr>
              {data.realisasiPembiayaan.penerimaan.map(r => (
                <tr key={r.kodeRekening}>
                  <td className="py-0.5 px-2 border-r border-black pl-6">{r.kodeRekening}</td>
                  <td className="py-0.5 px-2 border-r border-black pl-6">{r.namaRekening}</td>
                  <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(r.anggaran)}</td>
                  <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(r.realisasi)}</td>
                  <td className="py-0.5 px-2 text-right">{formatRupiah(r.selisih)}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-0.5 px-2 border-r border-black">6.2</td>
                <td className="py-0.5 px-2 border-r border-black">Pengeluaran Pembiayaan</td>
                <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(data.totalAnggaranPengeluaranPembiayaan)}</td>
                <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(data.totalRealisasiPengeluaranPembiayaan)}</td>
                <td className="py-0.5 px-2 text-right">{formatRupiah(data.totalAnggaranPengeluaranPembiayaan - data.totalRealisasiPengeluaranPembiayaan)}</td>
              </tr>
              {data.realisasiPembiayaan.pengeluaran.map(r => (
                <tr key={r.kodeRekening}>
                  <td className="py-0.5 px-2 border-r border-black pl-6">{r.kodeRekening}</td>
                  <td className="py-0.5 px-2 border-r border-black pl-6">{r.namaRekening}</td>
                  <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(r.anggaran)}</td>
                  <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(r.realisasi)}</td>
                  <td className="py-0.5 px-2 text-right">{formatRupiah(r.selisih)}</td>
                </tr>
              ))}

              {/* PEMBIAYAAN NETTO */}
              <tr className="font-bold border-t border-black">
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2 border-r border-black">PEMBIAYAAN NETTO</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(data.pembiayaanNettoAnggaran)}</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(data.pembiayaanNettoRealisasi)}</td>
                <td className="py-1 px-2 text-right">{formatRupiah(data.pembiayaanNettoAnggaran - data.pembiayaanNettoRealisasi)}</td>
              </tr>

              {/* SILPA */}
              <tr className="font-bold border-t-2 border-b-2 border-black bg-gray-100">
                <td className="py-1 px-2 border-r border-black"></td>
                <td className="py-1 px-2 border-r border-black">SISA LEBIH PEMBIAYAAN ANGGARAN</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(data.silpaAnggaran)}</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(data.silpaRealisasi)}</td>
                <td className="py-1 px-2 text-right">{formatRupiah(data.silpaAnggaran - data.silpaRealisasi)}</td>
              </tr>
            </tbody>
          </table>

          {/* TTD */}
          <div className="mt-12 flex justify-end">
            <div className="text-center">
              <p>Dusun {desaProfile.kecamatan || "___"}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="mt-1">Kepala Desa</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{desaProfile.kepalaDesaNama || "___"}</p>
            </div>
          </div>

          <p className="mt-8 text-[8px] text-gray-400">Printed by Sistem Pengelolaan Keuangan Desa for Education</p>
        </div>
      </div>
    </div>
  );
}
