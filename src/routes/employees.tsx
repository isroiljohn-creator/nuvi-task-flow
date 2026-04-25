import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { useUI } from "@/contexts/UIContext";
import { useAuth, hasAnyRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { aggregateScore } from "@/lib/scoring";

export const Route = createFileRoute("/employees")({
  component: () => <AppShell><Employees /></AppShell>,
});

function Employees() {
  const { t } = useUI();
  const { roles } = useAuth();
  const allowed = hasAnyRole(roles, ["super_admin", "admin", "manager", "viewer"]);

  const { data: profiles = [] } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email, avatar_url, is_suspended").order("full_name");
      return data ?? [];
    },
    enabled: allowed,
  });
  const { data: rolesMap = {} } = useQuery({
    queryKey: ["employees-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      const m: Record<string, string[]> = {};
      (data ?? []).forEach((r) => { m[r.user_id] = [...(m[r.user_id] ?? []), r.role]; });
      return m;
    },
    enabled: allowed,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["employees-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("assignee_id, status, priority, deadline_at, completed_at");
      return data ?? [];
    },
    enabled: allowed,
  });

  if (!allowed) return <div className="rounded-2xl bg-card border border-border p-12 text-center"><p className="text-muted-foreground">{t("noAccessMsg")}</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("employees")}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.filter((p) => !(rolesMap[p.id]?.length === 1 && rolesMap[p.id][0] === "pending")).map((p) => {
          const userTasks = tasks.filter((t) => t.assignee_id === p.id);
          const completed = userTasks.filter((t) => t.status === "completed").length;
          const score = aggregateScore(userTasks);
          const role = rolesMap[p.id]?.[0] ?? "employee";
          return (
            <Link key={p.id} to="/employees/$userId" params={{ userId: p.id }} className="rounded-2xl bg-card border border-border p-5 hover:shadow-[var(--shadow-soft)] hover:border-primary/30 transition-all">
              <div className="flex items-center gap-3">
                <Avatar className="size-12"><AvatarImage src={p.avatar_url ?? undefined} /><AvatarFallback>{initials(p.full_name, p.email)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.full_name ?? p.email.split("@")[0]}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="rounded-full bg-accent text-accent-foreground px-2 py-0.5">{t(`role_${role}` as never)}</span>
                {p.is_suspended && <span className="text-destructive">{t("suspended")}</span>}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div><div className="text-lg font-semibold">{userTasks.length}</div><div className="text-[10px] text-muted-foreground">{t("totalAssigned")}</div></div>
                <div><div className="text-lg font-semibold text-success">{completed}</div><div className="text-[10px] text-muted-foreground">{t("totalCompleted")}</div></div>
                <div><div className="text-lg font-semibold text-primary">{score}</div><div className="text-[10px] text-muted-foreground">{t("productivityScore")}</div></div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
