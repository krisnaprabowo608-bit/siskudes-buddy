import { useState, useEffect } from "react";
import { getRekeningDetail } from "@/data/rekening-data";
import { loadState, saveState, type SPPItem, type SPPRincian } from "@/data/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, X, Save, Printer, DoorOpen } from "lucide-react";
import { toast } from "sonner";

type Mode = "view" | "add" | "edit";
type ActiveTab = "spp" | "rincian";

export default function SPPPanjar() {
  const [items, setItems] = useState<SPPItem[]>([]);
  const [selected, setSelected] = useState<SPPItem | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [activeTab, setActiveTab] = useState<ActiveTab>("spp");

  // SPP form
  const [form, setForm] = useState({ tanggalSPP: "", nomorSPP: "", uraian: "", jumlah: 0, penerimaPanjar: "", nama: "", kodeBank: "", noRekBank: "", namaBank: "" });

  // Rincian
  const [rincianMode, setRincianMode] = useState<Mode>("view");
  const [selectedRincian, setSelectedRincian] = useState<SPPRincian | null>(null);
  const [rincianForm, setRincianForm] = useState<Omit<SPPRincian, "id">>({ kodeRekening: "", namaRekening: "", nilai: 0 });

  const rekeningBelanja = getRekeningDetail("belanja");

  useEffect(() => {
    setItems(loadState().spp.filter(i => i.jenis === "panjar"));
  }, []);

  const save = (allSpp: SPPItem[]) => {
    const state = loadState();
    const otherSpp = state.spp.filter(i => i.jenis !== "panjar");
    state.spp = [...otherSpp, ...allSpp];
    saveState(state);
    setItems(allSpp);
  };

  const generateNoSPP = () => {
    const count = items.length + 1;
    return `${String(count).padStart(4, "0")}/SPP/05.2001/2024`;
  };

  // === SPP ACTIONS ===
  const handleTambah = () => {
    setMode("add");
    setSelected(null);
    setForm({ tanggalSPP: new Date().toISOString().slice(0, 10), nomorSPP: generateNoSPP(), uraian: "", jumlah: 0, penerimaPanjar: "", nama: "", kodeBank: "", noRekBank: "", namaBank: "" });
    setActiveTab("spp");
  };

  const handleUbah = () => {
    if (!selected) { toast.error("Pilih data terlebih dahulu"); return; }
    if (selected.isFinal) { toast.error("SPP sudah Final, tidak bisa diubah"); return; }
    setMode("edit");
    setForm({
      tanggalSPP: selected.tanggalSPP, nomorSPP: selected.nomorSPP, uraian: selected.uraian, jumlah: selected.jumlah,
      penerimaPanjar: "", nama: "", kodeBank: "", noRekBank: "", namaBank: ""
    });
  };

  const handleHapus = () => {
    if (!selected) { toast.error("Pilih data terlebih dahulu"); return; }
    if (selected.isFinal) { toast.error("SPP sudah Final, tidak bisa dihapus"); return; }
    save(items.filter(i => i.id !== selected.id));
    setSelected(null);
    setMode("view");
    toast.success("Data berhasil dihapus");
  };

  const handleBatal = () => {
    setMode("view");
    setForm({ tanggalSPP: "", nomorSPP: "", uraian: "", jumlah: 0, penerimaPanjar: "", nama: "", kodeBank: "", noRekBank: "", namaBank: "" });
  };

  const handleSimpan = () => {
    if (!form.tanggalSPP || !form.uraian) { toast.error("Lengkapi data SPP"); return; }
    if (mode === "add") {
      const newItem: SPPItem = {
        id: crypto.randomUUID(), jenis: "panjar",
        tanggalSPP: form.tanggalSPP, nomorSPP: form.nomorSPP || generateNoSPP(),
        uraian: form.uraian, jumlah: form.jumlah, isFinal: false,
        rincian: [], buktiTransaksi: [],
      };
      save([...items, newItem]);
      setSelected(newItem);
      toast.success("SPP Panjar berhasil disimpan");
    } else if (mode === "edit" && selected) {
      const updated = items.map(i => i.id === selected.id ? { ...i, tanggalSPP: form.tanggalSPP, nomorSPP: form.nomorSPP, uraian: form.uraian, jumlah: form.jumlah } : i);
      save(updated);
      setSelected(updated.find(i => i.id === selected.id) || null);
      toast.success("SPP Panjar berhasil diperbarui");
    }
    setMode("view");
  };

  const toggleFinal = () => {
    if (!selected) return;
    const rincianTotal = selected.rincian.reduce((s, r) => s + r.nilai, 0);
    if (!selected.isFinal && rincianTotal === 0) { toast.error("Tambahkan rincian terlebih dahulu"); return; }
    const updated = items.map(i => i.id === selected.id ? { ...i, isFinal: !i.isFinal, jumlah: rincianTotal || i.jumlah } : i);
    save(updated);
    setSelected(updated.find(i => i.id === selected.id) || null);
    toast.success(selected.isFinal ? "Status Final dibatalkan" : "SPP ditetapkan sebagai Final");
  };

  // === RINCIAN ACTIONS ===
  const handleTambahRincian = () => {
    if (!selected) { toast.error("Pilih SPP terlebih dahulu"); return; }
    if (selected.isFinal) { toast.error("SPP sudah Final"); return; }
    setRincianMode("add");
    setSelectedRincian(null);
    setRincianForm({ kodeRekening: "", namaRekening: "", nilai: 0 });
  };

  const handleUbahRincian = () => {
    if (!selectedRincian) { toast.error("Pilih rincian terlebih dahulu"); return; }
    setRincianMode("edit");
    setRincianForm({ kodeRekening: selectedRincian.kodeRekening, namaRekening: selectedRincian.namaRekening, nilai: selectedRincian.nilai });
  };

  const handleHapusRincian = () => {
    if (!selected || !selectedRincian) return;
    if (selected.isFinal) { toast.error("SPP sudah Final"); return; }
    const updatedRincian = selected.rincian.filter(r => r.id !== selectedRincian.id);
    const updated = items.map(i => i.id === selected.id ? { ...i, rincian: updatedRincian } : i);
    save(updated);
    setSelected(updated.find(i => i.id === selected.id) || null);
    setSelectedRincian(null);
    toast.success("Rincian dihapus");
  };

  const handleSimpanRincian = () => {
    if (!selected || !rincianForm.kodeRekening) { toast.error("Pilih rekening"); return; }
    let updatedRincian: SPPRincian[];
    if (rincianMode === "add") {
      updatedRincian = [...selected.rincian, { id: crypto.randomUUID(), ...rincianForm }];
    } else {
      updatedRincian = selected.rincian.map(r => r.id === selectedRincian?.id ? { ...r, ...rincianForm } : r);
    }
    const newJumlah = updatedRincian.reduce((s, r) => s + r.nilai, 0);
    const updated = items.map(i => i.id === selected.id ? { ...i, rincian: updatedRincian, jumlah: newJumlah } : i);
    save(updated);
    setSelected(updated.find(i => i.id === selected.id) || null);
    setRincianMode("view");
    setSelectedRincian(null);
    toast.success("Rincian disimpan");
  };

  const fmt = (n: number) => n.toLocaleString("id-ID", { minimumFractionDigits: 2 });

  return (
    <div className="h-full flex flex-col">
      <div className="page-header">
        <h1 className="text-lg font-bold font-heading">PERMINTAAN PANJAR KEGIATAN</h1>
      </div>

      <div className="flex-1 p-4 flex gap-0">
        {/* Vertical Tabs */}
        <div className="flex flex-col border border-border rounded-l-md overflow-hidden bg-muted/30">
          <button onClick={() => setActiveTab("spp")} className={`px-3 py-6 text-[10px] font-semibold writing-vertical border-b border-border transition-colors ${activeTab === "spp" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>SPP</button>
          <button onClick={() => { if (selected) setActiveTab("rincian"); else toast.error("Pilih SPP terlebih dahulu"); }}
            className={`px-3 py-6 text-[10px] font-semibold border-b border-border transition-colors ${activeTab === "rincian" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>Rincian SPP</button>
        </div>

        {/* Content */}
        <div className="flex-1 border border-l-0 border-border rounded-r-md bg-card flex flex-col overflow-hidden">
          {activeTab === "spp" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Master Table */}
              <div className="flex-1 overflow-auto border-b border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 text-[11px]">
                      <TableHead className="font-semibold">Tgl_SPP</TableHead>
                      <TableHead className="font-semibold">No_SPP</TableHead>
                      <TableHead className="font-semibold">Keterangan</TableHead>
                      <TableHead className="font-semibold text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8 text-xs">Belum ada data</TableCell></TableRow>
                    ) : items.map(item => (
                      <TableRow key={item.id} className={`cursor-pointer text-[11px] ${selected?.id === item.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                        onClick={() => { setSelected(item); setMode("view"); }}>
                        <TableCell>{item.tanggalSPP}</TableCell>
                        <TableCell className="font-mono">{item.nomorSPP}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.uraian}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(item.jumlah)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Detail Form */}
              <div className="p-4 space-y-3 bg-muted/10">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-20 shrink-0">No SPP</Label>
                      <Input className="h-7 text-[11px]" value={mode !== "view" ? form.nomorSPP : selected?.nomorSPP || ""} readOnly={mode === "view"}
                        onChange={e => setForm({ ...form, nomorSPP: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-20 shrink-0">Tgl SPP</Label>
                      <Input type="date" className="h-7 text-[11px]" value={mode !== "view" ? form.tanggalSPP : selected?.tanggalSPP || ""} readOnly={mode === "view"}
                        onChange={e => setForm({ ...form, tanggalSPP: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-20 shrink-0">Uraian</Label>
                      <Input className="h-7 text-[11px]" value={mode !== "view" ? form.uraian : selected?.uraian || ""} readOnly={mode === "view"}
                        onChange={e => setForm({ ...form, uraian: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-20 shrink-0">Jumlah</Label>
                      <Input className="h-7 text-[11px] text-right font-medium" value={mode !== "view" ? form.jumlah : selected?.jumlah || 0} readOnly
                        />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-20 shrink-0">Status</Label>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-medium ${selected?.isFinal ? "text-green-600" : "text-muted-foreground"}`}>
                          {selected?.isFinal ? "✓ Final" : "Belum Final"}
                        </span>
                        {selected && mode === "view" && (
                          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={toggleFinal}>
                            {selected.isFinal ? "UnFinal" : "Set Final"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">Penerima Panjar</Label>
                      <Input className="h-7 text-[11px]" value={mode !== "view" ? form.penerimaPanjar : ""} readOnly={mode === "view"}
                        onChange={e => setForm({ ...form, penerimaPanjar: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">Nama</Label>
                      <Input className="h-7 text-[11px]" value={mode !== "view" ? form.nama : ""} readOnly={mode === "view"}
                        onChange={e => setForm({ ...form, nama: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">Kode Bank</Label>
                      <Input className="h-7 text-[11px]" value={mode !== "view" ? form.kodeBank : ""} readOnly={mode === "view"}
                        onChange={e => setForm({ ...form, kodeBank: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">No Rek Bank</Label>
                      <Input className="h-7 text-[11px]" value={mode !== "view" ? form.noRekBank : ""} readOnly={mode === "view"}
                        onChange={e => setForm({ ...form, noRekBank: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] w-24 shrink-0">Nama Bank</Label>
                      <Input className="h-7 text-[11px]" value={mode !== "view" ? form.namaBank : ""} readOnly={mode === "view"}
                        onChange={e => setForm({ ...form, namaBank: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rincian" && selected && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-secondary/20 flex items-center justify-between">
                <div className="text-[11px]">
                  <span className="font-semibold">Nomor SPP:</span> <span className="font-mono">{selected.nomorSPP}</span>
                  <span className="ml-6 font-semibold">Rp {fmt(selected.jumlah)}</span>
                </div>
              </div>

              {/* Rincian Table */}
              <div className="flex-1 overflow-auto border-b border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 text-[11px]">
                      <TableHead className="font-semibold">Kd_Rincian</TableHead>
                      <TableHead className="font-semibold">NoID</TableHead>
                      <TableHead className="font-semibold">Nama_Rincian</TableHead>
                      <TableHead className="font-semibold">Sumber</TableHead>
                      <TableHead className="font-semibold text-right">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.rincian.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-xs">Belum ada rincian</TableCell></TableRow>
                    ) : selected.rincian.map((r, idx) => (
                      <TableRow key={r.id} className={`cursor-pointer text-[11px] ${selectedRincian?.id === r.id ? "bg-primary/10" : "hover:bg-muted/50"}`}
                        onClick={() => setSelectedRincian(r)}>
                        <TableCell className="font-mono">{r.kodeRekening}</TableCell>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{r.namaRekening}</TableCell>
                        <TableCell>DDS</TableCell>
                        <TableCell className="text-right font-medium">{fmt(r.nilai)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Rincian Detail Form */}
              <div className="p-4 space-y-2 bg-muted/10">
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] w-24 shrink-0">Rincian</Label>
                  <Select value={rincianMode !== "view" ? rincianForm.kodeRekening : selectedRincian?.kodeRekening || ""}
                    disabled={rincianMode === "view"}
                    onValueChange={v => {
                      const r = rekeningBelanja.find(x => x.kode === v);
                      setRincianForm({ ...rincianForm, kodeRekening: v, namaRekening: r?.uraian || "" });
                    }}>
                    <SelectTrigger className="h-7 text-[11px] flex-1"><SelectValue placeholder="Pilih Rekening" /></SelectTrigger>
                    <SelectContent>{rekeningBelanja.map(r => <SelectItem key={r.kode} value={r.kode}>{r.kode} — {r.uraian}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] w-24 shrink-0">Nama Rincian</Label>
                  <Input className="h-7 text-[11px]" readOnly value={rincianMode !== "view" ? rincianForm.namaRekening : selectedRincian?.namaRekening || ""} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] w-24 shrink-0">Nilai</Label>
                  <Input type="number" className="h-7 text-[11px] text-right" disabled={rincianMode === "view"}
                    value={rincianMode !== "view" ? rincianForm.nilai || "" : selectedRincian?.nilai || ""}
                    onChange={e => setRincianForm({ ...rincianForm, nilai: Number(e.target.value) })} />
                </div>
              </div>

              {/* Rincian Action Bar */}
              <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleTambahRincian}><Plus size={12} />Tambah</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleUbahRincian}><Pencil size={12} />Ubah</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleHapusRincian}><Trash2 size={12} />Hapus</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => { setRincianMode("view"); setSelectedRincian(null); }}><X size={12} />Batal</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleSimpanRincian}><Save size={12} />Simpan</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Printer size={12} />Cetak</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setActiveTab("spp")}><DoorOpen size={12} />Tutup</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Action Bar */}
      {activeTab === "spp" && (
        <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleTambah}><Plus size={12} />Tambah</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleUbah}><Pencil size={12} />Ubah</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleHapus}><Trash2 size={12} />Hapus</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleBatal}><X size={12} />Batal</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleSimpan}><Save size={12} />Simpan</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Printer size={12} />Cetak</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => window.history.back()}><DoorOpen size={12} />Tutup</Button>
        </div>
      )}
    </div>
  );
}
