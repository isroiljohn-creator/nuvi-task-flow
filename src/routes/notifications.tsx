import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { useUI } from "@/contexts/UIContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  component: () => <AppShell><Notifications /></AppShell>,
});

function Notifications() {
  const { t } = useUI();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
    enabled: !!user,
  });

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };
  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("notifications")}</h1>
        {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="size-4 mr-2" />{t("markAllRead")}</Button>}
      </div>

      {notifs.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 text-center">
          <Bell className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t("noNotifications")}</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          {notifs.map((n) => {
            const inner = (
              <div className={cn("flex gap-3 p-4 border-b border-border last:border-0 transition-colors", !n.is_read && "bg-accent/30 hover:bg-accent/50", n.is_read && "hover:bg-muted/50")}>
                <div className={cn("size-2 mt-2 rounded-full shrink-0", !n.is_read ? "bg-primary" : "bg-transparent")} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.message && <div className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">{format(new Date(n.created_at), "d MMM yyyy, HH:mm")}</div>
                </div>
              </div>
            );
            return n.task_id ? (
              <Link key={n.id} to="/tasks/$taskId" params={{ taskId: n.task_id }} onClick={() => !n.is_read && markRead(n.id)} className="block">{inner}</Link>
            ) : <button key={n.id} onClick={() => !n.is_read && markRead(n.id)} className="block w-full text-left">{inner}</button>;
          })}
        </div>
      )}
    </div>
  );
}
