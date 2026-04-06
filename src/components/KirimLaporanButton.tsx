import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, FileText } from "lucide-react";
import { toast } from "sonner";
import { isCurrentUserLeader, submitReport } from "@/lib/session-manager";
import { loadState } from "@/data/app-state";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session-manager";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
      
      // Submit report data
      await submitReport({ ...state, _progress: sessionProgress });

      // Generate and upload PDF of current report page
      const reportContent = document.querySelector("[id$='-content']") as HTMLElement;
      if (reportContent) {
        try {
          const canvas = await html2canvas(reportContent, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL("image/jpeg", 0.9);
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          let heightLeft = pdfHeight;
          let position = 0;
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
          
          while (heightLeft > 0) {
            position = -(pdfHeight - heightLeft);
            pdf.addPage();
            pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
          }
          
          const pdfBlob = pdf.output("blob");
          const sessionId = getSessionId();
          const desaProfile = JSON.parse(localStorage.getItem("siskeudes_desa_profile") || "{}");
          const villageName = (desaProfile.namaDesa || "unknown").replace(/\s+/g, "_");
          const timestamp = Date.now();
          const fileName = `${sessionId}/${villageName}_${timestamp}.pdf`;
          
          await supabase.storage.from("report-pdfs").upload(fileName, pdfBlob, {
            contentType: "application/pdf",
          });
        } catch {
          // PDF upload failed silently, report data still sent
        }
      }

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
