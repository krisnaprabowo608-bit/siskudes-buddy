import { useState, useEffect } from "react";
import { defaultDesaProfile, type DesaProfile } from "@/data/siskeudes-data";
import { villageProfiles } from "@/data/village-profiles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, MapPin } from "lucide-react";
import { upsertSession } from "@/lib/session-manager";

export default function DataUmumDesa() {
  const [selectedVillage, setSelectedVillage] = useState<string>("");
  const [userName, setUserName] = useState("");
  const [profile, setProfile] = useState<DesaProfile>(() => {
    try {
      const saved = localStorage.getItem('siskeudes_desa_profile');
      return saved ? { ...defaultDesaProfile, ...JSON.parse(saved) } : defaultDesaProfile;
    } catch { return defaultDesaProfile; }
  });

  // Load saved selection
  useEffect(() => {
    const savedVillage = localStorage.getItem('siskeudes_selected_village');
    const savedName = localStorage.getItem('siskeudes_user_name');
    if (savedVillage) setSelectedVillage(savedVillage);
    if (savedName) setUserName(savedName);
  }, []);

  const handleVillageSelect = (villageId: string) => {
    setSelectedVillage(villageId);
    const village = villageProfiles.find((v) => v.id === villageId);
    if (village) {
      setProfile(village.profile);
    }
  };

  const update = (key: keyof DesaProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!userName.trim()) {
      toast.error("Nama pengisi harus diisi!");
      return;
    }
    if (!selectedVillage) {
      toast.error("Pilih desa terlebih dahulu!");
      return;
    }
    localStorage.setItem('siskeudes_desa_profile', JSON.stringify(profile));
    localStorage.setItem('siskeudes_selected_village', selectedVillage);
    localStorage.setItem('siskeudes_user_name', userName);

    // Track in database
    await upsertSession({
      user_name: userName,
      village_id: selectedVillage,
      village_name: profile.namaDesa,
      form_progress: { data_umum: true },
    });

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
        <div className="content-card p-6 space-y-6">
          {/* Village Selection & User Name */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">Pilih Desa & Identitas Pengisi</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pilih Desa *</Label>
                <Select value={selectedVillage} onValueChange={handleVillageSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Pilih Desa --" />
                  </SelectTrigger>
                  <SelectContent>
                    {villageProfiles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        Desa {v.profile.namaDesa} — {v.profile.kecamatan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nama Pengisi / User *</Label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                />
              </div>
            </div>
          </div>

          {/* Profile Fields */}
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
