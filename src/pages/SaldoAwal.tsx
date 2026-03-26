import { useState, useEffect } from "react";
import { getRekeningDetail } from "@/data/rekening-data";
import { loadState, saveState, type SaldoAwalItem } from "@/data/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { rekeningData } from "@/data/rekening-data";

export default function SaldoAwal() {
  const [items, setItems] = useState<SaldoAwalItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const allDetailRekening = rekeningData.filter(r => r.level === 3);

  const [form, setForm] = useState({ kodeRekening: "", namaRekening: "", debet: 0, kredit: 0 });

  useEffect(() => { setItems(loadState().saldoAwal); }, []);

  const save = (newItems: SaldoAwalItem[]) => {
    setItems(newItems);
    const state = loadState();
    state.saldoAwal = newItems;
    saveState(state);
  };

  const handleSave = () => {
    if (!form.kodeRekening) return toast.error("Pilih rekening");
    save([...items, { id: crypto.randomUUID(), ...form }]);
    setDialogOpen(false);
    setForm({ kodeRekening: "", namaRekening: "", debet: 0, kredit: 0 });
    toast.success("Saldo awal ditambahkan");
  };

  const totalDebet = items.reduce((s, i) => s + i.debet, 0);
  const totalKredit = items.reduce((s, i) => s + i.kredit, 0);
  const isBalanced = totalDebet === totalKredit;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">Saldo Awal Kekayaan Desa</h1>
          <p className="text-sm text-muted-foreground">Neraca awal desa — debet harus sama dengan kredit</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus size={16} /> Tambah</Button>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card"><p className="text-xs text-muted-foreground">Total Debet</p><p className="text-xl font-bold font-heading text-primary">Rp {totalDebet.toLocaleString("id-ID")}</p></div>
          <div className="stat-card"><p className="text-xs text-muted-foreground">Total Kredit</p><p className="text-xl font-bold font-heading text-info">Rp {totalKredit.toLocaleString("id-ID")}</p></div>
          <div className="stat-card"><p className="text-xs text-muted-foreground">Status</p><p className={`text-xl font-bold font-heading ${isBalanced ? "text-success" : "text-destructive"}`}>{isBalanced ? "✓ Seimbang" : "✗ Tidak Seimbang"}</p></div>
        </div>

        <div className="content-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">Kode Rekening</TableHead>
                <TableHead className="font-semibold">Nama Rekening</TableHead>
                <TableHead className="font-semibold text-right">Debet (Rp)</TableHead>
                <TableHead className="font-semibold text-right">Kredit (Rp)</TableHead>
                <TableHead className="font-semibold text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada saldo awal</TableCell></TableRow>
              ) : items.map(item => (
                <TableRow key={item.id}>
                  <TableCell><span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{item.kodeRekening}</span></TableCell>
                  <TableCell className="text-sm">{item.namaRekening}</TableCell>
                  <TableCell className="text-sm text-right font-medium">{item.debet > 0 ? item.debet.toLocaleString("id-ID") : "0"}</TableCell>
                  <TableCell className="text-sm text-right font-medium">{item.kredit > 0 ? item.kredit.toLocaleString("id-ID") : "0"}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" onClick={() => { save(items.filter(i => i.id !== item.id)); }}><Trash2 size={14} className="text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length > 0 && (
                <TableRow className="bg-secondary/30 font-bold">
                  <TableCell colSpan={2} className="text-right">Jumlah</TableCell>
                  <TableCell className="text-right">{totalDebet.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right">{totalKredit.toLocaleString("id-ID")}</TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Tambah Saldo Awal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Rekening</Label>
              <Select value={form.kodeRekening} onValueChange={v => { const r = allDetailRekening.find(x => x.kode === v); setForm({...form, kodeRekening: v, namaRekening: r?.uraian || ""}); }}>
                <SelectTrigger><SelectValue placeholder="Pilih Rekening" /></SelectTrigger>
                <SelectContent>{allDetailRekening.map(r => <SelectItem key={r.kode} value={r.kode}>{r.kode} — {r.uraian}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Debet (Rp)</Label><Input type="number" value={form.debet || ""} onChange={e => setForm({...form, debet: Number(e.target.value)})} /></div>
              <div><Label className="text-xs">Kredit (Rp)</Label><Input type="number" value={form.kredit || ""} onChange={e => setForm({...form, kredit: Number(e.target.value)})} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
