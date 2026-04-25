import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUI } from "@/contexts/UIContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  assignee_id: z.string().uuid().nullable(),
  deadline_date: z.string().min(1),
  deadline_time: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

type FormData = z.infer<typeof taskSchema>;

export function TaskDialog({
  open,
  onOpenChange,
  variant,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  variant: "quick" | "full";
}) {
  const { t } = useUI();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [employees, setEmployees] = useState<{ id: string; full_name: string | null; email: string }[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      assignee_id: null,
      deadline_date: defaultDate(),
      deadline_time: "18:00",
      priority: "medium",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: "",
      description: "",
      assignee_id: null,
      deadline_date: defaultDate(),
      deadline_time: "18:00",
      priority: "medium",
    });
    // load employees
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("is_suspended", false)
        .order("full_name");
      setEmployees(data ?? []);
    })();
  }, [open]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    const deadline = new Date(`${data.deadline_date}T${data.deadline_time}`);
    if (isNaN(deadline.getTime())) {
      toast.error("Invalid date");
      return;
    }
    const { error } = await supabase.from("tasks").insert({
      title: data.title,
      description: data.description || null,
      assignee_id: data.assignee_id,
      created_by: user.id,
      deadline_at: deadline.toISOString(),
      priority: data.priority,
      status: "new",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("taskCreated"));
    qc.invalidateQueries();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {variant === "quick" ? t("quickDeadline") : t("fullTask")}
          </DialogTitle>
          <DialogDescription>
            {variant === "quick"
              ? t("addTask")
              : t("addTask")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>{t("title")} *</Label>
            <Input {...form.register("title")} className="mt-1.5" autoFocus />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive mt-1">{t("required")}</p>
            )}
          </div>

          {variant === "full" && (
            <div>
              <Label>{t("description")}</Label>
              <Textarea {...form.register("description")} className="mt-1.5" rows={3} />
            </div>
          )}

          <div>
            <Label>{t("assignee")} *</Label>
            <Select
              value={form.watch("assignee_id") ?? "__unassigned__"}
              onValueChange={(v) =>
                form.setValue("assignee_id", v === "__unassigned__" ? null : v, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={t("selectAssignee")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">{t("unassigned")}</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name ?? e.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("deadlineDate")}</Label>
              <Input type="date" {...form.register("deadline_date")} className="mt-1.5" />
            </div>
            <div>
              <Label>{t("deadlineTime")}</Label>
              <Input type="time" {...form.register("deadline_time")} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>{t("priority")}</Label>
            <Select
              value={form.watch("priority")}
              onValueChange={(v) => form.setValue("priority", v as FormData["priority"])}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t("priority_low")}</SelectItem>
                <SelectItem value="medium">{t("priority_medium")}</SelectItem>
                <SelectItem value="high">{t("priority_high")}</SelectItem>
                <SelectItem value="critical">{t("priority_critical")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
