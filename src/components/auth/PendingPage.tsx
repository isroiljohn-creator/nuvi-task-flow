import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUI } from "@/contexts/UIContext";
import { useAuth } from "@/contexts/AuthContext";

export function PendingPage() {
  const { t } = useUI();
  const { signOut, profile } = useAuth();
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--gradient-subtle)" }}
    >
      <div className="max-w-md w-full text-center bg-card rounded-2xl p-8 border border-border" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <div className="mx-auto size-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-6">
          <Clock className="size-8 text-warning" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("pendingTitle")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("pendingMessage")}</p>
        {profile?.email && (
          <p className="mt-4 text-xs text-muted-foreground bg-muted rounded-lg py-2 px-3 inline-block">
            {profile.email}
          </p>
        )}
        <Button onClick={signOut} variant="outline" className="mt-8 w-full">
          {t("signOut")}
        </Button>
      </div>
    </div>
  );
}
