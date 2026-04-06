import { useState, useEffect } from "react";
import { defaultDesaProfile, type DesaProfile } from "@/data/siskeudes-data";
import { villageProfiles } from "@/data/village-profiles";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, MapPin, Users, User, Crown, UserPlus } from "lucide-react";
import { upsertSession, createOrJoinGroup, getGroupMembers, getGroupForVillage } from "@/lib/session-manager";
import { useNavigate } from "react-router-dom";
import FormPageHeader from "@/components/FormPageHeader";

interface GroupMember {
  id: string;
  session_id: string;
  user_name: string;
  is_leader: boolean;
  joined_at: string;
}

export default function DataUmumDesa() {
  const navigate = useNavigate();
  const [selectedVillage, setSelectedVillage] = useState<string>("");
  const [userName, setUserName] = useState("Mahasiswa Demo");
  const [workMode, setWorkMode] = useState<"individual" | "group">("individual");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [profile, setProfile] = useState<DesaProfile>(() => {
    try {
      const saved = localStorage.getItem('siskeudes_desa_profile');
      return saved ? { ...defaultDesaProfile, ...JSON.parse(saved) } : defaultDesaProfile;
    } catch { return defaultDesaProfile; }
  });

  useEffect(() => {
    const savedVillage = localStorage.getItem('siskeudes_selected_village');
    const savedName = localStorage.getItem('siskeudes_user_name');
    const savedMode = localStorage.getItem('siskeudes_work_mode') as "individual" | "group" | null;
    const savedGroupId = localStorage.getItem('siskeudes_group_id');
    if (savedVillage) setSelectedVillage(savedVillage);
    if (savedName) setUserName(savedName);
    if (savedMode) setWorkMode(savedMode);
    if (savedGroupId) {
      setGroupId(savedGroupId);
      loadGroupMembers(savedGroupId);
    }
  }, []);

  const loadGroupMembers = async (gId: string) => {
    const members = await getGroupMembers(gId);
    setGroupMembers(members as GroupMember[]);
  };

  const handleVillageSelect = async (villageId: string) => {
    setSelectedVillage(villageId);
    const village = villageProfiles.find((v) => v.id === villageId);
    if (village) {
      setProfile(village.profile);
    }
    // Check if there's an existing group for this village
    const groups = await getGroupForVillage(villageId);
    if (groups.length > 0) {
      const members = await getGroupMembers(groups[0].id);
      setGroupMembers(members as GroupMember[]);
    } else {
      setGroupMembers([]);
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
    localStorage.setItem('siskeudes_work_mode', workMode);

    if (workMode === "group") {
      setGroupLoading(true);
      try {
        const gId = await createOrJoinGroup(selectedVillage, profile.namaDesa, userName);
        setGroupId(gId);
        localStorage.setItem('siskeudes_group_id', gId);
        await loadGroupMembers(gId);
        
        await upsertSession({
          user_name: userName,
          village_id: selectedVillage,
          village_name: profile.namaDesa,
          form_progress: { data_umum: true },
          work_mode: "group",
          group_id: gId,
        });
        
        toast.success("Berhasil bergabung ke kelompok!");
      } catch (err: any) {
        toast.error(err.message || "Gagal bergabung kelompok");
      } finally {
        setGroupLoading(false);
      }
    } else {
      localStorage.removeItem('siskeudes_group_id');
      setGroupId(null);
      setGroupMembers([]);
      
      await upsertSession({
        user_name: userName,
        village_id: selectedVillage,
        village_name: profile.namaDesa,
        form_progress: { data_umum: true },
        work_mode: "individual",
      });
      
      toast.success("Data Umum Desa berhasil disimpan");
    }
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
      <FormPageHeader title="Data Umum Desa" subtitle="Identitas desa, perangkat, dan tahun anggaran">
        <Button onClick={handleSave} className="gap-2" disabled={groupLoading}>
          <Save size={16} /> {groupLoading ? "Memproses..." : "Simpan"}
        </Button>
      </FormPageHeader>
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

          {/* Work Mode Selection */}
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-accent" />
              <span className="text-sm font-semibold text-foreground">Mode Pengerjaan</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setWorkMode("individual")}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  workMode === "individual"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <User size={20} className={workMode === "individual" ? "text-primary" : "text-muted-foreground"} />
                  <span className="font-semibold text-sm">Individu</span>
                </div>
                <p className="text-xs text-muted-foreground">Mengerjakan sendiri semua form keuangan desa</p>
              </button>
              <button
                onClick={() => setWorkMode("group")}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  workMode === "group"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className={workMode === "group" ? "text-primary" : "text-muted-foreground"} />
                  <span className="font-semibold text-sm">Kelompok</span>
                </div>
                <p className="text-xs text-muted-foreground">Mengerjakan bersama (max 10 anggota per desa)</p>
              </button>
            </div>

            {/* Group Info */}
            {workMode === "group" && groupId && groupMembers.length > 0 && (
              <div className="mt-4 p-3 bg-card border border-border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Users size={14} /> Anggota Kelompok ({groupMembers.length}/10)
                  </h4>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => navigate("/group-room")}>
                    <UserPlus size={12} className="mr-1" /> Lihat Room
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {groupMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                      {m.is_leader ? (
                        <Crown size={14} className="text-yellow-500 shrink-0" />
                      ) : (
                        <User size={14} className="text-muted-foreground shrink-0" />
                      )}
                      <span className={m.is_leader ? "font-semibold" : ""}>{m.user_name || "—"}</span>
                      {m.is_leader && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-yellow-100 text-yellow-700">
                          Ketua
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workMode === "group" && !groupId && selectedVillage && (
              <p className="mt-3 text-xs text-muted-foreground">
                💡 Klik "Simpan" untuk membuat/bergabung ke kelompok desa ini. Ketua dipilih secara acak.
              </p>
            )}
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
