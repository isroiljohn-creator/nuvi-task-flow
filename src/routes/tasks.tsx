import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CreateTaskButton } from "@/components/tasks/CreateTaskButton";
import { useUI } from "@/contexts/UIContext";
import { useAuth, hasAnyRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isOverdue } from "@/lib/scoring";
import { Search } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  component: () => <AppShell><AllTasks /></AppShell>,
});

function AllTasks() {
  const { t } = useUI();
  const { roles } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const allowed = hasAnyRole(roles, ["super_admin", "admin", "manager", "viewer"]);

  const { data: tasks = [] } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, avatar_url)")
        .order("deadline_at");
      return data ?? [];
    },
    enabled: allowed,
  });

  if (!allowed) {
    return <div className="rounded-2xl bg-card border border-border p-12 text-center"><p className="text-muted-foreground">{t("noAccessMsg")}</p></div>;
  }

  const filtered = tasks.filter((task) => {
    const displayStatus = isOverdue(task.deadline_at, task.status) && task.status !== "completed" && task.status !== "cancelled" ? "overdue" : task.status;
    if (statusFilter !== "all" && displayStatus !== statusFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${task.title} ${task.description ?? ""} ${task.assignee?.full_name ?? ""} ${task.assignee?.email ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("allTasks")}</h1>
        <CreateTaskButton />
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={t("status")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")} - {t("status")}</SelectItem>
            {(["new", "in_progress", "waiting", "completed", "overdue", "cancelled"] as const).map((s) => (
              <SelectItem key={s} value={s}>{t(`status_${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={t("priority")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")} - {t("priority")}</SelectItem>
            {(["low", "medium", "high", "critical"] as const).map((p) => (
              <SelectItem key={p} value={p}>{t(`priority_${p}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 text-center"><p className="text-muted-foreground">{t("noTasks")}</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((task) => <TaskCard key={task.id} task={task as never} />)}
        </div>
      )}
    </div>
  );
}
