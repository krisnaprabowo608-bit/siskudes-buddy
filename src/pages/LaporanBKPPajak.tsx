import { loadState } from "@/data/app-state";
import FormPageHeader from "@/components/FormPageHeader";
import { generateBKPPajak, formatRupiah } from "@/lib/financial-engine";
import { exportToPDF } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function LaporanBKPPajak() {
  const state = loadState();
  const entries = generateBKPPajak(state);
  const desaProfile = JSON.parse(localStorage.getItem('siskeudes_desa_profile') || '{}');
  const namaDesa = desaProfile.namaDesa || "Desa ___";

  const totalPemotongan = entries.reduce((s, e) => s + e.pemotongan, 0);
  const totalPenyetoran = entries.reduce((s, e) => s + e.penyetoran, 0);
  const lastSaldo = entries.length > 0 ? entries[entries.length - 1].saldo : 0;

  return (
    <div className="h-full flex flex-col">
      <FormPageHeader title="Buku Kas Pembantu Pajak" subtitle="BKP Pajak — Pemotongan dan Penyetoran">
        <Button size="sm" onClick={() => exportToPDF('bkp-pajak-content', `BKP_Pajak_${namaDesa}_2024`)} className="gap-2">
          <Download size={14} /> Download PDF
        </Button>
      </FormPageHeader>

      <div className="flex-1 overflow-auto p-4">
        <div id="bkp-pajak-content" className="bg-white text-black p-8 max-w-4xl mx-auto text-xs" style={{ fontFamily: 'serif' }}>
          <div className="text-center mb-4">
            <p className="text-sm font-bold">BUKU KAS PEMBANTU PAJAK</p>
            <p className="text-sm font-bold">{namaDesa.toUpperCase()}</p>
            <p className="text-xs">TAHUN ANGGARAN 2024</p>
          </div>
          <p className="text-xs mb-2">Periode 01/01/2024 s.d 31/12/2024</p>

          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-t-2 border-b-2 border-black">
                <th className="py-1 px-2 text-center border-r border-black w-8">No.</th>
                <th className="py-1 px-2 text-left border-r border-black w-20">Tanggal</th>
                <th className="py-1 px-2 text-left border-r border-black">Uraian</th>
                <th className="py-1 px-2 text-right border-r border-black w-24">Pemotongan (Rp)</th>
                <th className="py-1 px-2 text-right border-r border-black w-24">Penyetoran (Rp)</th>
                <th className="py-1 px-2 text-right w-24">Saldo (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-gray-400">Belum ada data pajak</td></tr>
              ) : entries.map((e, i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="py-0.5 px-2 text-center border-r border-black">{e.no}</td>
                  <td className="py-0.5 px-2 border-r border-black">{e.tanggal}</td>
                  <td className="py-0.5 px-2 border-r border-black whitespace-pre-line">
                    <span className="font-mono text-[8px]">{e.noBukti}</span><br/>
                    {e.uraian}<br/>
                    <span className="italic">{e.jenisPajak}</span>
                  </td>
                  <td className="py-0.5 px-2 text-right border-r border-black">{e.pemotongan > 0 ? formatRupiah(e.pemotongan) : ''}</td>
                  <td className="py-0.5 px-2 text-right border-r border-black">{e.penyetoran > 0 ? formatRupiah(e.penyetoran) : ''}</td>
                  <td className="py-0.5 px-2 text-right">{formatRupiah(e.saldo)}</td>
                </tr>
              ))}
              <tr className="font-bold border-t-2 border-b-2 border-black">
                <td className="py-1 px-2 border-r border-black" colSpan={3}>Jumlah</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(totalPemotongan)}</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(totalPenyetoran)}</td>
                <td className="py-1 px-2 text-right">{formatRupiah(lastSaldo)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-12 flex justify-end text-[10px]">
            <div className="text-center">
              <p>Dusun {desaProfile.kecamatan || "___"}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="mt-1">Kaur Keuangan</p>
              <div className="h-16"></div>
              <p className="font-bold underline">{desaProfile.bendaharaNama || "___"}</p>
            </div>
          </div>
          <p className="mt-8 text-[8px] text-gray-400">Printed by Sistem Pengelolaan Keuangan Desa for Education</p>
        </div>
      </div>
    </div>
  );
}
