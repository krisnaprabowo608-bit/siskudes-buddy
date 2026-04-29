import { useState } from "react";
import FormPageHeader from "@/components/FormPageHeader";
import { trackFormProgress } from "@/lib/session-manager";
import { loadState, saveState, type SPPItem, type SPJPanjarItem } from "@/data/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, X, Save, Printer, DoorOpen } from "lucide-react";
import { toast } from "sonner";

type Mode = "view" | "add" | "edit";
type ActiveTab = "spjUangMuka" | "pengembalian";

export default function SPJKegiatan() {
  const [state, setState] = useState(loadState());
  const [selectedSPP, setSelectedSPP] = useState<SPPItem | null>(null);
  const [selectedSPJ, setSelectedSPJ] = useState<SPJPanjarItem | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [activeTab, setActiveTab] = useState<ActiveTab>("spjUangMuka");

  const panjarSPPs = state.spp.filter(s => s.jenis === "panjar" && s.isFinal);
  const pencairanForSPP = (sppId: string) => state.pencairan.filter(p => p.sppId === sppId);
  const spjForSPP = (sppId: string) => (state.spjPanjar || []).filter(s => s.sppId === sppId);

  const [form, setForm] = useState({
    tanggalSPJ: "", nomorSPJ: "", nomorSPP: "",
    jumlahCair: 0, jumlahSPJ: 0, sisa: 0, keterangan: "",
  });

  const fmt = (n: number) => n.toLocaleString("id-ID", { minimumFractionDigits: 2 });

  const handleTambah = () => {
    if (!selectedSPP) { toast.error("Pilih SPP Panjar terlebih dahulu"); return; }
    const totalCair = pencairanForSPP(selectedSPP.id).reduce((s, p) => s + p.netto, 0);
    const existingSPJ = spjForSPP(selectedSPP.id);
    const totalSPJ = existingSPJ.reduce((s, spj) => s + spj.jumlahSPJ, 0);
    const sisa = totalCair - totalSPJ;
    const count = (state.spjPanjar || []).length + 1;

    setMode("add");
    setActiveTab("pengembalian");
    setForm({
      tanggalSPJ: new Date().toISOString().slice(0, 10),
      nomorSPJ: `${String(count).padStart(4, "0")}/SPJ/05.2001/2024`,
      nomorSPP: selectedSPP.nomorSPP,
      jumlahCair: totalCair,
      jumlahSPJ: 0,
      sisa,
      keterangan: selectedSPP.uraian,
    });
  };

  const handleHapus = () => {
    if (!selectedSPJ) { toast.error("Pilih data SPJ"); return; }
    const newState = {
      ...state,
      spjPanjar: (state.spjPanjar || []).filter(s => s.id !== selectedSPJ.id),
    };
    saveState(newState);
    setState(newState);
    setSelectedSPJ(null);
    toast.success("Data SPJ dihapus");
  };

  const handleSimpan = () => {
    if (!selectedSPP || !form.tanggalSPJ) { toast.error("Lengkapi data"); return; }
    const sisa = form.jumlahCair - form.jumlahSPJ;
    const newItem: SPJPanjarItem = {
      id: crypto.randomUUID(),
      sppId: selectedSPP.id,
      tanggalSPJ: form.tanggalSPJ,
      nomorSPJ: form.nomorSPJ,
      nomorSPP: form.nomorSPP,
      jumlahCair: form.jumlahCair,
      jumlahSPJ: form.jumlahSPJ,
      sisa,
      keterangan: form.keterangan,
    };
    const newState = {
      ...state,
      spjPanjar: [...(state.spjPanjar || []), newItem],
    };
    saveState(newState);
    setState(newState);
    setSelectedSPJ(newItem);
    trackFormProgress("spj");
    setMode("view");
    toast.success("SPJ Panjar disimpan");
  };

  // Double-click: SPP Panjar row → navigate to Sisa Uang Muka tab
  const handleSPPDoubleClick = (spp: SPPItem) => {
    setSelectedSPP(spp);
    setSelectedSPJ(null);
    setActiveTab("pengembalian");
  };

  return (
    <div className="h-full flex flex-col">
      <FormPageHeader title="Pengesahan SPJ Kegiatan" subtitle="SPJ Panjar" />

      <div className="flex-1 p-4 flex gap-0">
        <div className="flex flex-col border border-border rounded-l-md overflow-hidden bg-muted/30">
          <button onClick={() => setActiveTab("spjUangMuka")}
            className={`px-3 py-6 text-[10px] font-semibold border-b border-border transition-colors ${activeTab === "spjUangMuka" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>SPJ Panjar</button>
          <button onClick={() => setActiveTab("pengembalian")}
            className={`px-3 py-6 text-[10px] font-semibold border-b border-border transition-colors ${activeTab === "pengembalian" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>Sisa Uang Muka</button>
        </div>

        <div className="flex-1 border border-l-0 border-border rounded-r-md bg-card flex flex-col overflow-hidden">
          {activeTab === "spjUangMuka" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-secondary/20">
                <p className="text-[11px] font-semibold">SPJ UANG MUKA PANJAR</p>
              </div>
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 text-[11px]">
                      <TableHead className="font-semibold">No_SPP</TableHead>
                      <TableHead className="font-semibold">Keterangan</TableHead>
                      <TableHead className="font-semibold text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {panjarSPPs.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-xs">Belum ada SPP Panjar yang Final</TableCell></TableRow>
                    ) : panjarSPPs.map(spp => (
                      <TableRow key={spp.id}
                        className={`cursor-pointer text-[11px] ${selectedSPP?.id === spp.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                        onClick={() => { setSelectedSPP(spp); setSelectedSPJ(null); }}
                        onDoubleClick={() => handleSPPDoubleClick(spp)}>
                        <TableCell className="font-mono">{spp.nomorSPP}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{spp.uraian}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(spp.jumlah)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === "pengembalian" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-secondary/20">
                <p className="text-[11px] font-semibold">PENGEMBALIAN SISA UANG MUKA</p>
              </div>

              {selectedSPP && selectedSPP.rincian.length > 0 && (
                <div className="flex-shrink-0 border-b border-border">
                  <div className="px-3 py-1.5 bg-secondary/60 text-[10px] font-semibold border-b border-border flex items-center justify-between">
                    <span>Rincian Belanja Terkait</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{selectedSPP.rincian.length} baris</span>
                  </div>
                  <div className="max-h-[180px] overflow-auto">
                    <table className="w-full caption-bottom text-[11px] border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-secondary/80 backdrop-blur-sm border-b border-border">
                          <th className="px-2 py-1.5 text-left font-semibold whitespace-nowrap w-[60px]">No.Ref</th>
                          <th className="px-2 py-1.5 text-left font-semibold whitespace-nowrap w-[90px]">Kode</th>
                          <th className="px-2 py-1.5 text-left font-semibold">Nama Rincian</th>
                          <th className="px-2 py-1.5 text-left font-semibold">Kegiatan</th>
                          <th className="px-2 py-1.5 text-right font-semibold whitespace-nowrap w-[110px]">Nilai</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSPP.rincian.map(r => {
                          const namaSource: "primary" | "kode" | "kegiatan" | "none" =
                            r.namaRekening ? "primary" : r.kodeRekening ? "kode" : r.kodeKegiatan ? "kegiatan" : "none";
                          const namaValue = r.namaRekening || r.kodeRekening || r.kodeKegiatan || "-";
                          const sourceMeta = {
                            primary: { label: "✓", title: "Diambil dari namaRekening (utama)", cls: "bg-primary/15 text-primary" },
                            kode: { label: "K", title: "Fallback ke kodeRekening", cls: "bg-amber-500/20 text-amber-700 dark:text-amber-400" },
                            kegiatan: { label: "G", title: "Fallback ke kodeKegiatan", cls: "bg-orange-500/20 text-orange-700 dark:text-orange-400" },
                            none: { label: "—", title: "Tidak ada data", cls: "bg-muted text-muted-foreground" },
                          }[namaSource];
                          const kegiatanFull = [r.kodeKegiatan, r.namaKegiatan].filter(Boolean).join(" — ") || "-";
                          return (
                            <tr key={r.id} className="border-b border-border/50 hover:bg-muted/40">
                              <td className="px-2 py-1 font-mono">{r.noRef || "-"}</td>
                              <td className="px-2 py-1 font-mono">{r.kodeRekening || "-"}</td>
                              <td className="px-2 py-1">
                                <span className="inline-flex items-center gap-1.5 max-w-full">
                                  <span
                                    title={sourceMeta.title}
                                    className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold leading-none shrink-0 ${sourceMeta.cls}`}
                                  >
                                    {sourceMeta.label}
                                  </span>
                                  <span className="truncate" title={namaValue}>{namaValue}</span>
                                </span>
                              </td>
                              <td className="px-2 py-1 text-[10px] text-muted-foreground">
                                <span className="truncate inline-block align-middle max-w-[180px]" title={kegiatanFull}>
                                  {kegiatanFull}
                                </span>
                              </td>
                              <td className="px-2 py-1 text-right font-medium whitespace-nowrap">{fmt(r.nilai)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedSPP && (
                <div className="flex-shrink-0 border-b border-border">
                  <div className="px-3 py-1.5 bg-secondary/40 text-[10px] font-semibold border-b border-border">
                    Daftar SPJ
                  </div>
                  <div className="max-h-[140px] overflow-auto">
                    <table className="w-full text-[11px] border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-secondary/70 backdrop-blur-sm border-b border-border">
                          <th className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">Tgl_SPJ</th>
                          <th className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">No_SPJ</th>
                          <th className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">No_SPP</th>
                          <th className="px-2 py-1.5 text-right font-semibold whitespace-nowrap">JmlCair</th>
                          <th className="px-2 py-1.5 text-right font-semibold whitespace-nowrap">JmlSPJ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spjForSPP(selectedSPP.id).length === 0 ? (
                          <tr><td colSpan={5} className="text-center text-muted-foreground py-3 text-xs">Belum ada data SPJ</td></tr>
                        ) : spjForSPP(selectedSPP.id).map(spj => (
                          <tr key={spj.id}
                            className={`cursor-pointer border-b border-border/50 ${selectedSPJ?.id === spj.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                            onClick={() => { setSelectedSPJ(spj); setMode("view"); }}>
                            <td className="px-2 py-1">{spj.tanggalSPJ}</td>
                            <td className="px-2 py-1 font-mono">{spj.nomorSPJ}</td>
                            <td className="px-2 py-1 font-mono">{spj.nomorSPP}</td>
                            <td className="px-2 py-1 text-right">{fmt(spj.jumlahCair)}</td>
                            <td className="px-2 py-1 text-right">{fmt(spj.jumlahSPJ)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex-1 p-4 space-y-2 bg-muted/10 overflow-auto">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">Tgl SPJ</Label>
                      <Input type="date" className="h-7 text-[11px]" readOnly={mode === "view"}
                        value={mode !== "view" ? form.tanggalSPJ : selectedSPJ?.tanggalSPJ || ""}
                        onChange={e => setForm({...form, tanggalSPJ: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">Nomor SPJ</Label>
                      <Input className="h-7 text-[11px]" readOnly={mode === "view"}
                        value={mode !== "view" ? form.nomorSPJ : selectedSPJ?.nomorSPJ || ""}
                        onChange={e => setForm({...form, nomorSPJ: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">Nomor SPP</Label>
                      <Input className="h-7 text-[11px]" readOnly
                        value={mode !== "view" ? form.nomorSPP : selectedSPJ?.nomorSPP || selectedSPP?.nomorSPP || ""} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">Keterangan</Label>
                      <Input className="h-7 text-[11px]" readOnly={mode === "view"}
                        value={mode !== "view" ? form.keterangan : selectedSPJ?.keterangan || ""}
                        onChange={e => setForm({...form, keterangan: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">Jumlah Cair</Label>
                      <Input className="h-7 text-[11px] text-right font-medium bg-muted" readOnly
                        value={fmt(mode !== "view" ? form.jumlahCair : selectedSPJ?.jumlahCair || 0)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">Jml SPJ</Label>
                      <Input type="number" className="h-7 text-[11px] text-right font-medium" readOnly={mode === "view"}
                        value={mode !== "view" ? form.jumlahSPJ || "" : selectedSPJ?.jumlahSPJ || ""}
                        onChange={e => {
                          const jml = Number(e.target.value);
                          setForm({...form, jumlahSPJ: jml, sisa: form.jumlahCair - jml});
                        }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">Sisa</Label>
                      <Input className="h-7 text-[11px] text-right font-medium bg-muted" readOnly
                        value={fmt(mode !== "view" ? form.jumlahCair - form.jumlahSPJ : selectedSPJ?.sisa || 0)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleTambah}><Plus size={12} />Tambah</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" disabled><Pencil size={12} />Ubah</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleHapus}><Trash2 size={12} />Hapus</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setMode("view")}><X size={12} />Batal</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleSimpan}><Save size={12} />Simpan</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Printer size={12} />Cetak</Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => window.history.back()}><DoorOpen size={12} />Tutup</Button>
      </div>
    </div>
  );
}
