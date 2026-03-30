import { useState } from "react";
import FormPageHeader from "@/components/FormPageHeader";
import { bidangKegiatanData, sumberDanaData, type KegiatanAnggaran, type OutputItem } from "@/data/siskeudes-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Package } from "lucide-react";
import { toast } from "sonner";

export default function PenganggaranAPBDesa() {
  const [kegiatanList, setKegiatanList] = useState<KegiatanAnggaran[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [outputDialogOpen, setOutputDialogOpen] = useState(false);
  const [selectedKegiatanId, setSelectedKegiatanId] = useState<string | null>(null);

  const [selectedBidang, setSelectedBidang] = useState("");
  const [selectedSubBidang, setSelectedSubBidang] = useState("");
  const [selectedKegiatan, setSelectedKegiatan] = useState("");

  const [form, setForm] = useState({
    waktuPelaksanaan: "",
    namaPelaksana: "",
    jabatanPelaksana: "",
    keluaran: "",
    volumeKeluaran: "",
    sumberDana: "",
    paguAnggaran: 0,
  });

  const [outputForm, setOutputForm] = useState<Omit<OutputItem, "id">>({
    namaPaket: "",
    nilai: 0,
    targetOutput: "",
    satuan: "",
    sumberDana: "",
    keterangan: "",
  });

  const bidangs = bidangKegiatanData.filter((i) => i.level === "bidang");
  const subBidangs = bidangKegiatanData.filter(
    (i) => i.level === "sub_bidang" && i.kode.startsWith(selectedBidang + ".")
  );
  const kegiatans = bidangKegiatanData.filter(
    (i) => i.level === "kegiatan" && i.kode.startsWith(selectedSubBidang.replace(/\.$/, "") + ".")
  );

  const resetForm = () => {
    setSelectedBidang("");
    setSelectedSubBidang("");
    setSelectedKegiatan("");
    setForm({ waktuPelaksanaan: "", namaPelaksana: "", jabatanPelaksana: "", keluaran: "", volumeKeluaran: "", sumberDana: "", paguAnggaran: 0 });
  };

  const handleAddKegiatan = () => {
    const keg = bidangKegiatanData.find((i) => i.kode === selectedKegiatan);
    if (!keg) return toast.error("Pilih kegiatan terlebih dahulu");

    const newKegiatan: KegiatanAnggaran = {
      id: crypto.randomUUID(),
      kodeBidang: selectedBidang,
      kodeSubBidang: selectedSubBidang,
      kodeKegiatan: selectedKegiatan,
      namaKegiatan: keg.nama,
      ...form,
      outputItems: [],
    };
    setKegiatanList((prev) => [...prev, newKegiatan]);
    setDialogOpen(false);
    resetForm();
    trackFormProgress("penganggaran");
    toast.success("Kegiatan berhasil ditambahkan");
  };

  const handleDeleteKegiatan = (id: string) => {
    setKegiatanList((prev) => prev.filter((k) => k.id !== id));
    toast.success("Kegiatan dihapus");
  };

  const handleAddOutput = () => {
    if (!selectedKegiatanId) return;
    const newOutput: OutputItem = { id: crypto.randomUUID(), ...outputForm };
    setKegiatanList((prev) =>
      prev.map((k) =>
        k.id === selectedKegiatanId ? { ...k, outputItems: [...k.outputItems, newOutput] } : k
      )
    );
    setOutputDialogOpen(false);
    setOutputForm({ namaPaket: "", nilai: 0, targetOutput: "", satuan: "", sumberDana: "", keterangan: "" });
    toast.success("Output/paket ditambahkan");
  };

  const totalAnggaran = kegiatanList.reduce((sum, k) => sum + k.paguAnggaran, 0);

  return (
    <div>
      <FormPageHeader title="Penganggaran APBDesa" subtitle="Data kegiatan dan anggaran belanja desa">
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} /> Tambah Kegiatan
        </Button>
      </FormPageHeader>

      <div className="p-6 space-y-4">
        {/* Summary */}
        <div className="flex gap-4">
          <div className="stat-card flex-1">
            <p className="text-xs text-muted-foreground">Total Kegiatan</p>
            <p className="text-2xl font-bold font-heading">{kegiatanList.length}</p>
          </div>
          <div className="stat-card flex-1">
            <p className="text-xs text-muted-foreground">Total Pagu Anggaran</p>
            <p className="text-2xl font-bold font-heading text-primary">
              Rp {totalAnggaran.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Kegiatan Table */}
        {kegiatanList.length === 0 ? (
          <div className="content-card p-12 text-center">
            <Package size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Belum ada kegiatan. Klik "Tambah Kegiatan" untuk mulai.</p>
          </div>
        ) : (
          <div className="content-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="font-semibold">Kode</TableHead>
                  <TableHead className="font-semibold">Nama Kegiatan</TableHead>
                  <TableHead className="font-semibold">Pelaksana</TableHead>
                  <TableHead className="font-semibold">Sumber Dana</TableHead>
                  <TableHead className="font-semibold text-right">Pagu (Rp)</TableHead>
                  <TableHead className="font-semibold text-center">Output</TableHead>
                  <TableHead className="font-semibold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kegiatanList.map((keg) => (
                  <TableRow key={keg.id}>
                    <TableCell>
                      <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{keg.kodeKegiatan}</span>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{keg.namaKegiatan}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{keg.namaPelaksana}</TableCell>
                    <TableCell className="text-sm">{keg.sumberDana}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{keg.paguAnggaran.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelectedKegiatanId(keg.id); setOutputDialogOpen(true); }}
                        className="gap-1 text-xs"
                      >
                        <Plus size={12} /> {keg.outputItems.length}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteKegiatan(keg.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Kegiatan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Tambah Kegiatan Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Bidang</Label>
              <Select value={selectedBidang} onValueChange={(v) => { setSelectedBidang(v); setSelectedSubBidang(""); setSelectedKegiatan(""); }}>
                <SelectTrigger><SelectValue placeholder="Pilih Bidang" /></SelectTrigger>
                <SelectContent>
                  {bidangs.map((b) => (
                    <SelectItem key={b.kode} value={b.kode}>{b.kode} — {b.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBidang && (
              <div>
                <Label className="text-xs">Sub Bidang</Label>
                <Select value={selectedSubBidang} onValueChange={(v) => { setSelectedSubBidang(v); setSelectedKegiatan(""); }}>
                  <SelectTrigger><SelectValue placeholder="Pilih Sub Bidang" /></SelectTrigger>
                  <SelectContent>
                    {subBidangs.map((s) => (
                      <SelectItem key={s.kode} value={s.kode}>{s.kode} — {s.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedSubBidang && (
              <div>
                <Label className="text-xs">Kegiatan</Label>
                <Select value={selectedKegiatan} onValueChange={setSelectedKegiatan}>
                  <SelectTrigger><SelectValue placeholder="Pilih Kegiatan" /></SelectTrigger>
                  <SelectContent>
                    {kegiatans.map((k) => (
                      <SelectItem key={k.kode} value={k.kode}>{k.kode} — {k.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Waktu Pelaksanaan</Label>
                <Input value={form.waktuPelaksanaan} onChange={(e) => setForm({ ...form, waktuPelaksanaan: e.target.value })} placeholder="Contoh: Januari - Desember" />
              </div>
              <div>
                <Label className="text-xs">Sumber Dana</Label>
                <Select value={form.sumberDana} onValueChange={(v) => setForm({ ...form, sumberDana: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih Sumber Dana" /></SelectTrigger>
                  <SelectContent>
                    {sumberDanaData.map((s) => (
                      <SelectItem key={s.kode} value={s.kode}>{s.kode} — {s.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Nama Pelaksana</Label>
                <Input value={form.namaPelaksana} onChange={(e) => setForm({ ...form, namaPelaksana: e.target.value })} placeholder="Nama pelaksana kegiatan" />
              </div>
              <div>
                <Label className="text-xs">Jabatan Pelaksana</Label>
                <Input value={form.jabatanPelaksana} onChange={(e) => setForm({ ...form, jabatanPelaksana: e.target.value })} placeholder="Jabatan" />
              </div>
              <div>
                <Label className="text-xs">Keluaran</Label>
                <Input value={form.keluaran} onChange={(e) => setForm({ ...form, keluaran: e.target.value })} placeholder="Deskripsi keluaran" />
              </div>
              <div>
                <Label className="text-xs">Volume Keluaran</Label>
                <Input value={form.volumeKeluaran} onChange={(e) => setForm({ ...form, volumeKeluaran: e.target.value })} placeholder="Jumlah & satuan" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Pagu Anggaran (Rp)</Label>
                <Input type="number" value={form.paguAnggaran || ""} onChange={(e) => setForm({ ...form, paguAnggaran: Number(e.target.value) })} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddKegiatan}>Simpan Kegiatan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Output Dialog */}
      <Dialog open={outputDialogOpen} onOpenChange={setOutputDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Tambah Output / Paket Kegiatan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nama Paket</Label>
              <Input value={outputForm.namaPaket} onChange={(e) => setOutputForm({ ...outputForm, namaPaket: e.target.value })} placeholder="Nama paket output" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Nilai (Rp)</Label>
                <Input type="number" value={outputForm.nilai || ""} onChange={(e) => setOutputForm({ ...outputForm, nilai: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Target Output</Label>
                <Input value={outputForm.targetOutput} onChange={(e) => setOutputForm({ ...outputForm, targetOutput: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Satuan</Label>
                <Input value={outputForm.satuan} onChange={(e) => setOutputForm({ ...outputForm, satuan: e.target.value })} placeholder="Unit, Paket, OB..." />
              </div>
              <div>
                <Label className="text-xs">Sumber Dana</Label>
                <Select value={outputForm.sumberDana} onValueChange={(v) => setOutputForm({ ...outputForm, sumberDana: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    {sumberDanaData.map((s) => (
                      <SelectItem key={s.kode} value={s.kode}>{s.kode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Keterangan</Label>
              <Input value={outputForm.keterangan} onChange={(e) => setOutputForm({ ...outputForm, keterangan: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutputDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddOutput}>Tambah Output</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
