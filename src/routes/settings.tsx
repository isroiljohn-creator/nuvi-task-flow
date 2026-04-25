import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useUI } from "@/contexts/UIContext";
import { LANGS } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: () => <AppShell><Settings /></AppShell>,
});

function Settings() {
  const { t, lang, setLang, theme, setTheme } = useUI();
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("settings")}</h1>

      <section className="rounded-2xl bg-card border border-border p-6">
        <h2 className="text-sm font-semibold mb-4">{t("language")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code)} className={cn("flex items-center gap-3 rounded-xl border p-4 transition-all text-left",
              lang === l.code ? "border-primary bg-accent/30" : "border-border hover:border-primary/30")}>
              <span className="text-2xl">{l.flag}</span>
              <span className="font-medium">{l.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-card border border-border p-6">
        <h2 className="text-sm font-semibold mb-4">{t("theme")}</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setTheme("light")} className={cn("flex items-center gap-3 rounded-xl border p-4 transition-all",
            theme === "light" ? "border-primary bg-accent/30" : "border-border hover:border-primary/30")}>
            <Sun className="size-5" /><span className="font-medium">{t("light")}</span>
          </button>
          <button onClick={() => setTheme("dark")} className={cn("flex items-center gap-3 rounded-xl border p-4 transition-all",
            theme === "dark" ? "border-primary bg-accent/30" : "border-border hover:border-primary/30")}>
            <Moon className="size-5" /><span className="font-medium">{t("dark")}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
