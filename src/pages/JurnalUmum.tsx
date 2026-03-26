import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JurnalEntry {
  id: string;
  tanggal: string;
  kodeBukti: string;
  nomorBukti: string;
  uraian: string;
  posting: boolean;
  rincian: { kodeRekening: string; uraian: string; debet: number; kredit: number }[];
}

const STORAGE_KEY = 'siskeudes_jurnal';

function loadJurnal(): JurnalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveJurnal(data: JurnalEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function JurnalUmum() {
  const [entries, setEntries] = useState(loadJurnal());
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<JurnalEntry | null>(null);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    kodeBukti: "JU-00001",
    nomorBukti: "",
    uraian: "",
    rincian: [{ kodeRekening: "", uraian: "", debet: 0, kredit: 0 }],
  });

  const totalDebet = form.rincian.reduce((s, r) => s + r.debet, 0);
  const totalKredit = form.rincian.reduce((s, r) => s + r.kredit, 0);

  const addRincian = () => {
    setForm({ ...form, rincian: [...form.rincian, { kodeRekening: "", uraian: "", debet: 0, kredit: 0 }] });
  };

  const updateRincian = (i: number, field: string, value: string | number) => {
    const updated = [...form.rincian];
    (updated[i] as any)[field] = value;
    setForm({ ...form, rincian: updated });
  };

  const handleSave = () => {
    if (totalDebet !== totalKredit) {
      alert("Debet dan Kredit harus seimbang!");
      return;
    }
    const entry: JurnalEntry = {
      id: Date.now().toString(),
      ...form,
      posting: false,
    };
    const updated = [...entries, entry];
    saveJurnal(updated);
    setEntries(updated);
    setShowForm(false);
  };

  const togglePosting = (id: string) => {
    const updated = entries.map(e => e.id === id ? { ...e, posting: !e.posting } : e);
    saveJurnal(updated);
    setEntries(updated);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    saveJurnal(updated);
    setEntries(updated);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="page-header">
        <h1 className="text-lg font-bold font-heading">JURNAL UMUM KEUANGAN DESA</h1>
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
                  <th className="px-3 py-2 text-left border-b border-border/60">Kode Bukti</th>
                  <th className="px-3 py-2 text-left border-b border-border/60">Nomor Bukti/Ref</th>
                  <th className="px-3 py-2 text-left border-b border-border/60">Uraian</th>
                  <th className="px-3 py-2 text-right border-b border-border/60">Debet</th>
                  <th className="px-3 py-2 text-right border-b border-border/60">Kredit</th>
                  <th className="px-3 py-2 text-center border-b border-border/60">Posting</th>
                  <th className="px-3 py-2 text-center border-b border-border/60">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Belum ada jurnal</td></tr>
                ) : (
                  entries.map(e => {
                    const d = e.rincian.reduce((s, r) => s + r.debet, 0);
                    const k = e.rincian.reduce((s, r) => s + r.kredit, 0);
                    return (
                      <tr key={e.id} className="border-b border-border/40 hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(selected?.id === e.id ? null : e)}>
                        <td className="px-3 py-2">{e.tanggal}</td>
                        <td className="px-3 py-2">{e.kodeBukti}</td>
                        <td className="px-3 py-2">{e.nomorBukti}</td>
                        <td className="px-3 py-2">{e.uraian}</td>
                        <td className="px-3 py-2 text-right">{d.toLocaleString('id-ID')}</td>
                        <td className="px-3 py-2 text-right">{k.toLocaleString('id-ID')}</td>
                        <td className="px-3 py-2 text-center">
                          <Button size="sm" variant={e.posting ? "default" : "outline"} onClick={(ev) => { ev.stopPropagation(); togglePosting(e.id); }} className="text-[10px] h-5 px-2">
                            {e.posting ? "Posted" : "Belum"}
                          </Button>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Button size="sm" variant="destructive" onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }} className="text-[10px] h-5 px-2">Hapus</Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="content-card p-4">
            <h3 className="text-sm font-bold mb-2">Rincian Jurnal: {selected.kodeBukti}</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-1 text-left border-b border-border/60">Kd Rekening</th>
                  <th className="px-3 py-1 text-left border-b border-border/60">Uraian</th>
                  <th className="px-3 py-1 text-right border-b border-border/60">Debet</th>
                  <th className="px-3 py-1 text-right border-b border-border/60">Kredit</th>
                </tr>
              </thead>
              <tbody>
                {selected.rincian.map((r, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="px-3 py-1">{r.kodeRekening}</td>
                    <td className="px-3 py-1">{r.uraian}</td>
                    <td className="px-3 py-1 text-right">{r.debet > 0 ? r.debet.toLocaleString('id-ID') : ''}</td>
                    <td className="px-3 py-1 text-right">{r.kredit > 0 ? r.kredit.toLocaleString('id-ID') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="content-card p-4 space-y-3">
            <h3 className="text-sm font-bold font-heading">Form Jurnal Umum</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label className="text-xs">Tanggal</Label><Input type="date" value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} className="text-xs h-8" /></div>
              <div><Label className="text-xs">Kode Bukti</Label><Input value={form.kodeBukti} onChange={e => setForm({...form, kodeBukti: e.target.value})} className="text-xs h-8" /></div>
              <div><Label className="text-xs">Nomor Bukti/Ref</Label><Input value={form.nomorBukti} onChange={e => setForm({...form, nomorBukti: e.target.value})} className="text-xs h-8" /></div>
              <div><Label className="text-xs">Uraian</Label><Input value={form.uraian} onChange={e => setForm({...form, uraian: e.target.value})} className="text-xs h-8" /></div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-bold">Rincian Jurnal</Label>
                <Button size="sm" variant="outline" onClick={addRincian} className="text-xs h-6">+ Baris</Button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-2 py-1 text-left">Kd Rekening</th>
                    <th className="px-2 py-1 text-left">Uraian</th>
                    <th className="px-2 py-1 text-right">Debet</th>
                    <th className="px-2 py-1 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {form.rincian.map((r, i) => (
                    <tr key={i}>
                      <td className="px-1 py-1"><Input value={r.kodeRekening} onChange={e => updateRincian(i, "kodeRekening", e.target.value)} className="text-xs h-7" /></td>
                      <td className="px-1 py-1"><Input value={r.uraian} onChange={e => updateRincian(i, "uraian", e.target.value)} className="text-xs h-7" /></td>
                      <td className="px-1 py-1"><Input type="number" value={r.debet} onChange={e => updateRincian(i, "debet", Number(e.target.value))} className="text-xs h-7 text-right" /></td>
                      <td className="px-1 py-1"><Input type="number" value={r.kredit} onChange={e => updateRincian(i, "kredit", Number(e.target.value))} className="text-xs h-7 text-right" /></td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-muted/30">
                    <td colSpan={2} className="px-2 py-1 text-right">Jumlah:</td>
                    <td className="px-2 py-1 text-right">{totalDebet.toLocaleString('id-ID')}</td>
                    <td className="px-2 py-1 text-right">{totalKredit.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
              {totalDebet !== totalKredit && (
                <p className="text-destructive text-xs mt-1">⚠️ Debet dan Kredit tidak seimbang!</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleSave} disabled={totalDebet !== totalKredit}>Simpan</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
