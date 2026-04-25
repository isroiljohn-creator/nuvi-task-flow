import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { useUI } from "@/contexts/UIContext";
import { useAuth, hasAnyRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, PriorityBadge } from "@/components/tasks/badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CalendarClock, User as UserIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["task_status"];
type Priority = Database["public"]["Enums"]["task_priority"];

export const Route = createFileRoute("/tasks/$taskId")({
  component: () => <AppShell><TaskDetail /></AppShell>,
});

function TaskDetail() {
  const { taskId } = Route.useParams();
  const { t } = useUI();
  const { user, roles } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const isManager = hasAnyRole(roles, ["super_admin", "admin", "manager"]);
  const isAdmin = hasAnyRole(roles, ["super_admin", "admin"]);

  const { data: task } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, avatar_url), creator:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url)")
        .eq("id", taskId)
        .maybeSingle();
      return data;
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["task-activity", taskId],
    queryFn: async () => {
      const { data } = await supabase
        .from("task_activity")
        .select("*, user:profiles!task_activity_user_id_fkey(full_name, email, avatar_url)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (!task) return <p className="text-muted-foreground text-sm">{t("loading")}</p>;

  const canEdit = isManager || task.assignee_id === user?.id;

  const updateStatus = async (status: Status) => {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", task.id);
    if (error) toast.error(error.message);
    else { toast.success(t("taskUpdated")); qc.invalidateQueries({ queryKey: ["task", taskId] }); qc.invalidateQueries({ queryKey: ["task-activity", taskId] }); }
  };
  const updatePriority = async (priority: Priority) => {
    const { error } = await supabase.from("tasks").update({ priority }).eq("id", task.id);
    if (error) toast.error(error.message);
    else { toast.success(t("taskUpdated")); qc.invalidateQueries({ queryKey: ["task", taskId] }); qc.invalidateQueries({ queryKey: ["task-activity", taskId] }); }
  };
  const deleteTask = async () => {
    if (!confirm(t("confirmDelete"))) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) toast.error(error.message);
    else { toast.success(t("taskDeleted")); nav({ to: "/tasks" }); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/tasks" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{t("back")}</Link>

      <div className="rounded-2xl bg-card border border-border p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} t={t} />
              <PriorityBadge priority={task.priority} t={t} />
            </div>
          </div>
          {isAdmin && (
            <Button variant="ghost" size="icon" onClick={deleteTask} className="text-destructive"><Trash2 className="size-4" /></Button>
          )}
        </div>

        {task.description && (
          <div className="mt-6 text-sm text-foreground/90 whitespace-pre-wrap">{task.description}</div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field label={t("assignee")}>
            {task.assignee ? (
              <div className="flex items-center gap-2"><Avatar className="size-7"><AvatarImage src={task.assignee.avatar_url ?? undefined} /><AvatarFallback className="text-xs">{initials(task.assignee.full_name, task.assignee.email)}</AvatarFallback></Avatar><span>{task.assignee.full_name ?? task.assignee.email}</span></div>
            ) : <span className="text-muted-foreground inline-flex items-center gap-1.5"><UserIcon className="size-3.5" />{t("unassigned")}</span>}
          </Field>
          <Field label={t("createdBy")}>
            {task.creator ? <div className="flex items-center gap-2"><Avatar className="size-7"><AvatarImage src={task.creator.avatar_url ?? undefined} /><AvatarFallback className="text-xs">{initials(task.creator.full_name, task.creator.email)}</AvatarFallback></Avatar><span>{task.creator.full_name ?? task.creator.email}</span></div> : "—"}
          </Field>
          <Field label={t("deadline")}><span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" />{format(new Date(task.deadline_at), "d MMM yyyy, HH:mm")}</span></Field>
          <Field label={t("createdAt")}>{format(new Date(task.created_at), "d MMM yyyy, HH:mm")}</Field>
        </div>

        {canEdit && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">{t("status")}</label>
              <Select value={task.status} onValueChange={(v) => updateStatus(v as Status)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["new", "in_progress", "waiting", "completed", "cancelled"] as const).map((s) => <SelectItem key={s} value={s}>{t(`status_${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isManager && (
              <div>
                <label className="text-xs text-muted-foreground">{t("priority")}</label>
                <Select value={task.priority} onValueChange={(v) => updatePriority(v as Priority)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["low", "medium", "high", "critical"] as const).map((p) => <SelectItem key={p} value={p}>{t(`priority_${p}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-card border border-border p-6">
        <h3 className="text-sm font-semibold mb-4">{t("activityLog")}</h3>
        {activity.length === 0 ? <p className="text-sm text-muted-foreground">{t("noData")}</p> : (
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start gap-3 text-sm">
                <Avatar className="size-7 mt-0.5"><AvatarImage src={a.user?.avatar_url ?? undefined} /><AvatarFallback className="text-[10px]">{initials(a.user?.full_name, a.user?.email)}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div><span className="font-medium">{a.user?.full_name ?? a.user?.email ?? "—"}</span> <span className="text-muted-foreground">{a.action.replace(/_/g, " ")}</span></div>
                  <div className="text-xs text-muted-foreground">{format(new Date(a.created_at), "d MMM yyyy, HH:mm")}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-xs text-muted-foreground mb-1">{label}</div><div>{children}</div></div>;
}
