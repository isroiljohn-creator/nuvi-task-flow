import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CreateTaskButton } from "@/components/tasks/CreateTaskButton";
import { useUI } from "@/contexts/UIContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/my-tasks")({
  component: () => <AppShell><MyTasks /></AppShell>,
});

function MyTasks() {
  const { t } = useUI();
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["my-tasks", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, avatar_url)")
        .eq("assignee_id", user!.id)
        .order("deadline_at");
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("myTasks")}</h1>
        <CreateTaskButton />
      </div>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">{t("loading")}</p>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-12 text-center">
          <p className="text-muted-foreground">{t("noTasks")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => <TaskCard key={task.id} task={task as never} />)}
        </div>
      )}
    </div>
  );
}
