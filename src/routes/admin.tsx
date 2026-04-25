import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { useUI } from "@/contexts/UIContext";
import { useAuth, hasAnyRole, type AppRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initials } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin")({
  component: () => <AppShell><AdminPanel /></AppShell>,
});

function AdminPanel() {
  const { t } = useUI();
  const { roles, user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = hasAnyRole(roles, ["super_admin", "admin"]);

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [],
    enabled: isAdmin,
  });
  const { data: rolesMap = {} } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      const m: Record<string, AppRole[]> = {};
      (data ?? []).forEach((r) => { m[r.user_id] = [...(m[r.user_id] ?? []), r.role as AppRole]; });
      return m;
    },
    enabled: isAdmin,
  });

  if (!isAdmin) return <div className="rounded-2xl bg-card border border-border p-12 text-center"><p className="text-muted-foreground">{t("noAccessMsg")}</p></div>;

  const setRole = async (userId: string, newRole: AppRole) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole, assigned_by: user?.id });
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-roles"] }); }
  };
  const toggleSuspend = async (userId: string, suspended: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_suspended: !suspended }).eq("id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-profiles"] }); }
  };

  const pending = profiles.filter((p) => rolesMap[p.id]?.length === 1 && rolesMap[p.id][0] === "pending");
  const active = profiles.filter((p) => !pending.includes(p));
  const allRoles: AppRole[] = ["super_admin", "admin", "manager", "employee", "viewer"];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("admin")}</h1>

      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3">{t("pendingApprovals")} ({pending.length})</h2>
          <div className="rounded-2xl bg-card border border-border divide-y divide-border">
            {pending.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar><AvatarImage src={p.avatar_url ?? undefined} /><AvatarFallback>{initials(p.full_name, p.email)}</AvatarFallback></Avatar>
                  <div className="min-w-0"><div className="text-sm font-medium truncate">{p.full_name ?? p.email.split("@")[0]}</div><div className="text-xs text-muted-foreground truncate">{p.email}</div></div>
                </div>
                <Select onValueChange={(v) => setRole(p.id, v as AppRole)}>
                  <SelectTrigger className="w-44"><SelectValue placeholder={t("assignRole")} /></SelectTrigger>
                  <SelectContent>{allRoles.map((r) => <SelectItem key={r} value={r}>{t(`role_${r}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold mb-3">{t("manageUsers")} ({active.length})</h2>
        <div className="rounded-2xl bg-card border border-border divide-y divide-border">
          {active.map((p) => {
            const role = rolesMap[p.id]?.[0] ?? "employee";
            return (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar><AvatarImage src={p.avatar_url ?? undefined} /><AvatarFallback>{initials(p.full_name, p.email)}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.full_name ?? p.email.split("@")[0]}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                    <div className="text-[10px] text-muted-foreground">{t("lastLogin")}: {p.last_login_at ? format(new Date(p.last_login_at), "d MMM HH:mm") : t("never")}</div>
                  </div>
                </div>
                <Select value={role} onValueChange={(v) => setRole(p.id, v as AppRole)} disabled={p.id === user?.id}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>{allRoles.map((r) => <SelectItem key={r} value={r}>{t(`role_${r}`)}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant={p.is_suspended ? "default" : "outline"} size="sm" onClick={() => toggleSuspend(p.id, p.is_suspended)} disabled={p.id === user?.id}>
                  {p.is_suspended ? t("activate") : t("suspend")}
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
