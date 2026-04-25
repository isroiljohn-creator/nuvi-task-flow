import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ListTodo,
  ClipboardList,
  CalendarDays,
  Users,
  Trophy,
  Bell,
  Shield,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { useAuth, hasAnyRole, type AppRole } from "@/contexts/AuthContext";
import { useUI } from "@/contexts/UIContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { PendingPage } from "@/components/auth/PendingPage";
import { SuspendedPage } from "@/components/auth/SuspendedPage";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGS } from "@/lib/i18n";
import type { DictKey } from "@/lib/i18n";

interface NavItem {
  to: string;
  labelKey: DictKey;
  icon: typeof LayoutDashboard;
  roles?: AppRole[];
}

const NAV: NavItem[] = [
  { to: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/my-tasks", labelKey: "myTasks", icon: ListTodo },
  {
    to: "/tasks",
    labelKey: "allTasks",
    icon: ClipboardList,
    roles: ["super_admin", "admin", "manager", "viewer"],
  },
  { to: "/calendar", labelKey: "calendar", icon: CalendarDays },
  {
    to: "/employees",
    labelKey: "employees",
    icon: Users,
    roles: ["super_admin", "admin", "manager", "viewer"],
  },
  { to: "/rankings", labelKey: "rankings", icon: Trophy },
  { to: "/notifications", labelKey: "notifications", icon: Bell },
  {
    to: "/admin",
    labelKey: "admin",
    icon: Shield,
    roles: ["super_admin", "admin"],
  },
  { to: "/settings", labelKey: "settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, roles, loading, signOut } = useAuth();
  const { lang, setLang, theme, toggleTheme, t } = useUI();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Subscribe to notification count
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count ?? 0);
    };
    fetchCount();
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchCount(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (profile?.is_suspended) return <SuspendedPage />;
  if (roles.length === 0 || (roles.length === 1 && roles[0] === "pending")) {
    return <PendingPage />;
  }

  const visibleNav = NAV.filter((n) => !n.roles || hasAnyRole(roles, n.roles));

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-sidebar">
        <SidebarContent
          nav={visibleNav}
          unreadCount={unreadCount}
          t={t}
        />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-sidebar flex flex-col">
            <SidebarContent
              nav={visibleNav}
              unreadCount={unreadCount}
              t={t}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
            >
              <Menu className="size-5" />
            </Button>
            <div className="lg:hidden flex items-center gap-2">
              <BrandMark />
              <span className="font-semibold text-sm">NUVI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <span>{LANGS.find((l) => l.code === lang)?.flag}</span>
                  <span className="hidden sm:inline text-xs font-medium uppercase">{lang}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGS.map((l) => (
                  <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)}>
                    <span className="mr-2">{l.flag}</span>
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <Link to="/notifications" className="relative">
              <Button variant="ghost" size="icon">
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80">
                  <Avatar className="size-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {initials(profile?.full_name, profile?.email)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate">
                      {profile?.full_name ?? profile?.email}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{profile?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">{t("profile")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">{t("settings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="size-4 mr-2" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div
      className="size-8 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-sm shadow-[var(--shadow-glow)]"
      style={{ background: "var(--gradient-primary)" }}
    >
      N
    </div>
  );
}

function SidebarContent({
  nav,
  unreadCount,
  t,
  onClose,
}: {
  nav: NavItem[];
  unreadCount: number;
  t: (key: DictKey) => string;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 items-center justify-between px-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark />
          <div>
            <div className="text-sm font-semibold leading-tight">NUVI Task</div>
            <div className="text-[10px] text-muted-foreground">AI Academy</div>
          </div>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {nav.map((item) => (
          <NavLinkItem
            key={item.to}
            to={item.to}
            label={t(item.labelKey)}
            icon={item.icon}
            badge={item.to === "/notifications" && unreadCount > 0 ? unreadCount : undefined}
          />
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          © NUVI AI Academy
        </p>
      </div>
    </>
  );
}

function NavLinkItem({
  to,
  label,
  icon: Icon,
  badge,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
      activeProps={{
        className:
          "!bg-sidebar-accent !text-sidebar-accent-foreground shadow-[var(--shadow-soft)]",
      }}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
