import { useEffect, useState } from "react";
import { getSiteSettings, getActiveSessions, heartbeat, getSessionId } from "@/lib/session-manager";
import { Lock } from "lucide-react";

export default function SiteLockGuard({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [maxReached, setMaxReached] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const settings = await getSiteSettings();
      if (settings?.is_locked) {
        setLocked(true);
        setChecking(false);
        return;
      }

      if (settings?.max_users && settings.max_users > 0) {
        const active = await getActiveSessions(5);
        const sessionId = getSessionId();
        const isExisting = active.some((s) => s.session_id === sessionId);
        if (!isExisting && active.length >= settings.max_users) {
          setMaxReached(true);
          setChecking(false);
          return;
        }
      }

      setLocked(false);
      setMaxReached(false);
      setChecking(false);
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Heartbeat
  useEffect(() => {
    if (locked || maxReached) return;
    heartbeat();
    const interval = setInterval(heartbeat, 30000);
    return () => clearInterval(interval);
  }, [locked, maxReached]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(152,40%,14%)] to-[hsl(152,35%,22%)]">
        <p className="text-white/60 text-sm animate-pulse">Memuat...</p>
      </div>
    );
  }

  if (locked || maxReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(152,40%,14%)] to-[hsl(152,35%,22%)]">
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            {locked ? "Website Terkunci" : "Batas Akses Tercapai"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {locked
              ? "Website sedang dikunci oleh admin. Silakan hubungi admin untuk membuka akses."
              : "Jumlah pengguna aktif telah mencapai batas maksimum. Silakan coba lagi nanti."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
