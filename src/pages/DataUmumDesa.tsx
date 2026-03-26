import { useState } from "react";
import { defaultDesaProfile, type DesaProfile } from "@/data/siskeudes-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function DataUmumDesa() {
  const [profile, setProfile] = useState<DesaProfile>(() => {
    try {
      const saved = localStorage.getItem('siskeudes_desa_profile');
      return saved ? { ...defaultDesaProfile, ...JSON.parse(saved) } : defaultDesaProfile;
    } catch { return defaultDesaProfile; }
  });

  const update = (key: keyof DesaProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('siskeudes_desa_profile', JSON.stringify(profile));
    toast.success("Data Umum Desa berhasil disimpan");
  };

  const fields: { label: string; key: keyof DesaProfile; span?: number }[] = [
    { label: "Nama Desa", key: "namaDesa" },
    { label: "Kecamatan", key: "kecamatan" },
    { label: "Kabupaten/Kota", key: "kabupaten" },
    { label: "Provinsi", key: "provinsi" },
    { label: "Tahun Anggaran", key: "tahunAnggaran" },
    { label: "NPWP Desa", key: "npwpDesa" },
    { label: "Nama Kepala Desa", key: "kepalaDesaNama" },
    { label: "NIP Kepala Desa", key: "kepalaDesaNIP" },
    { label: "Nama Sekretaris", key: "sekretarisNama" },
    { label: "NIP Sekretaris", key: "sekretarisNIP" },
    { label: "Nama Bendahara", key: "bendaharaNama" },
    { label: "NIP Bendahara", key: "bendaharaNIP" },
    { label: "Alamat Kantor Desa", key: "alamatKantor", span: 2 },
    { label: "Kode Pos", key: "kodePos" },
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading">Data Umum Desa</h1>
          <p className="text-sm text-muted-foreground">Identitas desa, perangkat, dan tahun anggaran</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save size={16} /> Simpan
        </Button>
      </div>
      <div className="p-6">
        <div className="content-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fields.map((f) => (
              <div key={f.key} className={f.span === 2 ? "md:col-span-2" : ""}>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">{f.label}</Label>
                <Input
                  value={profile[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={`Masukkan ${f.label.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
