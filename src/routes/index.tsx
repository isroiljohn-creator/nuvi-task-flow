import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { CreateTaskButton } from "@/components/tasks/CreateTaskButton";
import { TaskCard } from "@/components/tasks/TaskCard";
import { useUI } from "@/contexts/UIContext";
import { useAuth, hasAnyRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertTriangle, ListChecks, TrendingUp, Trophy } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { aggregateScore, isOverdue } from "@/lib/scoring";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: () => <AppShell><Dashboard /></AppShell>,
});

function Dashboard() {
  const { t, lang } = useUI();
  const { user, profile, roles } = useAuth();
  const isManager = hasAnyRole(roles, ["super_admin", "admin", "manager", "viewer"]);

  const { data: tasks = [] } = useQuery({
    queryKey: ["dashboard-tasks", user?.id, isManager],
    queryFn: async () => {
      const q = supabase.from("tasks").select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, avatar_url)");
      const { data } = isManager ? await q : await q.eq("assignee_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["dashboard-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email, avatar_url").eq("is_suspended", false);
      return data ?? [];
    },
    enabled: isManager,
  });

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const active = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const completedToday = tasks.filter((t) => t.status === "completed" && t.completed_at && new Date(t.completed_at) >= todayStart);
  const overdue = tasks.filter((t) => isOverdue(t.deadline_at, t.status));
  const upcoming = active.filter((t) => !isOverdue(t.deadline_at, t.status))
    .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime()).slice(0, 5);

  const statusCounts: Record<string, number> = {};
  tasks.forEach((task) => {
    const s = isOverdue(task.deadline_at, task.status) ? "overdue" : task.status;
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([k, v]) => ({ name: t(`status_${k}` as never), value: v, key: k }));
  const STATUS_COLORS: Record<string, string> = {
    new: "var(--chart-2)", in_progress: "var(--chart-1)", waiting: "var(--chart-4)",
    completed: "var(--chart-3)", overdue: "var(--chart-5)", cancelled: "var(--muted)",
  };
  const priorityData = (["low", "medium", "high", "critical"] as const).map((p) => ({
    name: t(`priority_${p}`), count: tasks.filter((t) => t.priority === p).length,
  }));

  const employeeStats = profiles.map((p) => {
    const ut = tasks.filter((t) => t.assignee_id === p.id);
    return { ...p, completed: ut.filter((t) => t.status === "completed").length, score: aggregateScore(ut), total: ut.length };
  }).sort((a, b) => b.score - a.score).slice(0, 5);

  const myScore = aggregateScore(tasks.filter((t) => t.assignee_id === user?.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {greeting(lang)}, {profile?.full_name?.split(" ")[0] ?? profile?.email?.split("@")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard")}</p>
        </div>
        <CreateTaskButton />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<ListChecks className="size-4" />} label={t("activeTasks")} value={active.length} color="var(--primary)" />
        <StatCard icon={<CheckCircle2 className="size-4" />} label={t("completedToday")} value={completedToday.length} color="var(--success)" />
        <StatCard icon={<AlertTriangle className="size-4" />} label={t("overdueTasks")} value={overdue.length} color="var(--destructive)" />
        <StatCard icon={<TrendingUp className="size-4" />} label={isManager ? t("teamProductivity") : t("productivityScore")} value={isManager ? aggregateScore(tasks) : myScore} color="var(--warning)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={t("tasksByStatus")}>
          {statusData.length === 0 ? <Empty label={t("noData")} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} innerRadius={50} dataKey="value" paddingAngle={2}>
                  {statusData.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key] ?? "var(--muted)"} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card title={t("tasksByPriority")} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={t("upcomingDeadlines")} className="lg:col-span-2">
          {upcoming.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">{t("noTasks")}</p> : (
            <div className="space-y-3">{upcoming.map((task) => <TaskCard key={task.id} task={task as never} />)}</div>
          )}
        </Card>
        {isManager && (
          <Card title={t("bestEmployees")}>
            {employeeStats.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">{t("noData")}</p> : (
              <div className="space-y-2">
                {employeeStats.map((emp, i) => (
                  <Link key={emp.id} to="/employees/$userId" params={{ userId: emp.id }} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
                    <div className="relative">
                      <Avatar className="size-10">
                        <AvatarImage src={emp.avatar_url ?? undefined} />
                        <AvatarFallback>{initials(emp.full_name, emp.email)}</AvatarFallback>
                      </Avatar>
                      {i < 3 && (
                        <div className="absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                          style={{ background: i === 0 ? "var(--warning)" : i === 1 ? "var(--muted-foreground)" : "var(--chart-5)" }}>
                          {i + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{emp.full_name ?? emp.email.split("@")[0]}</div>
                      <div className="text-xs text-muted-foreground">{emp.completed} · {emp.score} pt</div>
                    </div>
                    <Trophy className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem", color: "var(--popover-foreground)" };

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 transition-all hover:shadow-[var(--shadow-soft)]">
      <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in oklab, ${color} 14%, transparent)`, color }}>{icon}</div>
      <div className="mt-3"><div className="text-2xl sm:text-3xl font-semibold tracking-tight">{value}</div><div className="text-xs text-muted-foreground mt-1">{label}</div></div>
    </div>
  );
}
function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-card border border-border p-5 ${className}`}><h3 className="text-sm font-semibold mb-4">{title}</h3>{children}</div>;
}
function Empty({ label }: { label: string }) {
  return <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">{label}</div>;
}
function greeting(lang: Lang): string {
  const h = new Date().getHours();
  if (lang === "ru") return h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер";
  return h < 12 ? "Xayrli tong" : h < 18 ? "Xayrli kun" : "Xayrli kech";
}
