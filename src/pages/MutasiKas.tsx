import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MutasiKasItem {
  id: string;
  tanggal: string;
  noBukti: string;
  jenis: 'setor' | 'ambil';
  uraian: string;
  jumlah: number;
  rekening: string;
  namaBank: string;
}

const STORAGE_KEY = 'siskeudes_mutasi_kas';

function loadMutasi(): MutasiKasItem[] {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveMutasi(d: MutasiKasItem[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

export default function MutasiKas() {
  const [items, setItems] = useState(loadMutasi());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<MutasiKasItem, 'id'>>({
    tanggal: new Date().toISOString().split("T")[0], noBukti: "", jenis: "setor", uraian: "", jumlah: 0, rekening: "", namaBank: "",
  });

  const handleSave = () => {
    const updated = [...items, { id: Date.now().toString(), ...form }];
    saveMutasi(updated);
    setItems(updated);
    setShowForm(false);
    setForm({ tanggal: new Date().toISOString().split("T")[0], noBukti: "", jenis: "setor", uraian: "", jumlah: 0, rekening: "", namaBank: "" });
  };

  const handleDelete = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    saveMutasi(updated);
    setItems(updated);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="page-header">
        <h1 className="text-lg font-bold font-heading">MUTASI KAS</h1>
        <p className="text-xs text-muted-foreground">Penyetoran Penerimaan ke Bank / Pengambilan dari Bank</p>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Button size="sm" onClick={() => setShowForm(true)}>Tambah</Button>

        <div className="content-card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-2 text-left border-b border-border/60">Tanggal</th>
                <th className="px-3 py-2 text-left border-b border-border/60">No Bukti</th>
                <th className="px-3 py-2 text-center border-b border-border/60">Jenis</th>
                <th className="px-3 py-2 text-left border-b border-border/60">Uraian</th>
                <th className="px-3 py-2 text-right border-b border-border/60">Jumlah</th>
                <th className="px-3 py-2 text-left border-b border-border/60">Rekening</th>
                <th className="px-3 py-2 text-left border-b border-border/60">Nama Bank</th>
                <th className="px-3 py-2 text-center border-b border-border/60">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Belum ada data</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="px-3 py-2">{item.tanggal}</td>
                  <td className="px-3 py-2">{item.noBukti}</td>
                  <td className="px-3 py-2 text-center capitalize">{item.jenis === 'setor' ? 'Setor ke Bank' : 'Ambil dari Bank'}</td>
                  <td className="px-3 py-2">{item.uraian}</td>
                  <td className="px-3 py-2 text-right">{item.jumlah.toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2">{item.rekening}</td>
                  <td className="px-3 py-2">{item.namaBank}</td>
                  <td className="px-3 py-2 text-center"><Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Hapus</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="content-card p-4 space-y-3">
            <h3 className="text-sm font-bold font-heading">Form Mutasi Kas</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><Label className="text-xs">Tanggal</Label><Input type="date" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} className="text-xs h-8" /></div>
              <div><Label className="text-xs">No Bukti</Label><Input value={form.noBukti} onChange={e => setForm({...form, noBukti: e.target.value})} className="text-xs h-8" placeholder="0001/STS/05.2001/2024" /></div>
              <div>
                <Label className="text-xs">Jenis</Label>
                <Select value={form.jenis} onValueChange={v => setForm({...form, jenis: v as any})}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="setor" className="text-xs">Setor ke Bank</SelectItem>
                    <SelectItem value="ambil" className="text-xs">Ambil dari Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Uraian</Label><Input value={form.uraian} onChange={e => setForm({...form, uraian: e.target.value})} className="text-xs h-8" /></div>
              <div><Label className="text-xs">Jumlah</Label><Input type="number" value={form.jumlah} onChange={e => setForm({...form, jumlah: Number(e.target.value)})} className="text-xs h-8" /></div>
              <div><Label className="text-xs">Rekening Bank</Label><Input value={form.rekening} onChange={e => setForm({...form, rekening: e.target.value})} className="text-xs h-8" /></div>
              <div><Label className="text-xs">Nama Bank</Label><Input value={form.namaBank} onChange={e => setForm({...form, namaBank: e.target.value})} className="text-xs h-8" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleSave}>Simpan</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
