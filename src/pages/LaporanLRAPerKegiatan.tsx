import { loadState } from "@/data/app-state";
import { hitungRingkasan, formatRupiah } from "@/lib/financial-engine";
import { bidangKegiatanData } from "@/data/siskeudes-data";
import { rekeningData } from "@/data/rekening-data";
import { exportToPDF } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import React from "react";

export default function LaporanLRAPerKegiatan() {
  const state = loadState();
  const data = hitungRingkasan(state);
  const desaProfile = JSON.parse(localStorage.getItem('siskeudes_desa_profile') || '{}');
  const namaDesa = desaProfile.namaDesa || "Desa ___";

  // Build belanja hierarchy: bidang → sub bidang → kegiatan → rekening
  const belanjaByKegiatan = new Map<string, typeof state.belanja>();
  state.belanja.forEach(b => {
    const key = b.kodeKegiatan;
    if (!belanjaByKegiatan.has(key)) belanjaByKegiatan.set(key, []);
    belanjaByKegiatan.get(key)!.push(b);
  });

  // Group by bidang
  const bidangGroups = new Map<string, string[]>();
  state.belanja.forEach(b => {
    if (!bidangGroups.has(b.kodeBidang)) bidangGroups.set(b.kodeBidang, []);
    const kegiatans = bidangGroups.get(b.kodeBidang)!;
    if (!kegiatans.includes(b.kodeKegiatan)) kegiatans.push(b.kodeKegiatan);
  });

  // Get realisasi per rekening from pencairan
  const realisasiPerRekening = new Map<string, number>();
  state.pencairan.forEach(pc => {
    const spp = state.spp.find(s => s.id === pc.sppId);
    if (!spp) return;
    spp.rincian.forEach(r => {
      realisasiPerRekening.set(r.kodeRekening, (realisasiPerRekening.get(r.kodeRekening) || 0) + r.nilai);
    });
  });

  return (
    <div className="h-full flex flex-col">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-heading">LRA DESA PER KEGIATAN</h1>
          <p className="text-xs text-muted-foreground">Realisasi per Bidang, Kegiatan, dan Rekening</p>
        </div>
        <Button size="sm" onClick={() => exportToPDF('lra-kegiatan-content', `LRA_PerKegiatan_${namaDesa}_2024`)} className="gap-2">
          <Download size={14} /> Download PDF
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div id="lra-kegiatan-content" className="bg-white text-black p-8 max-w-5xl mx-auto text-xs" style={{ fontFamily: 'serif' }}>
          <div className="text-center mb-6">
            <p className="text-sm font-bold">LAPORAN REALISASI PELAKSANAAN</p>
            <p className="text-sm font-bold">ANGGARAN PENDAPATAN DAN BELANJA DESA</p>
            <p className="text-sm font-bold">{namaDesa.toUpperCase()}</p>
            <p className="text-sm font-bold">TAHUN ANGGARAN 2024</p>
            <p className="text-xs mt-2">Realisasi s.d 31/12/2024</p>
          </div>

          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="border-t-2 border-b-2 border-black">
                <th className="py-1 px-1 text-left border-r border-black w-28">KODE REK</th>
                <th className="py-1 px-1 text-left border-r border-black">URAIAN</th>
                <th className="py-1 px-1 text-right border-r border-black w-24">ANGGARAN (Rp)</th>
                <th className="py-1 px-1 text-right border-r border-black w-24">REALISASI (Rp)</th>
                <th className="py-1 px-1 text-right w-24">LEBIH/(KURANG)</th>
              </tr>
            </thead>
            <tbody>
              {/* PENDAPATAN section */}
              <tr className="font-bold"><td className="py-1 px-1 border-r border-black">4</td><td className="py-1 px-1 border-r border-black">PENDAPATAN</td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td></tr>
              {data.realisasiPendapatan.map(r => {
                const parentRek = rekeningData.find(x => r.kodeRekening.startsWith(x.kode) && x.level === 2);
                return (
                  <tr key={r.kodeRekening}>
                    <td className="py-0.5 px-1 border-r border-black pl-4">{r.kodeRekening}</td>
                    <td className="py-0.5 px-1 border-r border-black pl-2">{r.namaRekening}</td>
                    <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(r.anggaran)}</td>
                    <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(r.realisasi)}</td>
                    <td className="py-0.5 px-1 text-right">{formatRupiah(r.selisih)}</td>
                  </tr>
                );
              })}
              <tr className="font-bold border-t border-black">
                <td className="py-1 px-1 border-r border-black" colSpan={2}>JUMLAH PENDAPATAN</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.totalAnggaranPendapatan)}</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.totalRealisasiPendapatan)}</td>
                <td className="py-1 px-1 text-right">{formatRupiah(data.totalAnggaranPendapatan - data.totalRealisasiPendapatan)}</td>
              </tr>

              {/* BELANJA per KEGIATAN */}
              <tr className="font-bold"><td className="py-1 px-1 border-r border-black">5</td><td className="py-1 px-1 border-r border-black">BELANJA</td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td></tr>
              
              {Array.from(bidangGroups.entries()).map(([bidangKode, kegiatanList]) => {
                const bidang = bidangKegiatanData.find(b => b.kode === bidangKode);
                const bidangBelanja = state.belanja.filter(b => b.kodeBidang === bidangKode);
                const totalBidangAnggaran = bidangBelanja.reduce((s, b) => s + b.anggaran + b.perubahanAnggaran, 0);
                const totalBidangRealisasi = bidangBelanja.reduce((s, b) => s + (realisasiPerRekening.get(b.kodeRekening) || 0), 0);
                
                return (
                  <React.Fragment key={bidangKode}>
                    <tr className="font-semibold bg-gray-50">
                      <td className="py-0.5 px-1 border-r border-black">{bidangKode}</td>
                      <td className="py-0.5 px-1 border-r border-black">{bidang?.nama}</td>
                      <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(totalBidangAnggaran)}</td>
                      <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(totalBidangRealisasi)}</td>
                      <td className="py-0.5 px-1 text-right">{formatRupiah(totalBidangAnggaran - totalBidangRealisasi)}</td>
                    </tr>
                    {kegiatanList.map(kegKode => {
                      const kegiatan = bidangKegiatanData.find(k => k.kode === kegKode);
                      const items = belanjaByKegiatan.get(kegKode) || [];
                      return (
                        <React.Fragment key={kegKode}>
                          <tr className="font-medium">
                            <td className="py-0.5 px-1 border-r border-black pl-4">{kegKode}</td>
                            <td className="py-0.5 px-1 border-r border-black">{kegiatan?.nama}</td>
                            <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(items.reduce((s, b) => s + b.anggaran + b.perubahanAnggaran, 0))}</td>
                            <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(items.reduce((s, b) => s + (realisasiPerRekening.get(b.kodeRekening) || 0), 0))}</td>
                            <td className="py-0.5 px-1 text-right">{formatRupiah(items.reduce((s, b) => s + b.anggaran + b.perubahanAnggaran - (realisasiPerRekening.get(b.kodeRekening) || 0), 0))}</td>
                          </tr>
                          {items.map(b => {
                            const real = realisasiPerRekening.get(b.kodeRekening) || 0;
                            return (
                              <tr key={b.id}>
                                <td className="py-0.5 px-1 border-r border-black pl-8">{kegKode} {b.kodeRekening}</td>
                                <td className="py-0.5 px-1 border-r border-black pl-4">{b.namaRekening}</td>
                                <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(b.anggaran + b.perubahanAnggaran)}</td>
                                <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(real)}</td>
                                <td className="py-0.5 px-1 text-right">{formatRupiah(b.anggaran + b.perubahanAnggaran - real)}</td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              <tr className="font-bold border-t border-black">
                <td className="py-1 px-1 border-r border-black" colSpan={2}>JUMLAH BELANJA</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.totalAnggaranBelanja)}</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.totalRealisasiBelanja)}</td>
                <td className="py-1 px-1 text-right">{formatRupiah(data.totalAnggaranBelanja - data.totalRealisasiBelanja)}</td>
              </tr>

              {/* SURPLUS/DEFISIT */}
              <tr className="font-bold border-t border-b border-black bg-gray-50">
                <td className="py-1 px-1 border-r border-black" colSpan={2}>SURPLUS / (DEFISIT)</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.surplusDefisitAnggaran)}</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.surplusDefisitRealisasi)}</td>
                <td className="py-1 px-1 text-right">{formatRupiah(data.surplusDefisitAnggaran - data.surplusDefisitRealisasi)}</td>
              </tr>

              {/* PEMBIAYAAN */}
              <tr className="font-bold"><td className="py-1 px-1 border-r border-black">6</td><td className="py-1 px-1 border-r border-black">PEMBIAYAAN</td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td></tr>
              {data.realisasiPembiayaan.penerimaan.map(r => (
                <tr key={r.kodeRekening}>
                  <td className="py-0.5 px-1 border-r border-black pl-4">{r.kodeRekening}</td>
                  <td className="py-0.5 px-1 border-r border-black">{r.namaRekening}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(r.anggaran)}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(r.realisasi)}</td>
                  <td className="py-0.5 px-1 text-right">{formatRupiah(r.selisih)}</td>
                </tr>
              ))}
              {data.realisasiPembiayaan.pengeluaran.map(r => (
                <tr key={r.kodeRekening}>
                  <td className="py-0.5 px-1 border-r border-black pl-4">{r.kodeRekening}</td>
                  <td className="py-0.5 px-1 border-r border-black">{r.namaRekening}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(r.anggaran)}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(r.realisasi)}</td>
                  <td className="py-0.5 px-1 text-right">{formatRupiah(r.selisih)}</td>
                </tr>
              ))}
              <tr className="font-bold border-t border-black">
                <td className="py-1 px-1 border-r border-black" colSpan={2}>PEMBIAYAAN NETTO</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.pembiayaanNettoAnggaran)}</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.pembiayaanNettoRealisasi)}</td>
                <td className="py-1 px-1 text-right">{formatRupiah(data.pembiayaanNettoAnggaran - data.pembiayaanNettoRealisasi)}</td>
              </tr>
              <tr className="font-bold border-t-2 border-b-2 border-black bg-gray-100">
                <td className="py-1 px-1 border-r border-black" colSpan={2}>SILPA/SiLPA TAHUN BERJALAN</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.silpaAnggaran)}</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(data.silpaRealisasi)}</td>
                <td className="py-1 px-1 text-right">{formatRupiah(data.silpaAnggaran - data.silpaRealisasi)}</td>
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
