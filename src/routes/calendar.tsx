import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useUI } from "@/contexts/UIContext";
import { useAuth, hasAnyRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PRIORITY_COLOR } from "@/components/tasks/badges";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, addMonths, subMonths,
} from "date-fns";

export const Route = createFileRoute("/calendar")({
  component: () => <AppShell><CalendarPage /></AppShell>,
});

function CalendarPage() {
  const { t } = useUI();
  const { user, roles } = useAuth();
  const isManager = hasAnyRole(roles, ["super_admin", "admin", "manager", "viewer"]);
  const [cursor, setCursor] = useState(new Date());

  const { data: tasks = [] } = useQuery({
    queryKey: ["calendar-tasks", user?.id, isManager],
    queryFn: async () => {
      const q = supabase.from("tasks").select("id, title, deadline_at, priority, status, assignee_id");
      const { data } = isManager ? await q : await q.eq("assignee_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const days = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("calendar")}</h1>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft className="size-4" /></Button>
          <div className="text-base font-semibold">{format(cursor, "MMMM yyyy")}</div>
          <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="size-4" /></Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 text-xs text-muted-foreground text-center font-medium">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayTasks = tasks.filter((t) => isSameDay(new Date(t.deadline_at), day));
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={`min-h-[80px] sm:min-h-[110px] rounded-xl border p-1.5 sm:p-2 ${inMonth ? "bg-background" : "bg-muted/30 opacity-60"} ${isToday ? "border-primary" : "border-border"}`}>
                <div className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>{format(day, "d")}</div>
                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <Link key={task.id} to="/tasks/$taskId" params={{ taskId: task.id }}
                      className="block text-[10px] sm:text-xs truncate rounded px-1.5 py-0.5 text-white"
                      style={{ background: PRIORITY_COLOR[task.priority] }}>
                      {task.title}
                    </Link>
                  ))}
                  {dayTasks.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
