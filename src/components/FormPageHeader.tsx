import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormPageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function FormPageHeader({ title, subtitle, children }: FormPageHeaderProps) {
  const navigate = useNavigate();
  const desaProfile = (() => {
    try {
      return JSON.parse(localStorage.getItem('siskeudes_desa_profile') || '{}');
    } catch { return {}; }
  })();
  const villageName = desaProfile.namaDesa;

  return (
    <div className="page-header flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold font-heading truncate">
          {title}{villageName ? ` — Desa ${villageName}` : ''}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {children}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
          title="Tutup"
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  );
}
