import { useState, useEffect, useMemo } from "react";
import FormPageHeader from "@/components/FormPageHeader";
import { trackFormProgress } from "@/lib/session-manager";
import { getRekeningDetail } from "@/data/rekening-data";
import {
  loadState, saveState,
  type SPPItem, type SPJPanjarItem, type SisaPanjarItem,
  type SPJRincian, type BuktiTransaksi, type PotonganPajak,
} from "@/data/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, X, Save, DoorOpen } from "lucide-react";
import { toast } from "sonner";

type Mode = "view" | "add";
type ActiveTab = "spjPanjar" | "sisaPanjar";

export default function SPJKegiatan() {
  const [state, setState] = useState(loadState());
  const [activeTab, setActiveTab] = useState<ActiveTab>("spjPanjar");

  // Listen to realtime sync updates
  useEffect(() => {
    const onUpd = () => setState(loadState());
    window.addEventListener("siskeudes:state-updated", onUpd);
    return () => window.removeEventListener("siskeudes:state-updated", onUpd);
  }, []);

  const persist = (next: ReturnType<typeof loadState>) => {
    saveState(next);
    setState(next);
  };

  // ============ SPJ PANJAR KEGIATAN ============
  const panjarSPPs = state.spp.filter(s => s.jenis === "panjar" && s.isFinal);
  const [selectedSPJId, setSelectedSPJId] = useState<string | null>(null);
  const selectedSPJ = (state.spjPanjar || []).find(s => s.id === selectedSPJId) || null;

  const [spjForm, setSpjForm] = useState({
    sppId: "", nomorSPJ: "", tanggalSPJ: new Date().toISOString().slice(0, 10), keterangan: "",
  });
  const [mode, setMode] = useState<Mode>("view");

  const [rincianForm, setRincianForm] = useState<Omit<SPJRincian, "id">>({ kodeRekening: "", namaRekening: "", nilai: 0, belanjaId: "", noRef: "", kodeKegiatan: "", namaKegiatan: "" });
  const [buktiForm, setBuktiForm] = useState<Omit<BuktiTransaksi, "id" | "potonganPajak">>({ tanggal: new Date().toISOString().slice(0, 10), noBukti: "", keterangan: "", jumlah: 0, penerima: "", nama: "", alamat: "" });
  const [potForm, setPotForm] = useState<PotonganPajak>({ kodeRekening: "", namaRekening: "", nilai: 0 });

  const rekeningPajak = getRekeningDetail("non_anggaran");

  const fmt = (n: number) => (n || 0).toLocaleString("id-ID", { minimumFractionDigits: 2 });

  const generateNoSPJ = () => `${String((state.spjPanjar || []).length + 1).padStart(4, "0")}/SPJ/05.2001/2024`;
  const generateNoBukti = () => `${String(((selectedSPJ?.buktiKwitansi?.length) || 0) + 1).padStart(5, "0")}/KWT/05.2001/2024`;

  const sppOptions = useMemo(() => panjarSPPs.map(s => ({ id: s.id, no: s.nomorSPP, jumlah: s.jumlah, uraian: s.uraian, rincian: s.rincian })), [panjarSPPs]);

  const handleTambahSPJ = () => {
    setMode("add");
    setSelectedSPJId(null);
    setSpjForm({ sppId: "", nomorSPJ: generateNoSPJ(), tanggalSPJ: new Date().toISOString().slice(0, 10), keterangan: "" });
  };

  const handleSimpanSPJ = () => {
    if (!spjForm.sppId) { toast.error("Pilih No SPP"); return; }
    const spp = panjarSPPs.find(s => s.id === spjForm.sppId);
    if (!spp) { toast.error("SPP tidak ditemukan"); return; }
    const totalCair = state.pencairan.filter(p => p.sppId === spp.id).reduce((s, p) => s + p.netto, 0) || spp.jumlah;
    const newItem: SPJPanjarItem = {
      id: crypto.randomUUID(),
      sppId: spp.id,
      tanggalSPJ: spjForm.tanggalSPJ,
      nomorSPJ: spjForm.nomorSPJ,
      nomorSPP: spp.nomorSPP,
      jumlahCair: totalCair,
      jumlahSPJ: 0,
      sisa: totalCair,
      keterangan: spjForm.keterangan || spp.uraian,
      rincianSPJ: [],
      buktiKwitansi: [],
      potongan: [],
    };
    persist({ ...state, spjPanjar: [...(state.spjPanjar || []), newItem] });
    setSelectedSPJId(newItem.id);
    setMode("view");
    trackFormProgress("spj");
    toast.success("SPJ Panjar dibuat — silakan isi rincian, kwitansi, dan potongan");
  };

  const handleHapusSPJ = () => {
    if (!selectedSPJ) { toast.error("Pilih SPJ"); return; }
    persist({ ...state, spjPanjar: (state.spjPanjar || []).filter(s => s.id !== selectedSPJ.id) });
    setSelectedSPJId(null);
    toast.success("SPJ dihapus");
  };

  const updateSelectedSPJ = (patch: Partial<SPJPanjarItem>) => {
    if (!selectedSPJ) return;
    const next = (state.spjPanjar || []).map(s => s.id === selectedSPJ.id ? { ...s, ...patch } : s);
    // Recalculate jumlahSPJ from rincian
    const merged = next.map(s => {
      if (s.id !== selectedSPJ.id) return s;
      const jumlahSPJ = (s.rincianSPJ || []).reduce((a, r) => a + (r.nilai || 0), 0);
      return { ...s, jumlahSPJ, sisa: s.jumlahCair - jumlahSPJ };
    });
    persist({ ...state, spjPanjar: merged });
  };

  const addRincianSPJ = () => {
    if (!selectedSPJ) { toast.error("Pilih SPJ terlebih dahulu"); return; }
    const spp = panjarSPPs.find(s => s.id === selectedSPJ.sppId);
    if (!spp) return;
    if (!rincianForm.belanjaId) { toast.error("Pilih baris rincian SPP"); return; }
    if (rincianForm.nilai <= 0) { toast.error("Nilai harus > 0"); return; }
    const newR: SPJRincian = { id: crypto.randomUUID(), ...rincianForm };
    updateSelectedSPJ({ rincianSPJ: [...(selectedSPJ.rincianSPJ || []), newR] });
    setRincianForm({ kodeRekening: "", namaRekening: "", nilai: 0, belanjaId: "", noRef: "", kodeKegiatan: "", namaKegiatan: "" });
  };

  const removeRincianSPJ = (id: string) => {
    if (!selectedSPJ) return;
    updateSelectedSPJ({ rincianSPJ: (selectedSPJ.rincianSPJ || []).filter(r => r.id !== id) });
  };

  const addBuktiKwitansi = () => {
    if (!selectedSPJ) { toast.error("Pilih SPJ"); return; }
    if (!buktiForm.noBukti) { toast.error("Isi nomor bukti"); return; }
    const newB: BuktiTransaksi = { id: crypto.randomUUID(), ...buktiForm, potonganPajak: [] };
    updateSelectedSPJ({ buktiKwitansi: [...(selectedSPJ.buktiKwitansi || []), newB] });
    setBuktiForm({ tanggal: new Date().toISOString().slice(0, 10), noBukti: "", keterangan: "", jumlah: 0, penerima: "", nama: "", alamat: "" });
  };

  const removeBukti = (id: string) => {
    if (!selectedSPJ) return;
    updateSelectedSPJ({ buktiKwitansi: (selectedSPJ.buktiKwitansi || []).filter(b => b.id !== id) });
  };

  const addPotongan = () => {
    if (!selectedSPJ) { toast.error("Pilih SPJ"); return; }
    if (!potForm.kodeRekening) { toast.error("Pilih rekening pajak"); return; }
    if (potForm.nilai <= 0) { toast.error("Nilai harus > 0"); return; }
    updateSelectedSPJ({ potongan: [...(selectedSPJ.potongan || []), { ...potForm }] });
    setPotForm({ kodeRekening: "", namaRekening: "", nilai: 0 });
  };

  const removePotongan = (idx: number) => {
    if (!selectedSPJ) return;
    updateSelectedSPJ({ potongan: (selectedSPJ.potongan || []).filter((_, i) => i !== idx) });
  };

  // ============ SISA PANJAR ============
  const [selectedSisaId, setSelectedSisaId] = useState<string | null>(null);
  const [sisaForm, setSisaForm] = useState<{ spjId: string; tanggal: string; buktiNo: string; nominal: number; keterangan: string }>({
    spjId: "", tanggal: new Date().toISOString().slice(0, 10), buktiNo: "", nominal: 0, keterangan: "",
  });
  const [sisaMode, setSisaMode] = useState<Mode>("view");

  const handleTambahSisa = () => {
    setSisaMode("add");
    setSelectedSisaId(null);
    const count = (state.sisaPanjar || []).length + 1;
    setSisaForm({ spjId: "", tanggal: new Date().toISOString().slice(0, 10), buktiNo: `${String(count).padStart(4, "0")}/SISA/05.2001/2024`, nominal: 0, keterangan: "" });
  };

  const handleSimpanSisa = () => {
    if (!sisaForm.spjId) { toast.error("Pilih No SPJ"); return; }
    const spj = (state.spjPanjar || []).find(s => s.id === sisaForm.spjId);
    if (!spj) { toast.error("SPJ tidak ditemukan"); return; }
    const newItem: SisaPanjarItem = {
      id: crypto.randomUUID(),
      spjId: spj.id,
      nomorSPJ: spj.nomorSPJ,
      tanggal: sisaForm.tanggal,
      buktiNo: sisaForm.buktiNo,
      nominal: sisaForm.nominal,
      keterangan: sisaForm.keterangan,
    };
    persist({ ...state, sisaPanjar: [...(state.sisaPanjar || []), newItem] });
    setSisaMode("view");
    setSelectedSisaId(newItem.id);
    trackFormProgress("spj");
    toast.success("Bukti sisa panjar disimpan");
  };

  const handleHapusSisa = () => {
    if (!selectedSisaId) { toast.error("Pilih data"); return; }
    persist({ ...state, sisaPanjar: (state.sisaPanjar || []).filter(s => s.id !== selectedSisaId) });
    setSelectedSisaId(null);
    toast.success("Data dihapus");
  };

  const sppRincianOptions = useMemo(() => {
    if (!selectedSPJ) return [];
    const spp = panjarSPPs.find(s => s.id === selectedSPJ.sppId);
    return spp?.rincian || [];
  }, [selectedSPJ, panjarSPPs]);

  return (
    <div className="h-full flex flex-col">
      <FormPageHeader title="Pengesahan SPJ Kegiatan" subtitle={activeTab === "spjPanjar" ? "SPJ Panjar Kegiatan" : "Sisa Panjar"} />

      <div className="flex-1 p-4 flex gap-0 overflow-hidden">
        {/* Vertical tab bar */}
        <div className="flex flex-col border border-border rounded-l-md overflow-hidden bg-muted/30">
          <button onClick={() => setActiveTab("spjPanjar")}
            className={`px-3 py-6 text-[10px] font-semibold border-b border-border transition-colors ${activeTab === "spjPanjar" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>SPJ Panjar Kegiatan</button>
          <button onClick={() => setActiveTab("sisaPanjar")}
            className={`px-3 py-6 text-[10px] font-semibold border-b border-border transition-colors ${activeTab === "sisaPanjar" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>Sisa Panjar</button>
        </div>

        <div className="flex-1 border border-l-0 border-border rounded-r-md bg-card flex flex-col overflow-hidden">
          {/* ============ SPJ PANJAR KEGIATAN ============ */}
          {activeTab === "spjPanjar" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Master table */}
              <div className="border-b border-border max-h-[200px] overflow-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-secondary/70 backdrop-blur-sm border-b border-border">
                      <th className="px-2 py-1.5 text-left font-semibold">Tgl SPJ</th>
                      <th className="px-2 py-1.5 text-left font-semibold">No SPJ</th>
                      <th className="px-2 py-1.5 text-left font-semibold">No SPP</th>
                      <th className="px-2 py-1.5 text-left font-semibold">Keterangan</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Cair</th>
                      <th className="px-2 py-1.5 text-right font-semibold">SPJ</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Sisa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(state.spjPanjar || []).length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-muted-foreground py-6 text-xs">Belum ada SPJ Panjar</td></tr>
                    ) : (state.spjPanjar || []).map(s => (
                      <tr key={s.id}
                        className={`cursor-pointer border-b border-border/50 ${selectedSPJId === s.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                        onClick={() => { setSelectedSPJId(s.id); setMode("view"); }}>
                        <td className="px-2 py-1">{s.tanggalSPJ}</td>
                        <td className="px-2 py-1 font-mono">{s.nomorSPJ}</td>
                        <td className="px-2 py-1 font-mono">{s.nomorSPP}</td>
                        <td className="px-2 py-1 max-w-[200px] truncate">{s.keterangan}</td>
                        <td className="px-2 py-1 text-right">{fmt(s.jumlahCair)}</td>
                        <td className="px-2 py-1 text-right">{fmt(s.jumlahSPJ)}</td>
                        <td className="px-2 py-1 text-right">{fmt(s.sisa)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Header form */}
              <div className="p-3 border-b border-border bg-muted/10 grid grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] w-24 shrink-0">No SPP</Label>
                  {mode === "add" ? (
                    <Select value={spjForm.sppId} onValueChange={v => setSpjForm({ ...spjForm, sppId: v })}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Pilih SPP Panjar Final" /></SelectTrigger>
                      <SelectContent>
                        {sppOptions.length === 0 ? <SelectItem value="__empty" disabled>Tidak ada SPP Panjar Final</SelectItem>
                          : sppOptions.map(o => <SelectItem key={o.id} value={o.id} className="text-[11px]">{o.no} — Rp {fmt(o.jumlah)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input className="h-7 text-[11px]" readOnly value={selectedSPJ?.nomorSPP || ""} />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] w-24 shrink-0">No SPJ</Label>
                  <Input className="h-7 text-[11px]" readOnly={mode !== "add"}
                    value={mode === "add" ? spjForm.nomorSPJ : selectedSPJ?.nomorSPJ || ""}
                    onChange={e => setSpjForm({ ...spjForm, nomorSPJ: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] w-24 shrink-0">Tgl SPJ</Label>
                  <Input type="date" className="h-7 text-[11px]" readOnly={mode !== "add"}
                    value={mode === "add" ? spjForm.tanggalSPJ : selectedSPJ?.tanggalSPJ || ""}
                    onChange={e => setSpjForm({ ...spjForm, tanggalSPJ: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] w-24 shrink-0">Keterangan</Label>
                  <Input className="h-7 text-[11px]" readOnly={mode !== "add"}
                    value={mode === "add" ? spjForm.keterangan : selectedSPJ?.keterangan || ""}
                    onChange={e => setSpjForm({ ...spjForm, keterangan: e.target.value })} />
                </div>
              </div>

              {/* Sub-tables */}
              {selectedSPJ && mode === "view" && (
                <div className="flex-1 overflow-auto p-3 space-y-3">
                  {/* Rincian SPJ */}
                  <section className="border border-border rounded-md">
                    <div className="px-3 py-1.5 bg-secondary/50 text-[11px] font-semibold border-b border-border flex items-center justify-between">
                      <span>3. Rincian SPJ</span>
                      <span className="text-[10px] text-muted-foreground">Total: Rp {fmt((selectedSPJ.rincianSPJ || []).reduce((s, r) => s + r.nilai, 0))}</span>
                    </div>
                    <div className="max-h-[140px] overflow-auto">
                      <table className="w-full text-[11px]">
                        <thead className="sticky top-0 bg-secondary/40">
                          <tr>
                            <th className="px-2 py-1 text-left">No.Ref</th>
                            <th className="px-2 py-1 text-left">Kode</th>
                            <th className="px-2 py-1 text-left">Nama Rincian</th>
                            <th className="px-2 py-1 text-right">Nilai</th>
                            <th className="px-2 py-1 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedSPJ.rincianSPJ || []).length === 0 ? (
                            <tr><td colSpan={5} className="text-center text-muted-foreground py-3 text-xs">Belum ada rincian</td></tr>
                          ) : (selectedSPJ.rincianSPJ || []).map(r => (
                            <tr key={r.id} className="border-b border-border/40">
                              <td className="px-2 py-1 font-mono">{r.noRef || "-"}</td>
                              <td className="px-2 py-1 font-mono">{r.kodeRekening}</td>
                              <td className="px-2 py-1">{r.namaRekening}</td>
                              <td className="px-2 py-1 text-right">{fmt(r.nilai)}</td>
                              <td className="px-2 py-1"><button onClick={() => removeRincianSPJ(r.id)} className="text-destructive text-[10px]">×</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-2 border-t border-border bg-muted/10 grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <Label className="text-[10px]">Pilih Rincian SPP</Label>
                        <Select value={rincianForm.belanjaId || ""} onValueChange={v => {
                          const opt = sppRincianOptions.find(o => o.id === v);
                          if (opt) setRincianForm({
                            kodeRekening: opt.kodeRekening, namaRekening: opt.namaRekening, nilai: opt.nilai,
                            belanjaId: opt.id, noRef: opt.noRef || "", kodeKegiatan: opt.kodeKegiatan || "", namaKegiatan: opt.namaKegiatan || "",
                          });
                        }}>
                          <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Pilih baris dari Rincian SPP" /></SelectTrigger>
                          <SelectContent>{sppRincianOptions.map(o => <SelectItem key={o.id} value={o.id} className="text-[10px]">[{o.noRef || "-"}] {o.kodeRekening} — {o.namaRekening}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Label className="text-[10px]">Nilai</Label>
                        <Input type="number" className="h-7 text-[10px] text-right" value={rincianForm.nilai || ""} onChange={e => setRincianForm({ ...rincianForm, nilai: Number(e.target.value) })} />
                      </div>
                      <div className="col-span-2"><Button size="sm" className="h-7 text-[10px] w-full gap-1" onClick={addRincianSPJ}><Plus size={11} />Tambah</Button></div>
                    </div>
                  </section>

                  {/* Bukti Kwitansi */}
                  <section className="border border-border rounded-md">
                    <div className="px-3 py-1.5 bg-secondary/50 text-[11px] font-semibold border-b border-border">4. Bukti Kwitansi</div>
                    <div className="max-h-[140px] overflow-auto">
                      <table className="w-full text-[11px]">
                        <thead className="sticky top-0 bg-secondary/40">
                          <tr>
                            <th className="px-2 py-1 text-left">Tgl</th>
                            <th className="px-2 py-1 text-left">No Bukti</th>
                            <th className="px-2 py-1 text-left">Keterangan</th>
                            <th className="px-2 py-1 text-left">Penerima</th>
                            <th className="px-2 py-1 text-right">Jumlah</th>
                            <th className="px-2 py-1 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedSPJ.buktiKwitansi || []).length === 0 ? (
                            <tr><td colSpan={6} className="text-center text-muted-foreground py-3 text-xs">Belum ada kwitansi</td></tr>
                          ) : (selectedSPJ.buktiKwitansi || []).map(b => (
                            <tr key={b.id} className="border-b border-border/40">
                              <td className="px-2 py-1">{b.tanggal}</td>
                              <td className="px-2 py-1 font-mono">{b.noBukti}</td>
                              <td className="px-2 py-1 max-w-[180px] truncate">{b.keterangan}</td>
                              <td className="px-2 py-1">{b.nama}</td>
                              <td className="px-2 py-1 text-right">{fmt(b.jumlah)}</td>
                              <td className="px-2 py-1"><button onClick={() => removeBukti(b.id)} className="text-destructive text-[10px]">×</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-2 border-t border-border bg-muted/10 grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-2"><Label className="text-[10px]">Tgl</Label><Input type="date" className="h-7 text-[10px]" value={buktiForm.tanggal} onChange={e => setBuktiForm({ ...buktiForm, tanggal: e.target.value })} /></div>
                      <div className="col-span-3"><Label className="text-[10px]">No Bukti</Label><Input className="h-7 text-[10px]" value={buktiForm.noBukti || generateNoBukti()} onChange={e => setBuktiForm({ ...buktiForm, noBukti: e.target.value })} /></div>
                      <div className="col-span-3"><Label className="text-[10px]">Keterangan</Label><Input className="h-7 text-[10px]" value={buktiForm.keterangan} onChange={e => setBuktiForm({ ...buktiForm, keterangan: e.target.value })} /></div>
                      <div className="col-span-2"><Label className="text-[10px]">Penerima</Label><Input className="h-7 text-[10px]" value={buktiForm.nama} onChange={e => setBuktiForm({ ...buktiForm, nama: e.target.value, penerima: e.target.value })} /></div>
                      <div className="col-span-1"><Label className="text-[10px]">Jumlah</Label><Input type="number" className="h-7 text-[10px] text-right" value={buktiForm.jumlah || ""} onChange={e => setBuktiForm({ ...buktiForm, jumlah: Number(e.target.value) })} /></div>
                      <div className="col-span-1"><Button size="sm" className="h-7 text-[10px] w-full gap-1" onClick={addBuktiKwitansi}><Plus size={11} /></Button></div>
                    </div>
                  </section>

                  {/* Potongan */}
                  <section className="border border-border rounded-md">
                    <div className="px-3 py-1.5 bg-secondary/50 text-[11px] font-semibold border-b border-border flex items-center justify-between">
                      <span>5. Potongan Pajak</span>
                      <span className="text-[10px] text-muted-foreground">Otomatis terkirim ke Penyetoran Pajak</span>
                    </div>
                    <div className="max-h-[120px] overflow-auto">
                      <table className="w-full text-[11px]">
                        <thead className="sticky top-0 bg-secondary/40">
                          <tr>
                            <th className="px-2 py-1 text-left">Kode</th>
                            <th className="px-2 py-1 text-left">Nama</th>
                            <th className="px-2 py-1 text-right">Nilai</th>
                            <th className="px-2 py-1 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedSPJ.potongan || []).length === 0 ? (
                            <tr><td colSpan={4} className="text-center text-muted-foreground py-3 text-xs">Belum ada potongan</td></tr>
                          ) : (selectedSPJ.potongan || []).map((p, i) => (
                            <tr key={i} className="border-b border-border/40">
                              <td className="px-2 py-1 font-mono">{p.kodeRekening}</td>
                              <td className="px-2 py-1">{p.namaRekening}</td>
                              <td className="px-2 py-1 text-right">{fmt(p.nilai)}</td>
                              <td className="px-2 py-1"><button onClick={() => removePotongan(i)} className="text-destructive text-[10px]">×</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-2 border-t border-border bg-muted/10 grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-7">
                        <Label className="text-[10px]">Rekening Pajak</Label>
                        <Select value={potForm.kodeRekening} onValueChange={v => {
                          const r = rekeningPajak.find(x => x.kode === v);
                          setPotForm({ ...potForm, kodeRekening: v, namaRekening: r?.uraian || "" });
                        }}>
                          <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Pilih rekening" /></SelectTrigger>
                          <SelectContent>{rekeningPajak.map(r => <SelectItem key={r.kode} value={r.kode} className="text-[10px]">{r.kode} — {r.uraian}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3"><Label className="text-[10px]">Nilai</Label><Input type="number" className="h-7 text-[10px] text-right" value={potForm.nilai || ""} onChange={e => setPotForm({ ...potForm, nilai: Number(e.target.value) })} /></div>
                      <div className="col-span-2"><Button size="sm" className="h-7 text-[10px] w-full gap-1" onClick={addPotongan}><Plus size={11} />Tambah</Button></div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {/* ============ SISA PANJAR ============ */}
          {activeTab === "sisaPanjar" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto border-b border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 text-[11px]">
                      <TableHead>Tgl</TableHead>
                      <TableHead>No SPJ</TableHead>
                      <TableHead>Bukti Sisa</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(state.sisaPanjar || []).length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6 text-xs">Belum ada bukti sisa panjar</TableCell></TableRow>
                    ) : (state.sisaPanjar || []).map(s => (
                      <TableRow key={s.id}
                        className={`cursor-pointer text-[11px] ${selectedSisaId === s.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                        onClick={() => { setSelectedSisaId(s.id); setSisaMode("view"); }}>
                        <TableCell>{s.tanggal}</TableCell>
                        <TableCell className="font-mono">{s.nomorSPJ}</TableCell>
                        <TableCell className="font-mono">{s.buktiNo}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{s.keterangan}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(s.nominal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 bg-muted/10">
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] w-24 shrink-0">No SPJ</Label>
                  {sisaMode === "add" ? (
                    <Select value={sisaForm.spjId} onValueChange={v => {
                      const spj = (state.spjPanjar || []).find(s => s.id === v);
                      setSisaForm({ ...sisaForm, spjId: v, nominal: spj?.sisa || 0, keterangan: spj ? `Sisa panjar ${spj.nomorSPJ}` : "" });
                    }}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Pilih SPJ Panjar" /></SelectTrigger>
                      <SelectContent>
                        {(state.spjPanjar || []).length === 0 ? <SelectItem value="__empty" disabled>Belum ada SPJ Panjar</SelectItem>
                          : (state.spjPanjar || []).map(s => <SelectItem key={s.id} value={s.id} className="text-[11px]">{s.nomorSPJ} — sisa Rp {fmt(s.sisa)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input className="h-7 text-[11px]" readOnly value={(state.spjPanjar || []).find(x => x.id === (state.sisaPanjar || []).find(s => s.id === selectedSisaId)?.spjId)?.nomorSPJ || ""} />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] w-24 shrink-0">Bukti Sisa</Label>
                  <Input className="h-7 text-[11px]" readOnly={sisaMode !== "add"}
                    value={sisaMode === "add" ? sisaForm.buktiNo : (state.sisaPanjar || []).find(s => s.id === selectedSisaId)?.buktiNo || ""}
                    onChange={e => setSisaForm({ ...sisaForm, buktiNo: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] w-24 shrink-0">Tanggal</Label>
                  <Input type="date" className="h-7 text-[11px]" readOnly={sisaMode !== "add"}
                    value={sisaMode === "add" ? sisaForm.tanggal : (state.sisaPanjar || []).find(s => s.id === selectedSisaId)?.tanggal || ""}
                    onChange={e => setSisaForm({ ...sisaForm, tanggal: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] w-24 shrink-0">Nominal</Label>
                  <Input type="number" className="h-7 text-[11px] text-right" readOnly={sisaMode !== "add"}
                    value={sisaMode === "add" ? sisaForm.nominal || "" : (state.sisaPanjar || []).find(s => s.id === selectedSisaId)?.nominal || ""}
                    onChange={e => setSisaForm({ ...sisaForm, nominal: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Label className="text-[11px] w-24 shrink-0">Keterangan</Label>
                  <Input className="h-7 text-[11px]" readOnly={sisaMode !== "add"}
                    value={sisaMode === "add" ? sisaForm.keterangan : (state.sisaPanjar || []).find(s => s.id === selectedSisaId)?.keterangan || ""}
                    onChange={e => setSisaForm({ ...sisaForm, keterangan: e.target.value })} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-1">
        {activeTab === "spjPanjar" ? (
          <>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleTambahSPJ}><Plus size={12} />Tambah</Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleHapusSPJ}><Trash2 size={12} />Hapus</Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setMode("view")}><X size={12} />Batal</Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleSimpanSPJ} disabled={mode !== "add"}><Save size={12} />Simpan</Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleTambahSisa}><Plus size={12} />Tambah</Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleHapusSisa}><Trash2 size={12} />Hapus</Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setSisaMode("view")}><X size={12} />Batal</Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleSimpanSisa} disabled={sisaMode !== "add"}><Save size={12} />Simpan</Button>
          </>
        )}
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => window.history.back()}><DoorOpen size={12} />Tutup</Button>
      </div>
    </div>
  );
}
