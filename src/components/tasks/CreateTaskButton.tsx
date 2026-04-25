import { useState } from "react";
import { Plus, Zap, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskDialog } from "./TaskDialog";
import { useUI } from "@/contexts/UIContext";
import { useAuth, hasAnyRole } from "@/contexts/AuthContext";

export function CreateTaskButton({ size = "default" }: { size?: "default" | "sm" }) {
  const { t } = useUI();
  const { roles } = useAuth();
  const [open, setOpen] = useState<"quick" | "full" | null>(null);

  if (!hasAnyRole(roles, ["super_admin", "admin", "manager"])) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size={size}
            className="gap-2 shadow-[var(--shadow-glow)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="size-4" />
            {t("addTask")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setOpen("quick")}>
            <Zap className="size-4 mr-2 text-warning" />
            {t("quickDeadline")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen("full")}>
            <ClipboardList className="size-4 mr-2 text-primary" />
            {t("fullTask")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {open && (
        <TaskDialog
          open={!!open}
          onOpenChange={(v) => !v && setOpen(null)}
          variant={open}
        />
      )}
    </>
  );
}
