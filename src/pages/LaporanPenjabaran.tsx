import { loadState } from "@/data/app-state";
import FormPageHeader from "@/components/FormPageHeader";
import { formatRupiah, hitungRingkasan } from "@/lib/financial-engine";
import { bidangKegiatanData } from "@/data/siskeudes-data";
import { exportToPDF } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import KirimLaporanButton from "@/components/KirimLaporanButton";

export default function LaporanPenjabaran() {
  const state = loadState();
  const data = hitungRingkasan(state);
  const desaProfile = JSON.parse(localStorage.getItem('siskeudes_desa_profile') || '{}');
  const namaDesa = desaProfile.namaDesa || "Desa ___";

  // Group belanja by bidang → kegiatan → rekening  
  const belanjaByBidang = new Map<string, typeof state.belanja>();
  state.belanja.forEach(b => {
    const key = b.kodeBidang;
    if (!belanjaByBidang.has(key)) belanjaByBidang.set(key, []);
    belanjaByBidang.get(key)!.push(b);
  });

  return (
    <div className="h-full flex flex-col">
      <FormPageHeader title="Penjabaran APBDes" subtitle="Rincian Anggaran per Bidang dan Kegiatan">
        <Button size="sm" onClick={() => exportToPDF('penjabaran-content', `Penjabaran_APBDes_${namaDesa}_2024`)} className="gap-2">
          <Download size={14} /> Download PDF
        </Button>
      </FormPageHeader>

      <div className="flex-1 overflow-auto p-4">
        <div id="penjabaran-content" className="bg-white text-black p-8 max-w-5xl mx-auto text-xs" style={{ fontFamily: 'serif' }}>
          <div className="text-center mb-4">
            <p className="text-[10px]">Lampiran Peraturan Kepala Desa</p>
            <p className="text-sm font-bold mt-2">PENJABARAN ANGGARAN PENDAPATAN DAN BELANJA DESA</p>
            <p className="text-sm font-bold">{namaDesa.toUpperCase()}</p>
            <p className="text-sm font-bold">TAHUN ANGGARAN 2024</p>
          </div>

          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="border-t-2 border-b-2 border-black">
                <th className="py-1 px-1 text-left border-r border-black w-24">KODE REK</th>
                <th className="py-1 px-1 text-left border-r border-black">URAIAN</th>
                <th className="py-1 px-1 text-right border-r border-black w-24">ANGGARAN (Rp)</th>
                <th className="py-1 px-1 text-right border-r border-black w-24">PERUBAHAN (Rp)</th>
                <th className="py-1 px-1 text-right border-r border-black w-24">SETELAH PAK (Rp)</th>
                <th className="py-1 px-1 text-left w-12">SUMBER</th>
              </tr>
            </thead>
            <tbody>
              {/* PENDAPATAN */}
              <tr className="font-bold"><td className="py-1 px-1 border-r border-black" colSpan={2}>1. PENDAPATAN</td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td></tr>
              {data.realisasiPendapatan.map(r => (
                <tr key={r.kodeRekening}>
                  <td className="py-0.5 px-1 border-r border-black pl-4">{r.kodeRekening}</td>
                  <td className="py-0.5 px-1 border-r border-black">{r.namaRekening}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(r.anggaran - r.anggaranPAK)}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(r.anggaranPAK)}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(r.anggaran)}</td>
                  <td className="py-0.5 px-1">{state.pendapatan.find(p => p.kodeRekening === r.kodeRekening)?.sumberDana || ''}</td>
                </tr>
              ))}
              <tr className="font-bold border-t border-black">
                <td className="py-1 px-1 border-r border-black" colSpan={2}>JUMLAH PENDAPATAN</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.totalAnggaranPendapatan - data.realisasiPendapatan.reduce((s, r) => s + r.anggaranPAK, 0))}</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.realisasiPendapatan.reduce((s, r) => s + r.anggaranPAK, 0))}</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.totalAnggaranPendapatan)}</td>
                <td></td>
              </tr>

              {/* BELANJA */}
              <tr className="font-bold"><td className="py-1 px-1 border-r border-black" colSpan={2}>2. BELANJA</td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td></tr>
              {Array.from(belanjaByBidang.entries()).map(([bidangKode, items]) => {
                const bidang = bidangKegiatanData.find(b => b.kode === bidangKode);
                const totalBidang = items.reduce((s, b) => s + b.anggaran + b.perubahanAnggaran, 0);
                return (
                  <React.Fragment key={bidangKode}>
                    <tr className="font-semibold bg-gray-50">
                      <td className="py-0.5 px-1 border-r border-black pl-2">{bidangKode}</td>
                      <td className="py-0.5 px-1 border-r border-black">{bidang?.nama || bidangKode}</td>
                      <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(items.reduce((s, b) => s + b.anggaran, 0))}</td>
                      <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(items.reduce((s, b) => s + b.perubahanAnggaran, 0))}</td>
                      <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(totalBidang)}</td>
                      <td></td>
                    </tr>
                    {items.map(b => (
                      <tr key={b.id}>
                        <td className="py-0.5 px-1 border-r border-black pl-6">{b.kodeRekening}</td>
                        <td className="py-0.5 px-1 border-r border-black pl-4">{b.uraian || b.namaRekening}</td>
                        <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(b.anggaran)}</td>
                        <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(b.perubahanAnggaran)}</td>
                        <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(b.anggaran + b.perubahanAnggaran)}</td>
                        <td className="py-0.5 px-1">{b.sumberDana}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
              <tr className="font-bold border-t border-black">
                <td className="py-1 px-1 border-r border-black" colSpan={2}>JUMLAH BELANJA</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(state.belanja.reduce((s, b) => s + b.anggaran, 0))}</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(state.belanja.reduce((s, b) => s + b.perubahanAnggaran, 0))}</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.totalAnggaranBelanja)}</td>
                <td></td>
              </tr>

              {/* SURPLUS/DEFISIT */}
              <tr className="font-bold border-t border-b border-black bg-gray-50">
                <td className="py-1 px-1 border-r border-black" colSpan={2}>SURPLUS / (DEFISIT)</td>
                <td className="py-1 px-1 text-right border-r border-black" colSpan={3}>{formatRupiah(data.surplusDefisitAnggaran)}</td>
                <td></td>
              </tr>

              {/* PEMBIAYAAN */}
              <tr className="font-bold"><td className="py-1 px-1 border-r border-black" colSpan={2}>3. PEMBIAYAAN</td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td></tr>
              {data.realisasiPembiayaan.penerimaan.map(r => (
                <tr key={r.kodeRekening}>
                  <td className="py-0.5 px-1 border-r border-black pl-4">{r.kodeRekening}</td>
                  <td className="py-0.5 px-1 border-r border-black">{r.namaRekening}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black" colSpan={2}>{formatRupiah(r.anggaran)}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(r.anggaran)}</td>
                  <td></td>
                </tr>
              ))}
              {data.realisasiPembiayaan.pengeluaran.map(r => (
                <tr key={r.kodeRekening}>
                  <td className="py-0.5 px-1 border-r border-black pl-4">{r.kodeRekening}</td>
                  <td className="py-0.5 px-1 border-r border-black">{r.namaRekening}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black" colSpan={2}>{formatRupiah(r.anggaran)}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(r.anggaran)}</td>
                  <td></td>
                </tr>
              ))}

              <tr className="font-bold border-t border-black">
                <td className="py-1 px-1 border-r border-black" colSpan={2}>PEMBIAYAAN NETTO</td>
                <td className="py-1 px-1 text-right border-r border-black" colSpan={3}>{formatRupiah(data.pembiayaanNettoAnggaran)}</td>
                <td></td>
              </tr>
              <tr className="font-bold border-t-2 border-b-2 border-black bg-gray-100">
                <td className="py-1 px-1 border-r border-black" colSpan={2}>SISA LEBIH / (KURANG) PEMBIAYAAN ANGGARAN</td>
                <td className="py-1 px-1 text-right border-r border-black" colSpan={3}>{formatRupiah(data.silpaAnggaran)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div className="mt-12 flex justify-end text-[10px]">
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

import React from "react";
