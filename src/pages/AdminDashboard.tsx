import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Users, Activity, Lock, Unlock, Eye, Trash2, RefreshCw, Shield, LogOut, Monitor,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllSessions, getActiveSessions, getSiteSettings, updateSiteSettings, deleteSession,
} from "@/lib/session-manager";

const ADMIN_PASSWORD = "987654321";

const FORM_STEPS = [
  { key: "data_umum", label: "Data Umum Desa" },
  { key: "pendapatan", label: "Pendapatan" },
  { key: "belanja", label: "Belanja" },
  { key: "pembiayaan", label: "Pembiayaan" },
  { key: "penerimaan", label: "Penerimaan" },
  { key: "spp", label: "SPP" },
  { key: "pencairan", label: "Pencairan SPP" },
  { key: "spj", label: "SPJ Kegiatan" },
  { key: "pajak", label: "Penyetoran Pajak" },
  { key: "saldo_awal", label: "Saldo Awal" },
  { key: "jurnal", label: "Jurnal Umum" },
];

interface SessionRow {
  id: string;
  session_id: string;
  user_name: string;
  village_id: string;
  village_name: string;
  last_active: string;
  form_progress: Record<string, boolean>;
  form_data: Record<string, unknown>;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [activeSessions, setActiveSessions] = useState<SessionRow[]>([]);
  const [siteSettings, setSiteSettings] = useState<{ is_locked: boolean; max_users: number | null }>({
    is_locked: false,
    max_users: 0,
  });
  const [lockDialog, setLockDialog] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const [lockAction, setLockAction] = useState<"lock" | "unlock">("lock");
  const [selectedUser, setSelectedUser] = useState<SessionRow | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [all, active, settings] = await Promise.all([
      getAllSessions(),
      getActiveSessions(5),
      getSiteSettings(),
    ]);
    setSessions(all as SessionRow[]);
    setActiveSessions(active as SessionRow[]);
    if (settings) setSiteSettings({ is_locked: settings.is_locked, max_users: settings.max_users });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("siskeudes_admin") !== "true") {
      navigate("/admin");
      return;
    }
    refresh();
    const interval = setInterval(refresh, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [refresh, navigate]);

  const handleLockToggle = (action: "lock" | "unlock") => {
    setLockAction(action);
    setLockPassword("");
    setLockDialog(true);
  };

  const confirmLockAction = async () => {
    if (lockPassword !== ADMIN_PASSWORD) {
      toast.error("Password salah!");
      return;
    }
    await updateSiteSettings({ is_locked: lockAction === "lock" });
    toast.success(lockAction === "lock" ? "Website telah dikunci" : "Website telah dibuka kembali");
    setLockDialog(false);
    refresh();
  };

  const handleKickUser = async (sessionId: string) => {
    await deleteSession(sessionId);
    toast.success("User telah di-kick");
    refresh();
  };

  const handleMaxUsersChange = async (val: string) => {
    const num = parseInt(val) || 0;
    await updateSiteSettings({ max_users: num });
    setSiteSettings((prev) => ({ ...prev, max_users: num }));
    toast.success(`Batas akses diatur: ${num === 0 ? "Tidak terbatas" : num + " user"}`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("siskeudes_admin");
    navigate("/");
  };

  const getProgressPercent = (progress: Record<string, boolean>) => {
    if (!progress || typeof progress !== "object") return 0;
    const completed = FORM_STEPS.filter((s) => progress[s.key]).length;
    return Math.round((completed / FORM_STEPS.length) * 100);
  };

  const isOnline = (lastActive: string) => {
    return Date.now() - new Date(lastActive).getTime() < 5 * 60 * 1000;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(152,40%,8%)] to-[hsl(210,25%,12%)]">
      {/* Header */}
      <div className="bg-[hsl(152,40%,12%)]/90 backdrop-blur border-b border-[hsl(152,30%,20%)] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-accent" />
          <div>
            <h1 className="text-lg font-bold text-white font-heading">Admin Dashboard</h1>
            <p className="text-[10px] text-[hsl(0,0%,60%)]">Monitoring & Manajemen User</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading} className="text-white/70 hover:text-white hover:bg-white/10">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-white/70 hover:text-white hover:bg-white/10">
            <Monitor size={14} className="mr-1" /> Mode User
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={14} className="mr-1" /> Logout
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[hsl(152,30%,15%)]/80 border-[hsl(152,30%,22%)] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[hsl(0,0%,60%)] uppercase tracking-wider">Total User</p>
                  <p className="text-3xl font-bold mt-1">{sessions.length}</p>
                </div>
                <Users className="w-10 h-10 text-primary/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(152,30%,15%)]/80 border-[hsl(152,30%,22%)] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[hsl(0,0%,60%)] uppercase tracking-wider">Online Sekarang</p>
                  <p className="text-3xl font-bold mt-1 text-green-400">{activeSessions.length}</p>
                </div>
                <Activity className="w-10 h-10 text-green-400/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(152,30%,15%)]/80 border-[hsl(152,30%,22%)] text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[hsl(0,0%,60%)] uppercase tracking-wider">Status Website</p>
                  <p className="text-lg font-bold mt-1">
                    {siteSettings.is_locked ? (
                      <span className="text-red-400 flex items-center gap-1"><Lock size={16} /> Terkunci</span>
                    ) : (
                      <span className="text-green-400 flex items-center gap-1"><Unlock size={16} /> Aktif</span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={siteSettings.is_locked ? "default" : "destructive"}
                  onClick={() => handleLockToggle(siteSettings.is_locked ? "unlock" : "lock")}
                  className="text-xs"
                >
                  {siteSettings.is_locked ? "Buka" : "Kunci"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(152,30%,15%)]/80 border-[hsl(152,30%,22%)] text-white">
            <CardContent className="p-5">
              <div>
                <p className="text-[10px] text-[hsl(0,0%,60%)] uppercase tracking-wider mb-2">Batas Akses</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={siteSettings.max_users || 0}
                    onChange={(e) => handleMaxUsersChange(e.target.value)}
                    className="h-8 w-20 bg-[hsl(152,20%,20%)] border-[hsl(152,30%,25%)] text-white text-sm"
                  />
                  <span className="text-xs text-[hsl(0,0%,55%)]">
                    {(siteSettings.max_users || 0) === 0 ? "Tidak terbatas" : `Max ${siteSettings.max_users} user`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <Card className="bg-[hsl(152,30%,15%)]/80 border-[hsl(152,30%,22%)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Users size={18} /> Daftar User ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-[hsl(0,0%,50%)] text-center py-8">Belum ada user yang mengakses</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(152,30%,22%)]">
                      <th className="text-left py-2 px-3 text-[10px] text-[hsl(0,0%,55%)] uppercase">Status</th>
                      <th className="text-left py-2 px-3 text-[10px] text-[hsl(0,0%,55%)] uppercase">Nama</th>
                      <th className="text-left py-2 px-3 text-[10px] text-[hsl(0,0%,55%)] uppercase">Desa</th>
                      <th className="text-left py-2 px-3 text-[10px] text-[hsl(0,0%,55%)] uppercase">Progress</th>
                      <th className="text-left py-2 px-3 text-[10px] text-[hsl(0,0%,55%)] uppercase">Terakhir Aktif</th>
                      <th className="text-center py-2 px-3 text-[10px] text-[hsl(0,0%,55%)] uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => {
                      const online = isOnline(s.last_active);
                      const progress = getProgressPercent(s.form_progress as Record<string, boolean>);
                      return (
                        <tr key={s.id} className="border-b border-[hsl(152,30%,20%)] hover:bg-[hsl(152,20%,18%)] transition-colors">
                          <td className="py-2.5 px-3">
                            <Badge variant={online ? "default" : "secondary"} className={`text-[10px] ${online ? "bg-green-600 text-white" : "bg-[hsl(0,0%,30%)] text-[hsl(0,0%,60%)]"}`}>
                              {online ? "Online" : "Offline"}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-white font-medium">{s.user_name || "—"}</td>
                          <td className="py-2.5 px-3 text-[hsl(0,0%,70%)]">{s.village_name || "Belum pilih"}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-[hsl(152,20%,20%)] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    progress === 100 ? "bg-green-500" : progress > 50 ? "bg-accent" : "bg-primary"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-[hsl(0,0%,55%)]">{progress}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-[hsl(0,0%,55%)]">
                            {new Date(s.last_active).toLocaleString("id-ID")}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(s)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 w-7 p-0"
                              >
                                <Eye size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleKickUser(s.session_id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Detail Modal */}
        {selectedUser && (
          <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
            <DialogContent className="max-w-lg bg-[hsl(152,30%,12%)] border-[hsl(152,30%,22%)] text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Detail User: {selectedUser.user_name || "—"}</DialogTitle>
                <DialogDescription className="text-[hsl(0,0%,55%)]">
                  Desa: {selectedUser.village_name || "Belum dipilih"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] text-[hsl(0,0%,55%)] uppercase">Progress Pengisian</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {FORM_STEPS.map((step) => {
                      const done = (selectedUser.form_progress as Record<string, boolean>)?.[step.key];
                      return (
                        <div key={step.key} className="flex items-center gap-2 text-xs">
                          <div className={`w-2.5 h-2.5 rounded-full ${done ? "bg-green-500" : "bg-[hsl(0,0%,30%)]"}`} />
                          <span className={done ? "text-green-400" : "text-[hsl(0,0%,50%)]"}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-xs text-[hsl(0,0%,50%)]">
                  <p>Session ID: {selectedUser.session_id.substring(0, 8)}...</p>
                  <p>Mulai: {new Date(selectedUser.created_at).toLocaleString("id-ID")}</p>
                  <p>Terakhir aktif: {new Date(selectedUser.last_active).toLocaleString("id-ID")}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Lock/Unlock Dialog */}
        <Dialog open={lockDialog} onOpenChange={setLockDialog}>
          <DialogContent className="max-w-sm bg-[hsl(152,30%,12%)] border-[hsl(152,30%,22%)] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                {lockAction === "lock" ? "Kunci Website" : "Buka Website"}
              </DialogTitle>
              <DialogDescription className="text-[hsl(0,0%,55%)]">
                Masukkan password admin untuk {lockAction === "lock" ? "mengunci" : "membuka"} akses website
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Input
                type="password"
                value={lockPassword}
                onChange={(e) => setLockPassword(e.target.value)}
                placeholder="Password admin"
                className="bg-[hsl(152,20%,20%)] border-[hsl(152,30%,25%)] text-white"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setLockDialog(false)} className="text-white/70">
                Batal
              </Button>
              <Button onClick={confirmLockAction} variant={lockAction === "lock" ? "destructive" : "default"}>
                {lockAction === "lock" ? "Kunci" : "Buka Kunci"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
