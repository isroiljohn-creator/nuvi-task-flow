import type { Database } from "@/integrations/supabase/types";
import type { DictKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Status = Database["public"]["Enums"]["task_status"];
type Priority = Database["public"]["Enums"]["task_priority"];

const statusStyles: Record<Status, string> = {
  new: "bg-accent text-accent-foreground",
  in_progress: "bg-primary/10 text-primary",
  waiting: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const priorityStyles: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-accent text-accent-foreground",
  high: "bg-warning/15 text-warning",
  critical: "bg-destructive/15 text-destructive",
};

export function StatusBadge({
  status,
  t,
}: {
  status: Status;
  t: (k: DictKey) => string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
      )}
    >
      {t(`status_${status}` as DictKey)}
    </span>
  );
}

export function PriorityBadge({
  priority,
  t,
}: {
  priority: Priority;
  t: (k: DictKey) => string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        priorityStyles[priority],
      )}
    >
      {t(`priority_${priority}` as DictKey)}
    </span>
  );
}

export const PRIORITY_COLOR: Record<Priority, string> = {
  low: "var(--muted-foreground)",
  medium: "var(--primary)",
  high: "var(--warning)",
  critical: "var(--destructive)",
};
