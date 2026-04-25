// Productivity scoring rules
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

export function scoreForTask(task: Pick<Task, "status" | "priority" | "deadline_at" | "completed_at">): number {
  let score = 0;
  if (task.status === "completed") {
    score += 10;
    if (task.priority === "high") score += 10;
    if (task.priority === "critical") score += 20;
    if (task.completed_at && task.deadline_at && new Date(task.completed_at) <= new Date(task.deadline_at)) {
      score += 10; // on-time bonus
    }
  } else {
    const isLate = task.status !== "cancelled" && new Date(task.deadline_at) < new Date();
    if (task.status === "overdue" || isLate) {
      score -= 10;
      if (task.priority === "critical") score -= 15;
    }
  }
  return score;
}

export function aggregateScore(tasks: Pick<Task, "status" | "priority" | "deadline_at" | "completed_at">[]): number {
  return tasks.reduce((sum, t) => sum + scoreForTask(t), 0);
}

export function isOverdue(deadlineAt: string, status: string): boolean {
  if (status === "completed" || status === "cancelled") return false;
  return new Date(deadlineAt) < new Date();
}
