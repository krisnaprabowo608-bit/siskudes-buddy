import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session-manager";
import { toast } from "sonner";

/**
 * Subscribes to realtime updates of user_sessions rows that belong to the
 * current user's group, AND performs an initial pull so latecomers immediately
 * see what teammates already saved.
 *
 * Improvements vs previous version:
 *  - Initial pull on mount + when group_id changes (no more "kosong padahal teman sudah ngerjakan")
 *  - Soft state apply (no full window.location.reload) → dispatches "siskeudes:state-updated"
 *    so pages re-read localStorage without a hard reload (less patah-patah on slow devices)
 *  - Smarter debounce: collapses bursts of incoming updates into a single apply
 *  - Conflict detection: if a teammate writes within 2s of my own write, show a warning toast
 */

const LAST_LOCAL_WRITE_KEY = "siskeudes_last_local_write_at";

function applyIncomingState(formData: Record<string, unknown>) {
  try {
    const { mutasiKas, __meta, ...rest } = formData as {
      mutasiKas?: unknown;
      __meta?: unknown;
    };
    const incomingStr = JSON.stringify(rest);
    const currentStr = localStorage.getItem("siskeudes_app_state") || "{}";
    if (incomingStr === currentStr) return false;

    localStorage.setItem("siskeudes_app_state", incomingStr);
    localStorage.setItem("siskeudes_state", incomingStr);
    if (mutasiKas) {
      localStorage.setItem("siskeudes_mutasi_kas", JSON.stringify(mutasiKas));
    }
    // Notify any mounted page to re-read local state
    window.dispatchEvent(new CustomEvent("siskeudes:state-updated"));
    return true;
  } catch {
    return false;
  }
}

async function initialPullForGroup(groupId: string, mySessionId: string) {
  const { data } = await supabase
    .from("user_sessions")
    .select("session_id, form_data, last_active")
    .eq("group_id", groupId)
    .order("last_active", { ascending: false })
    .limit(5);
  if (!data || data.length === 0) return;
  // Pick the most recently active row that's NOT mine and has non-empty form_data
  const candidate = data.find(
    (r) =>
      r.session_id !== mySessionId &&
      r.form_data &&
      typeof r.form_data === "object" &&
      Object.keys(r.form_data as object).length > 0,
  );
  if (!candidate) return;
  const applied = applyIncomingState(candidate.form_data as Record<string, unknown>);
  if (applied) {
    toast.info("Memuat pekerjaan terbaru dari kelompok…", { duration: 1500 });
  }
}

export function useGroupRealtimeSync() {
  useEffect(() => {
    const sessionId = getSessionId();
    let cleanupFns: Array<() => void> = [];
    let pendingApplyTimer: ReturnType<typeof setTimeout> | null = null;
    let latestPayload: Record<string, unknown> | null = null;

    const start = async () => {
      const groupId = localStorage.getItem("siskeudes_group_id");
      if (!groupId) return;

      // 1. Initial pull so we see what's already there
      await initialPullForGroup(groupId, sessionId);

      // 2. Subscribe to live updates
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
            if (!row || row.session_id === sessionId) return;
            if (!row.form_data || typeof row.form_data !== "object") return;

            // Conflict warning: someone else wrote within 2s of my last write
            const myLast = Number(localStorage.getItem(LAST_LOCAL_WRITE_KEY) || 0);
            if (myLast && Date.now() - myLast < 2000) {
              toast.warning(
                "Anggota lain juga mengubah data — versi terbaru akan disinkronkan.",
                { duration: 2500 },
              );
            }

            latestPayload = row.form_data as Record<string, unknown>;

            // Smart debounce: if more updates come in within 700ms, only
            // apply the LAST one (avoids reload-storm on slow devices)
            if (pendingApplyTimer) clearTimeout(pendingApplyTimer);
            pendingApplyTimer = setTimeout(() => {
              if (!latestPayload) return;
              const changed = applyIncomingState(latestPayload);
              latestPayload = null;
              if (changed) {
                toast.info("Pekerjaan kelompok diperbarui", { duration: 1200 });
              }
            }, 700);
          },
        )
        .subscribe();

      cleanupFns.push(() => {
        if (pendingApplyTimer) clearTimeout(pendingApplyTimer);
        supabase.removeChannel(channel);
      });
    };

    start();

    // Re-subscribe whenever group id changes
    const onStorage = (e: StorageEvent) => {
      if (e.key === "siskeudes_group_id") {
        cleanupFns.forEach((fn) => fn());
        cleanupFns = [];
        start();
      }
    };
    window.addEventListener("storage", onStorage);

    // Also expose a manual trigger so other code can request a pull
    const onManualPull = () => {
      const gid = localStorage.getItem("siskeudes_group_id");
      if (gid) initialPullForGroup(gid, sessionId);
    };
    window.addEventListener("siskeudes:request-group-pull", onManualPull);

    return () => {
      cleanupFns.forEach((fn) => fn());
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("siskeudes:request-group-pull", onManualPull);
    };
  }, []);
}
