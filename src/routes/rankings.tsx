import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useUI } from "@/contexts/UIContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";
import { aggregateScore } from "@/lib/scoring";
import { Trophy, Medal, Award } from "lucide-react";

export const Route = createFileRoute("/rankings")({
  component: () => <AppShell><Rankings /></AppShell>,
});

type Period = "daily" | "weekly" | "monthly" | "all";

function Rankings() {
  const { t } = useUI();
  const [period, setPeriod] = useState<Period>("weekly");

  const { data: profiles = [] } = useQuery({
    queryKey: ["rank-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email, avatar_url").eq("is_suspended", false);
      return data ?? [];
    },
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["rank-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("assignee_id, status, priority, deadline_at, completed_at, created_at");
      return data ?? [];
    },
  });

  const cutoff = (() => {
    const d = new Date();
    if (period === "daily") d.setHours(0, 0, 0, 0);
    if (period === "weekly") d.setDate(d.getDate() - 7);
    if (period === "monthly") d.setMonth(d.getMonth() - 1);
    if (period === "all") return null;
    return d;
  })();

  const ranking = profiles.map((p) => {
    const ut = tasks.filter((t) => t.assignee_id === p.id && (!cutoff || new Date(t.created_at) >= cutoff));
    const completed = ut.filter((t) => t.status === "completed").length;
    const onTime = ut.filter((t) => t.status === "completed" && t.completed_at && new Date(t.completed_at) <= new Date(t.deadline_at)).length;
    return { ...p, completed, onTime, score: aggregateScore(ut), total: ut.length, rate: ut.length > 0 ? Math.round((completed / ut.length) * 100) : 0 };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("rankings")}</h1>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {(["daily", "weekly", "monthly", "all"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              period === p ? "bg-card text-foreground shadow-[var(--shadow-soft)]" : "text-muted-foreground hover:text-foreground")}>
              {t(p === "all" ? "allTime" : p)}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 podium */}
      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[1, 0, 2].map((idx) => {
            const p = ranking[idx];
            const colors = ["var(--warning)", "var(--muted-foreground)", "var(--chart-5)"];
            const icons = [<Trophy className="size-5" key="t" />, <Medal className="size-5" key="m" />, <Award className="size-5" key="a" />];
            return (
              <Link key={p.id} to="/employees/$userId" params={{ userId: p.id }}
                className={cn("rounded-2xl bg-card border border-border p-4 text-center hover:shadow-[var(--shadow-soft)] transition-all", idx === 0 && "sm:-translate-y-3")}>
                <div className="mx-auto size-10 rounded-full flex items-center justify-center text-white" style={{ background: colors[idx] }}>{icons[idx]}</div>
                <Avatar className="size-14 mx-auto mt-3"><AvatarImage src={p.avatar_url ?? undefined} /><AvatarFallback>{initials(p.full_name, p.email)}</AvatarFallback></Avatar>
                <div className="mt-2 font-medium text-sm truncate">{p.full_name ?? p.email.split("@")[0]}</div>
                <div className="text-xs text-muted-foreground">#{idx + 1} · {p.score} pt</div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase">
          <div className="col-span-1">{t("rank")}</div><div className="col-span-5">{t("name")}</div><div className="col-span-2 text-center">{t("totalCompleted")}</div><div className="col-span-2 text-center">{t("onTimeRate")}</div><div className="col-span-2 text-right">{t("productivityScore")}</div>
        </div>
        {ranking.map((p, i) => (
          <Link key={p.id} to="/employees/$userId" params={{ userId: p.id }}
            className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors items-center">
            <div className="col-span-1 font-semibold text-muted-foreground">#{i + 1}</div>
            <div className="col-span-11 sm:col-span-5 flex items-center gap-3 min-w-0">
              <Avatar className="size-9"><AvatarImage src={p.avatar_url ?? undefined} /><AvatarFallback className="text-xs">{initials(p.full_name, p.email)}</AvatarFallback></Avatar>
              <div className="min-w-0"><div className="text-sm font-medium truncate">{p.full_name ?? p.email.split("@")[0]}</div><div className="text-xs text-muted-foreground truncate">{p.email}</div></div>
            </div>
            <div className="hidden sm:block col-span-2 text-center text-sm">{p.completed} / {p.total}</div>
            <div className="hidden sm:block col-span-2 text-center text-sm">{p.rate}%</div>
            <div className="hidden sm:block col-span-2 text-right text-base font-semibold text-primary">{p.score}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
