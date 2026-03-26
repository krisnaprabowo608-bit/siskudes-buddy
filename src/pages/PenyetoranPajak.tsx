import { useState } from "react";
import { loadState, saveState, PenyetoranPajak as PenyetoranPajakItem } from "@/data/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { rekeningData } from "@/data/rekening-data";

export default function PenyetoranPajak() {
  const [state, setState] = useState(loadState());
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<PenyetoranPajakItem | null>(null);

  const pajakRekening = rekeningData.filter(r => r.kode.startsWith("7.1"));

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    noBukti: "",
    kodeRekening: "",
    kodeMAP: "",
    keterangan: "",
    jumlah: 0,
    ntpn: "",
    jenis: "tunai" as "tunai" | "bank",
  });

  // Get bukti potong from SPP items
  const allBuktiPotong = state.spp
    .flatMap(s => s.buktiTransaksi)
    .flatMap(bt => bt.potonganPajak.map(p => ({
      noBukti: bt.noBukti,
      kodeRekening: p.kodeRekening,
      namaRekening: p.namaRekening,
      nilai: p.nilai,
    })));

  const [selectedBuktiPotong, setSelectedBuktiPotong] = useState<typeof allBuktiPotong>([]);

  const handleSave = () => {
    const newItem: PenyetoranPajakItem = {
      id: Date.now().toString(),
      ...form,
      rincianBuktiPotong: selectedBuktiPotong,
    };
    const newState = { ...state, penyetoranPajak: [...state.penyetoranPajak, newItem] };
    saveState(newState);
    setState(newState);
    setShowForm(false);
    setForm({ tanggal: new Date().toISOString().split("T")[0], noBukti: "", kodeRekening: "", kodeMAP: "", keterangan: "", jumlah: 0, ntpn: "", jenis: "tunai" });
    setSelectedBuktiPotong([]);
  };

  const handleDelete = (id: string) => {
    const newState = { ...state, penyetoranPajak: state.penyetoranPajak.filter(p => p.id !== id) };
    saveState(newState);
    setState(newState);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="page-header">
        <h1 className="text-lg font-bold font-heading">DATA PENYETORAN PAJAK</h1>
        <p className="text-xs text-muted-foreground">Desa Simulasi</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowForm(true)}>Tambah</Button>
        </div>

        <div className="content-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left border-b border-border/60">Tanggal</th>
                  <th className="px-3 py-2 text-left border-b border-border/60">No Bukti</th>
                  <th className="px-3 py-2 text-left border-b border-border/60">Kode MAP</th>
                  <th className="px-3 py-2 text-left border-b border-border/60">Keterangan</th>
                  <th className="px-3 py-2 text-right border-b border-border/60">Jumlah</th>
                  <th className="px-3 py-2 text-left border-b border-border/60">NTPN</th>
                  <th className="px-3 py-2 text-center border-b border-border/60">Jenis</th>
                  <th className="px-3 py-2 text-center border-b border-border/60">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {state.penyetoranPajak.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Belum ada data penyetoran pajak</td></tr>
                ) : (
                  state.penyetoranPajak.map(item => (
                    <tr key={item.id} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="px-3 py-2">{item.tanggal}</td>
                      <td className="px-3 py-2">{item.noBukti}</td>
                      <td className="px-3 py-2">{item.kodeMAP}</td>
                      <td className="px-3 py-2">{item.keterangan}</td>
                      <td className="px-3 py-2 text-right">{item.jumlah.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-2">{item.ntpn}</td>
                      <td className="px-3 py-2 text-center capitalize">{item.jenis}</td>
                      <td className="px-3 py-2 text-center">
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Hapus</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="content-card p-4 space-y-3">
            <h3 className="text-sm font-bold font-heading">Form Penyetoran Pajak</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><Label className="text-xs">Tanggal</Label><Input type="date" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} className="text-xs h-8" /></div>
              <div><Label className="text-xs">No Bukti</Label><Input value={form.noBukti} onChange={e => setForm({...form, noBukti: e.target.value})} className="text-xs h-8" placeholder="0001/SSP/05.2001/2024" /></div>
              <div>
                <Label className="text-xs">Kd Rekening Pajak</Label>
                <Select value={form.kodeRekening} onValueChange={v => setForm({...form, kodeRekening: v})}>
                  <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    {pajakRekening.map(r => <SelectItem key={r.kode} value={r.kode} className="text-xs">{r.kode} - {r.uraian}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Kode MAP</Label><Input value={form.kodeMAP} onChange={e => setForm({...form, kodeMAP: e.target.value})} className="text-xs h-8" placeholder="411211-100" /></div>
              <div><Label className="text-xs">Keterangan</Label><Input value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} className="text-xs h-8" /></div>
              <div><Label className="text-xs">Jumlah</Label><Input type="number" value={form.jumlah} onChange={e => setForm({...form, jumlah: Number(e.target.value)})} className="text-xs h-8" /></div>
              <div><Label className="text-xs">NTPN</Label><Input value={form.ntpn} onChange={e => setForm({...form, ntpn: e.target.value})} className="text-xs h-8" /></div>
              <div>
                <Label className="text-xs">Jenis</Label>
                <Select value={form.jenis} onValueChange={v => setForm({...form, jenis: v as "tunai"|"bank"})}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tunai" className="text-xs">Tunai</SelectItem>
                    <SelectItem value="bank" className="text-xs">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
