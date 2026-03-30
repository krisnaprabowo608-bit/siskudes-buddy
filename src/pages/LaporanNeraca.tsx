import { loadState } from "@/data/app-state";
import FormPageHeader from "@/components/FormPageHeader";
import { generateNeraca, formatRupiah } from "@/lib/financial-engine";
import { exportToPDF } from "@/lib/pdf-export";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import KirimLaporanButton from "@/components/KirimLaporanButton";

export default function LaporanNeraca() {
  const state = loadState();
  const neracaItems = generateNeraca(state);
  const desaProfile = JSON.parse(localStorage.getItem('siskeudes_desa_profile') || '{}');
  const namaDesa = desaProfile.namaDesa || "Desa ___";

  // Split into Aset, Kewajiban, Ekuitas
  const asetItems = neracaItems.filter(n => {
    const kode = n.kode;
    return kode.startsWith('1');
  });
  const kewajibanItems = neracaItems.filter(n => n.kode.startsWith('2'));
  const ekuitasItems = neracaItems.filter(n => n.kode.startsWith('3'));

  const totalAset = asetItems.filter(n => n.level === 1).reduce((s, n) => s + n.nilaiTahunIni, 0);
  const totalAsetLalu = asetItems.filter(n => n.level === 1).reduce((s, n) => s + n.nilaiTahunLalu, 0);
  const totalKewajiban = kewajibanItems.filter(n => n.level === 1).reduce((s, n) => s + n.nilaiTahunIni, 0);
  const totalKewajibanLalu = kewajibanItems.filter(n => n.level === 1).reduce((s, n) => s + n.nilaiTahunLalu, 0);
  const totalEkuitas = ekuitasItems.filter(n => n.level === 1).reduce((s, n) => s + n.nilaiTahunIni, 0);
  const totalEkuitasLalu = ekuitasItems.filter(n => n.level === 1).reduce((s, n) => s + n.nilaiTahunLalu, 0);

  const renderSection = (items: typeof neracaItems, title: string) => (
    <>
      {items.map(item => (
        <tr key={item.kode} className={item.level === 0 ? 'font-bold' : item.level === 1 ? 'font-semibold' : ''}>
          <td className={`py-0.5 px-2 border-r border-black ${item.level === 3 ? 'pl-8' : item.level === 2 ? 'pl-5' : item.level === 1 ? 'pl-3' : ''}`}>
            {item.kode}
          </td>
          <td className={`py-0.5 px-2 border-r border-black ${item.level === 3 ? 'pl-6' : item.level === 2 ? 'pl-3' : ''}`}>
            {item.uraian}
          </td>
          <td className="py-0.5 px-2 text-right border-r border-black">
            {item.level <= 1 ? '' : formatRupiah(item.nilaiTahunIni)}
          </td>
          <td className="py-0.5 px-2 text-right">
            {item.level <= 1 ? '' : formatRupiah(item.nilaiTahunLalu)}
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="h-full flex flex-col">
      <FormPageHeader title="Laporan Kekayaan Milik Desa" subtitle="Neraca — Aset, Kewajiban, Ekuitas">
        <Button size="sm" onClick={() => exportToPDF('neraca-content', `Neraca_${namaDesa}_2024`)} className="gap-2">
          <Download size={14} /> Download PDF
        </Button>
      </FormPageHeader>

      <div className="flex-1 overflow-auto p-4">
        <div id="neraca-content" className="bg-white text-black p-8 max-w-4xl mx-auto text-xs" style={{ fontFamily: 'serif' }}>
          <div className="text-center mb-6">
            <p className="text-sm font-bold">{namaDesa.toUpperCase()}</p>
            <p className="text-sm font-bold">LAPORAN KEKAYAAN MILIK DESA</p>
            <p className="text-sm font-bold">SAMPAI DENGAN 31 DECEMBER 2024</p>
          </div>

          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-t-2 border-b-2 border-black">
                <th className="py-1 px-2 text-left border-r border-black w-24">KODE</th>
                <th className="py-1 px-2 text-left border-r border-black">URAIAN</th>
                <th className="py-1 px-2 text-right border-r border-black w-32">TAHUN 2024 (Rp)</th>
                <th className="py-1 px-2 text-right w-32">TAHUN 2023 (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {renderSection(asetItems, "ASET")}
              
              {/* Jumlah per level 1 */}
              {asetItems.filter(a => a.level === 1).map(a => (
                <tr key={`jml-${a.kode}`} className="font-semibold border-t border-black">
                  <td className="py-0.5 px-2 border-r border-black" colSpan={2}>Jumlah {a.uraian}</td>
                  <td className="py-0.5 px-2 text-right border-r border-black">{formatRupiah(a.nilaiTahunIni)}</td>
                  <td className="py-0.5 px-2 text-right">{formatRupiah(a.nilaiTahunLalu)}</td>
                </tr>
              ))}
              
              <tr className="font-bold border-t-2 border-b border-black bg-gray-50">
                <td className="py-1 px-2 border-r border-black" colSpan={2}>JUMLAH ASET</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(totalAset)}</td>
                <td className="py-1 px-2 text-right">{formatRupiah(totalAsetLalu)}</td>
              </tr>

              {renderSection(kewajibanItems, "KEWAJIBAN")}
              <tr className="font-bold border-t border-black">
                <td className="py-1 px-2 border-r border-black" colSpan={2}>JUMLAH KEWAJIBAN</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(totalKewajiban)}</td>
                <td className="py-1 px-2 text-right">{formatRupiah(totalKewajibanLalu)}</td>
              </tr>

              {renderSection(ekuitasItems, "EKUITAS")}
              <tr className="font-bold border-t border-black">
                <td className="py-1 px-2 border-r border-black" colSpan={2}>JUMLAH EKUITAS</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(totalEkuitas)}</td>
                <td className="py-1 px-2 text-right">{formatRupiah(totalEkuitasLalu)}</td>
              </tr>

              <tr className="font-bold border-t-2 border-b-2 border-black bg-gray-100">
                <td className="py-1 px-2 border-r border-black" colSpan={2}>JUMLAH KEWAJIBAN DAN EKUITAS</td>
                <td className="py-1 px-2 text-right border-r border-black">{formatRupiah(totalKewajiban + totalEkuitas)}</td>
                <td className="py-1 px-2 text-right">{formatRupiah(totalKewajibanLalu + totalEkuitasLalu)}</td>
              </tr>
            </tbody>
          </table>

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
