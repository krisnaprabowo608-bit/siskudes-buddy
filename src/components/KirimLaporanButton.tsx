import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { isCurrentUserLeader, submitReport } from "@/lib/session-manager";
import { loadState } from "@/data/app-state";

export default function KirimLaporanButton() {
  const [isLeader, setIsLeader] = useState(false);
  const [sending, setSending] = useState(false);
  const groupId = localStorage.getItem("siskeudes_group_id");

  useEffect(() => {
    if (groupId) {
      isCurrentUserLeader().then(setIsLeader);
    }
  }, [groupId]);

  if (!groupId || !isLeader) return null;

  const handleKirim = async () => {
    setSending(true);
    try {
      const state = loadState();
      const sessionProgress = JSON.parse(localStorage.getItem("siskeudes_app_state") || "{}");
      await submitReport({ ...state, _progress: sessionProgress });
      toast.success("Laporan berhasil dikirim ke Admin!");
    } catch {
      toast.error("Gagal mengirim laporan");
    } finally {
      setSending(false);
    }
  };

  return (
    <Button size="sm" onClick={handleKirim} disabled={sending} variant="default" className="gap-2 bg-green-600 hover:bg-green-700">
      <Send size={14} /> {sending ? "Mengirim..." : "Kirim ke Admin"}
    </Button>
  );
}
