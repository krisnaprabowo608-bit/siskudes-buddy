import { loadState } from "@/data/app-state";
import FormPageHeader from "@/components/FormPageHeader";
import { generateBKU, formatRupiah } from "@/lib/financial-engine";
import { exportToPDF } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function LaporanBKU() {
  const state = loadState();
  const bkuEntries = generateBKU(state);
  const desaProfile = JSON.parse(localStorage.getItem('siskeudes_desa_profile') || '{}');
  const namaDesa = desaProfile.namaDesa || "Desa ___";

  const totalPenerimaan = bkuEntries.reduce((s, e) => s + e.penerimaan, 0);
  const totalPengeluaran = bkuEntries.reduce((s, e) => s + e.pengeluaran, 0);
  const lastSaldo = bkuEntries.length > 0 ? bkuEntries[bkuEntries.length - 1].saldo : 0;

  // Hitung saldo tunai dan bank
  const saldoTunai = state.saldoAwal
    .filter(s => s.kodeRekening === '1.1.1.01')
    .reduce((s, i) => s + i.debet, 0)
    + state.penerimaan.filter(p => p.jenis === 'tunai').reduce((s, p) => s + p.jumlah, 0)
    - state.pencairan.filter(p => p.pembayaran === 'tunai').reduce((s, p) => s + p.jumlah, 0);

  const saldoBank = lastSaldo - saldoTunai;

  return (
    <div className="h-full flex flex-col">
      <FormPageHeader title="Buku Kas Umum" subtitle="BKU — Seluruh transaksi tahun berjalan">
        <Button size="sm" onClick={() => exportToPDF('bku-content', `BKU_${namaDesa}_2024`)} className="gap-2">
          <Download size={14} /> Download PDF
        </Button>
      </FormPageHeader>

      <div className="flex-1 overflow-auto p-4">
        <div id="bku-content" className="bg-white text-black p-8 max-w-5xl mx-auto text-xs" style={{ fontFamily: 'serif' }}>
          <div className="text-center mb-4">
            <p className="text-sm font-bold">BUKU KAS UMUM</p>
            <p className="text-sm font-bold">{namaDesa.toUpperCase()}</p>
            <p className="text-sm font-bold">TAHUN ANGGARAN 2024</p>
            {desaProfile.kecamatan && <p className="text-xs">KECAMATAN {desaProfile.kecamatan.toUpperCase()}</p>}
            {desaProfile.kabupaten && <p className="text-xs">{desaProfile.kabupaten.toUpperCase()}</p>}
          </div>
          <p className="text-xs mb-2">Periode 01/01/2024 s.d 31/12/2024</p>

          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="border-t-2 border-b-2 border-black">
                <th className="py-1 px-1 text-center border-r border-black w-8">No.</th>
                <th className="py-1 px-1 text-left border-r border-black w-20">Tanggal</th>
                <th className="py-1 px-1 text-left border-r border-black w-20">Kode Rek</th>
                <th className="py-1 px-1 text-left border-r border-black">Uraian</th>
                <th className="py-1 px-1 text-right border-r border-black w-24">Penerimaan (Rp)</th>
                <th className="py-1 px-1 text-right border-r border-black w-24">Pengeluaran (Rp)</th>
                <th className="py-1 px-1 text-left border-r border-black w-28">No. Bukti</th>
                <th className="py-1 px-1 text-right border-r border-black w-24">Netto (Rp)</th>
                <th className="py-1 px-1 text-right w-24">Saldo (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {bkuEntries.map((e, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="py-0.5 px-1 text-center border-r border-black">{e.no}</td>
                  <td className="py-0.5 px-1 border-r border-black">{e.tanggal}</td>
                  <td className="py-0.5 px-1 border-r border-black">{e.kodeRekening}</td>
                  <td className="py-0.5 px-1 border-r border-black whitespace-pre-line">{e.uraian}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(e.penerimaan)}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(e.pengeluaran)}</td>
                  <td className="py-0.5 px-1 border-r border-black text-[8px]">{e.noBukti}</td>
                  <td className="py-0.5 px-1 text-right border-r border-black">{formatRupiah(e.netto)}</td>
                  <td className="py-0.5 px-1 text-right">{formatRupiah(e.saldo)}</td>
                </tr>
              ))}

              {/* JUMLAH */}
              <tr className="font-bold border-t-2 border-b-2 border-black">
                <td className="py-1 px-1 text-center border-r border-black" colSpan={4}>JUMLAH</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(totalPenerimaan)}</td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(totalPengeluaran)}</td>
                <td className="py-1 px-1 border-r border-black"></td>
                <td className="py-1 px-1 text-right border-r border-black">{formatRupiah(totalPenerimaan - totalPengeluaran)}</td>
                <td className="py-1 px-1 text-right"></td>
              </tr>
            </tbody>
          </table>

          {/* Saldo breakdown */}
          <div className="mt-4 text-[10px]">
            <p>Saldo Kas per tanggal 31 December 2024 senilai Rp {formatRupiah(lastSaldo)}</p>
            <p className="mt-1">Terdiri dari:</p>
            <table className="ml-4 mt-1">
              <tbody>
                <tr><td className="pr-4">a. Tunai</td><td className="text-right">Rp {formatRupiah(Math.max(saldoTunai, 0))}</td></tr>
                <tr><td className="pr-4">b. Bank</td><td className="text-right">Rp {formatRupiah(Math.max(saldoBank, 0))}</td></tr>
                <tr className="font-bold"><td className="pr-4">Jumlah</td><td className="text-right">Rp {formatRupiah(lastSaldo)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* TTD */}
          <div className="mt-8 flex justify-between text-[10px]">
            <div className="text-center">
              <p>Diverifikasi Oleh,</p>
              <p>Sekretaris Desa</p>
              <div className="h-12"></div>
              <p className="font-bold underline">{desaProfile.sekretarisNama || "___"}</p>
              <p className="mt-4">Kaur Keuangan</p>
              <div className="h-12"></div>
              <p className="font-bold underline">{desaProfile.bendaharaNama || "___"}</p>
            </div>
            <div className="text-center">
              <p>Dusun {desaProfile.kecamatan || "___"}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p>Disetujui oleh,</p>
              <p>Kepala Desa</p>
              <div className="h-12"></div>
              <p className="font-bold underline">{desaProfile.kepalaDesaNama || "___"}</p>
            </div>
          </div>
          <p className="mt-8 text-[8px] text-gray-400">Printed by Sistem Pengelolaan Keuangan Desa for Education</p>
        </div>
      </div>
    </div>
  );
}
