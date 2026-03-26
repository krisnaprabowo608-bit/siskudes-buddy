import { useState, useEffect } from "react";
import { loadState, saveState, type PencairanSPP, type SPPItem } from "@/data/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function PencairanSPPPage() {
  const [pencairan, setPencairan] = useState<PencairanSPP[]>([]);
  const [sppList, setSppList] = useState<SPPItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    sppId: "", tanggal: "", noCek: "",
    pembayaran: "bank" as "tunai" | "bank",
    jumlah: 0, potongan: 0,
  });

  useEffect(() => {
    const state = loadState();
    setPencairan(state.pencairan);
    setSppList(state.spp.filter(s => s.isFinal));
  }, []);

  const save = (newItems: PencairanSPP[]) => {
    setPencairan(newItems);
    const state = loadState();
    state.pencairan = newItems;
    saveState(state);
  };

  const handleSave = () => {
    if (!form.sppId) return toast.error("Pilih SPP yang akan dicairkan");
    const spp = sppList.find(s => s.id === form.sppId);
    const netto = form.jumlah - form.potongan;
    const count = pencairan.length + 1;
    save([...pencairan, {
      id: crypto.randomUUID(),
      sppId: form.sppId,
      nomorPencairan: `${String(count).padStart(4, "0")}/BANK/05.2001/2024`,
      tanggal: form.tanggal,
      noCek: form.noCek,
      pembayaran: form.pembayaran,
      jumlah: form.jumlah || spp?.jumlah || 0,
      potongan: form.potongan,
      netto,
    }]);
    setDialogOpen(false);
    setForm({ sppId: "", tanggal: "", noCek: "", pembayaran: "bank", jumlah: 0, potongan: 0 });
    toast.success("SPP berhasil dicairkan");
  };

  const getSPPInfo = (sppId: string) => {
    const state = loadState();
    return state.spp.find(s => s.id === sppId);
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">Pencairan SPP</h1>
          <p className="text-sm text-muted-foreground">Pencairan SPP yang sudah final di Kas Desa</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus size={16} /> Cairkan SPP</Button>
      </div>
      <div className="p-6">
        <div className="content-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">No. Pencairan</TableHead>
                <TableHead className="font-semibold">Tanggal</TableHead>
                <TableHead className="font-semibold">No. SPP</TableHead>
                <TableHead className="font-semibold">Pembayaran</TableHead>
                <TableHead className="font-semibold text-right">Jumlah (Rp)</TableHead>
                <TableHead className="font-semibold text-right">Potongan (Rp)</TableHead>
                <TableHead className="font-semibold text-right">Netto (Rp)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pencairan.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Belum ada pencairan. Buat SPP Final terlebih dahulu.</TableCell></TableRow>
              ) : pencairan.map(item => {
                const spp = getSPPInfo(item.sppId);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs font-mono">{item.nomorPencairan}</TableCell>
                    <TableCell className="text-sm">{item.tanggal}</TableCell>
                    <TableCell className="text-xs font-mono">{spp?.nomorSPP || "-"}</TableCell>
                    <TableCell className="text-sm capitalize">{item.pembayaran}</TableCell>
                    <TableCell className="text-sm text-right">{item.jumlah.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-sm text-right text-destructive">{item.potongan.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-sm text-right font-bold">{item.netto.toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Cairkan SPP</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">SPP Final</Label>
              <Select value={form.sppId} onValueChange={v => { const spp = sppList.find(s => s.id === v); setForm({...form, sppId: v, jumlah: spp?.jumlah || 0}); }}>
                <SelectTrigger><SelectValue placeholder="Pilih SPP yang sudah Final" /></SelectTrigger>
                <SelectContent>{sppList.map(s => <SelectItem key={s.id} value={s.id}>{s.nomorSPP} — Rp {s.jumlah.toLocaleString("id-ID")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Tanggal</Label><Input type="date" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} /></div>
              <div><Label className="text-xs">No. Cek</Label><Input value={form.noCek} onChange={e => setForm({...form, noCek: e.target.value})} /></div>
            </div>
            <div>
              <Label className="text-xs">Pembayaran</Label>
              <Select value={form.pembayaran} onValueChange={v => setForm({...form, pembayaran: v as "tunai" | "bank"})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tunai">Tunai</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="text-xs">Jumlah (Rp)</Label><Input type="number" value={form.jumlah || ""} onChange={e => setForm({...form, jumlah: Number(e.target.value)})} /></div>
              <div><Label className="text-xs">Potongan (Rp)</Label><Input type="number" value={form.potongan || ""} onChange={e => setForm({...form, potongan: Number(e.target.value)})} /></div>
              <div><Label className="text-xs">Netto (Rp)</Label><Input type="number" value={form.jumlah - form.potongan} readOnly className="bg-muted" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Cairkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
