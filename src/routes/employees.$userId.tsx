import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useUI } from "@/contexts/UIContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { aggregateScore } from "@/lib/scoring";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/employees/$userId")({
  component: () => <AppShell><EmployeeProfile /></AppShell>,
});

function EmployeeProfile() {
  const { userId } = Route.useParams();
  const { t } = useUI();

  const { data: profile } = useQuery({
    queryKey: ["employee", userId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      return data;
    },
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["employee-tasks", userId],
    queryFn: async () => {
      const { data } = await supabase.from("tasks")
        .select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, avatar_url)")
        .eq("assignee_id", userId).order("deadline_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: roleRows = [] } = useQuery({
    queryKey: ["employee-roles", userId],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      return data ?? [];
    },
  });

  if (!profile) return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled" && new Date(t.deadline_at) < new Date()).length;
  const score = aggregateScore(tasks);
  const role = roleRows[0]?.role ?? "employee";

  return (
    <div className="space-y-6 max-w-5xl">
      <Link to="/employees" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t("back")}</Link>

      <div className="rounded-2xl bg-card border border-border p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar className="size-20"><AvatarImage src={profile.avatar_url ?? undefined} /><AvatarFallback className="text-xl">{initials(profile.full_name, profile.email)}</AvatarFallback></Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{profile.full_name ?? profile.email.split("@")[0]}</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-2 inline-flex rounded-full bg-accent text-accent-foreground px-2.5 py-0.5 text-xs font-medium">{t(`role_${role}` as never)}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label={t("totalAssigned")} value={tasks.length} />
          <Stat label={t("totalCompleted")} value={completed} color="var(--success)" />
          <Stat label={t("overdueTasks")} value={overdue} color="var(--destructive)" />
          <Stat label={t("productivityScore")} value={score} color="var(--primary)" />
        </div>
      </div>

      <h2 className="text-lg font-semibold">{t("myTasks")}</h2>
      {tasks.length === 0 ? <div className="rounded-2xl bg-card border border-border p-12 text-center"><p className="text-muted-foreground">{t("noTasks")}</p></div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{tasks.slice(0, 12).map((task) => <TaskCard key={task.id} task={task as never} />)}</div>}
    </div>
  );
}

function Stat({ label, value, color = "var(--foreground)" }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <div className="text-2xl font-semibold" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
