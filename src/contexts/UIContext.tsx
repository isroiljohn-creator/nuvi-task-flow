import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import { dict } from "@/lib/i18n";

type Theme = "light" | "dark";

interface UIContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  t: (key: keyof typeof dict) => string;
}

const UIContext = createContext<UIContextValue | null>(null);

function detectLang(): Lang {
  if (typeof window === "undefined") return "uz";
  const stored = localStorage.getItem("nuvi-lang") as Lang | null;
  if (stored === "uz" || stored === "ru") return stored;
  const nav = navigator.language?.toLowerCase() ?? "";
  if (nav.startsWith("ru")) return "ru";
  return "uz";
}

function detectTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("nuvi-theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return "light";
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    setLangState(detectLang());
    setThemeState(detectTheme());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("nuvi-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("nuvi-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const value: UIContextValue = {
    lang,
    setLang: setLangState,
    theme,
    setTheme: setThemeState,
    toggleTheme: () => setThemeState((t) => (t === "light" ? "dark" : "light")),
    t: (key) => dict[key]?.[lang] ?? String(key),
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
}
