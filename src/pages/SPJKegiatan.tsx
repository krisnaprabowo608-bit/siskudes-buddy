import { useState, useEffect } from "react";
import FormPageHeader from "@/components/FormPageHeader";
import { trackFormProgress } from "@/lib/session-manager";
import { loadState, saveState, type SPPItem, type SPJPanjarItem } from "@/data/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, X, Save, Printer, DoorOpen, Search } from "lucide-react";
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

  const refreshState = () => {
    const s = loadState();
    setState(s);
  };

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

  return (
    <div className="h-full flex flex-col">
      <FormPageHeader title="Pengesahan SPJ Kegiatan" subtitle="SPJ Panjar" />

      <div className="flex-1 p-4 flex gap-0">
        {/* Vertical Tabs */}
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
                        onClick={() => { setSelectedSPP(spp); setSelectedSPJ(null); }}>
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

              {/* SPJ list for selected SPP */}
              {selectedSPP && (
                <div className="flex-shrink-0 max-h-[120px] overflow-auto border-b border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 text-[11px]">
                        <TableHead className="font-semibold">Tgl_SPJ</TableHead>
                        <TableHead className="font-semibold">No_SPJ</TableHead>
                        <TableHead className="font-semibold">No_SPP</TableHead>
                        <TableHead className="font-semibold text-right">JmlCair</TableHead>
                        <TableHead className="font-semibold text-right">JmlSPJ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spjForSPP(selectedSPP.id).length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4 text-xs">Belum ada data SPJ</TableCell></TableRow>
                      ) : spjForSPP(selectedSPP.id).map(spj => (
                        <TableRow key={spj.id}
                          className={`cursor-pointer text-[11px] ${selectedSPJ?.id === spj.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                          onClick={() => { setSelectedSPJ(spj); setMode("view"); }}>
                          <TableCell>{spj.tanggalSPJ}</TableCell>
                          <TableCell className="font-mono">{spj.nomorSPJ}</TableCell>
                          <TableCell className="font-mono">{spj.nomorSPP}</TableCell>
                          <TableCell className="text-right">{fmt(spj.jumlahCair)}</TableCell>
                          <TableCell className="text-right">{fmt(spj.jumlahSPJ)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Detail form */}
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

      {/* Action Bar */}
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
