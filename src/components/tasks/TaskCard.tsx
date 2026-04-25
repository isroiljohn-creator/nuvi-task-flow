import { Link } from "@tanstack/react-router";
import { CalendarClock, User } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useUI } from "@/contexts/UIContext";
import { StatusBadge, PriorityBadge } from "./badges";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { isOverdue } from "@/lib/scoring";
import { format } from "date-fns";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface TaskRow extends Task {
  assignee?: Pick<Profile, "id" | "full_name" | "email" | "avatar_url"> | null;
}

export function TaskCard({ task }: { task: TaskRow }) {
  const { t } = useUI();
  const overdue = isOverdue(task.deadline_at, task.status);
  const displayStatus = overdue && task.status !== "completed" && task.status !== "cancelled"
    ? "overdue"
    : task.status;

  return (
    <Link
      to="/tasks/$taskId"
      params={{ taskId: task.id }}
      className="block group"
    >
      <div className="rounded-2xl bg-card border border-border p-4 transition-all hover:border-primary/30 hover:shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {task.title}
          </h3>
          <PriorityBadge priority={task.priority} t={t} />
        </div>

        {task.description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {task.assignee ? (
              <>
                <Avatar className="size-6">
                  <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {initials(task.assignee.full_name, task.assignee.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {task.assignee.full_name ?? task.assignee.email.split("@")[0]}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="size-3.5" />
                {t("unassigned")}
              </span>
            )}
          </div>
          <StatusBadge status={displayStatus} t={t} />
        </div>

        <div
          className={`mt-3 inline-flex items-center gap-1.5 text-xs ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}
        >
          <CalendarClock className="size-3.5" />
          {format(new Date(task.deadline_at), "d MMM, HH:mm")}
        </div>
      </div>
    </Link>
  );
}
