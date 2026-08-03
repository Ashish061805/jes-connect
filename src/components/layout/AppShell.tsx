import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  ChartNoAxesColumn,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ScrollText,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentAdmin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mainOnly: false },
  { to: "/members", label: "Members", icon: Users, mainOnly: false },
  { to: "/payments", label: "Payments", icon: BadgeIndianRupee, mainOnly: false },
  { to: "/regions", label: "Regions", icon: Map, mainOnly: true },
  { to: "/admins", label: "Regional Admins", icon: ShieldCheck, mainOnly: true },
  { to: "/reports", label: "Reports", icon: ChartNoAxesColumn, mainOnly: false },
  { to: "/audit-logs", label: "Audit Logs", icon: ScrollText, mainOnly: true },
] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { data } = useCurrentAdmin();
  const admin = data?.admin;
  const isMain = admin?.role === "main_admin";
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const items = NAV.filter((item) => !item.mainOnly || isMain);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 no-print",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
              JES
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">JES ID</p>
              <p className="text-xs opacity-70">Jharkhand Ekata Samaj</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "opacity-80 hover:bg-sidebar-accent/60 hover:opacity-100",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4 text-xs">
          <p className="font-semibold">{admin?.full_name}</p>
          <p className="opacity-70">{isMain ? "Main Admin" : "Regional Admin"}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="mt-3 w-full justify-start px-2 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden no-print"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur no-print sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground no-print">
          <FileText className="mr-1 inline h-3 w-3" />
          JES ID — Membership Management System
        </footer>
      </div>
    </div>
  );
}