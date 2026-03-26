import { useState } from "react";
import { loadState, saveState, SPPItem } from "@/data/app-state";

export default function SPJKegiatan() {
  const [state, setState] = useState(loadState());
  
  const panjarSPPs = state.spp.filter(s => s.jenis === 'panjar' && s.isFinal);
  const pencairanForSPP = (sppId: string) => state.pencairan.filter(p => p.sppId === sppId);

  return (
    <div className="h-full flex flex-col">
      <div className="page-header">
        <h1 className="text-lg font-bold font-heading">PERTANGGUNGJAWABAN KEGIATAN</h1>
        <p className="text-xs text-muted-foreground">SPJ Uang Muka Panjar</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="content-card">
          <div className="p-3 border-b border-border/60">
            <h2 className="text-sm font-bold font-heading">SPJ UANG MUKA PANJAR</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left border-b border-border/60">No SPP</th>
                  <th className="px-3 py-2 text-left border-b border-border/60">Keterangan</th>
                  <th className="px-3 py-2 text-right border-b border-border/60">Jumlah</th>
                  <th className="px-3 py-2 text-right border-b border-border/60">Dicairkan</th>
                  <th className="px-3 py-2 text-right border-b border-border/60">Sisa Panjar</th>
                </tr>
              </thead>
              <tbody>
                {panjarSPPs.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Belum ada SPP Panjar yang Final</td></tr>
                ) : (
                  panjarSPPs.map(spp => {
                    const totalCair = pencairanForSPP(spp.id).reduce((s, p) => s + p.netto, 0);
                    const sisa = spp.jumlah - totalCair;
                    return (
                      <tr key={spp.id} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="px-3 py-2">{spp.nomorSPP}</td>
                        <td className="px-3 py-2">{spp.uraian}</td>
                        <td className="px-3 py-2 text-right">{spp.jumlah.toLocaleString('id-ID')}</td>
                        <td className="px-3 py-2 text-right">{totalCair.toLocaleString('id-ID')}</td>
                        <td className="px-3 py-2 text-right font-medium">{sisa.toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
