import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session-manager";
import { toast } from "sonner";

/**
 * Subscribes to realtime updates of user_sessions rows that belong to the
 * current user's group. When ANY teammate updates form_data, the local
 * cached app state is replaced and the page is reloaded so the UI reflects
 * the merged team progress.
 *
 * This makes "1 kelompok = 1 desa, progress identik" actually true.
 */
export function useGroupRealtimeSync() {
  useEffect(() => {
    const sessionId = getSessionId();
    let cleanupFns: Array<() => void> = [];
    let lastApplied = 0;

    const start = async () => {
      const groupId = localStorage.getItem("siskeudes_group_id");
      if (!groupId) return;

      const channel = supabase
        .channel(`group-sync-${groupId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_sessions",
            filter: `group_id=eq.${groupId}`,
          },
          (payload) => {
            const row = payload.new as { session_id?: string; form_data?: unknown };
            // Ignore my own writes
            if (!row || row.session_id === sessionId) return;
            if (!row.form_data || typeof row.form_data !== "object") return;

            // Throttle so a burst of updates doesn't reload many times
            const now = Date.now();
            if (now - lastApplied < 1500) return;
            lastApplied = now;

            try {
              // Compare with current local state
              const fd = row.form_data as Record<string, unknown>;
              const { mutasiKas, ...rest } = fd as { mutasiKas?: unknown };
              const incoming = JSON.stringify(rest);
              const current = localStorage.getItem("siskeudes_app_state") || "{}";
              if (incoming === current) return;

              localStorage.setItem("siskeudes_app_state", incoming);
              localStorage.setItem("siskeudes_state", incoming);
              if (mutasiKas) {
                localStorage.setItem("siskeudes_mutasi_kas", JSON.stringify(mutasiKas));
              }
              toast.info("Pekerjaan kelompok diperbarui oleh anggota lain — memuat ulang…", {
                duration: 1500,
              });
              setTimeout(() => window.location.reload(), 800);
            } catch {
              /* ignore */
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "group_members",
            filter: `group_id=eq.${groupId}`,
          },
          () => {
            // Anggota kelompok berkurang — biarkan saja, list akan refresh saat user buka room
          },
        )
        .subscribe();

      cleanupFns.push(() => {
        supabase.removeChannel(channel);
      });
    };

    start();

    // Re-subscribe whenever group id changes via storage event (e.g., user joins/leaves)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "siskeudes_group_id") {
        cleanupFns.forEach((fn) => fn());
        cleanupFns = [];
        start();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      cleanupFns.forEach((fn) => fn());
      window.removeEventListener("storage", onStorage);
    };
  }, []);
}
