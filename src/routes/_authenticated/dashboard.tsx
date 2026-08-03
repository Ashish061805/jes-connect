import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BadgeIndianRupee,
  CalendarClock,
  Map,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentAdmin } from "@/hooks/useAuth";
import { formatCurrency, formatDate, formatDateTime, isExpired, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — JES ID" },
      { name: "description", content: "Membership, collection and renewal overview for JES admins." },
      { property: "og:title", content: "Dashboard — JES ID" },
      { property: "og:description", content: "Membership, collection and renewal overview." },
    ],
  }),
  component: DashboardPage,
});

type MemberRow = {
  id: string;
  created_at: string;
  membership_status: string;
  membership_expiry_date: string | null;
  region_id: string;
  full_name: string;
  membership_number: string | null;
  regions: { name: string } | null;
};

function DashboardPage() {
  const { data: me } = useCurrentAdmin();
  const isMain = me?.admin?.role === "main_admin";

  const membersQuery = useQuery({
    queryKey: ["dashboard-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select(
          "id, created_at, membership_status, membership_expiry_date, region_id, full_name, membership_number, regions(name)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MemberRow[];
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ["dashboard-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, payment_date, region_id, payment_status, regions(name)")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        amount: number;
        payment_date: string;
        region_id: string | null;
        payment_status: string;
        regions: { name: string } | null;
      }[];
    },
  });

  const metaQuery = useQuery({
    queryKey: ["dashboard-meta", isMain],
    enabled: Boolean(me?.admin),
    queryFn: async () => {
      const [regions, admins] = await Promise.all([
        supabase.from("regions").select("id", { count: "exact", head: true }),
        supabase.from("admins").select("id", { count: "exact", head: true }),
      ]);
      return { regions: regions.count ?? 0, admins: admins.count ?? 0 };
    },
  });

  const members = membersQuery.data ?? [];
  const payments = (paymentsQuery.data ?? []).filter((p) => p.payment_status === "paid");
  const today = todayISO();

  const active = members.filter((m) => !isExpired(m) && m.membership_status !== "suspended").length;
  const expired = members.filter((m) => isExpired(m) || m.membership_status === "expired").length;
  const todayRegistrations = members.filter((m) => m.created_at.slice(0, 10) === today).length;
  const todayCollection = payments
    .filter((p) => p.payment_date.slice(0, 10) === today)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const monthKey = today.slice(0, 7);
  const monthlyRevenue = payments
    .filter((p) => p.payment_date.slice(0, 7) === monthKey)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const expiringSoon = members.filter((m) => {
    if (!m.membership_expiry_date || m.membership_status === "lifetime") return false;
    const days = (new Date(m.membership_expiry_date).getTime() - Date.now()) / 86_400_000;
    return days >= 0 && days <= 30;
  }).length;

  const byRegion = Object.values(
    members.reduce<Record<string, { name: string; members: number }>>((acc, m) => {
      const name = m.regions?.name ?? "Unassigned";
      acc[name] = acc[name] ?? { name, members: 0 };
      acc[name].members += 1;
      return acc;
    }, {}),
  );

  const revenueByRegion = Object.values(
    payments.reduce<Record<string, { name: string; revenue: number }>>((acc, p) => {
      const name = p.regions?.name ?? "Unassigned";
      acc[name] = acc[name] ?? { name, revenue: 0 };
      acc[name].revenue += Number(p.amount);
      return acc;
    }, {}),
  );

  const growth = (() => {
    const buckets: { month: string; members: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      buckets.push({
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        members: members.filter((m) => m.created_at.slice(0, 7) === key).length,
      });
    }
    return buckets;
  })();

  const loading = membersQuery.isLoading || paymentsQuery.isLoading;
  const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <AppShell
      title={isMain ? "Main Admin Dashboard" : "My Dashboard"}
      description={
        isMain ? "Organisation-wide membership and collection overview" : "Your region at a glance"
      }
      actions={
        <Button asChild size="sm">
          <Link to="/members/new">
            <UserPlus className="mr-1.5 h-4 w-4" /> Add member
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={isMain ? "Total members" : "My members"} value={members.length} icon={Users} loading={loading} />
        <StatCard label="Active members" value={active} icon={ShieldCheck} tone="success" loading={loading} />
        <StatCard label="Expired" value={expired} icon={CalendarClock} tone="destructive" loading={loading} />
        <StatCard label="Expiring in 30 days" value={expiringSoon} icon={Activity} tone="warning" loading={loading} />
        <StatCard label="Today's registrations" value={todayRegistrations} icon={UserPlus} loading={loading} />
        <StatCard
          label="Today's collections"
          value={formatCurrency(todayCollection)}
          icon={BadgeIndianRupee}
          loading={loading}
        />
        <StatCard
          label="Monthly revenue"
          value={formatCurrency(monthlyRevenue)}
          icon={TrendingUp}
          loading={loading}
        />
        {isMain ? (
          <StatCard
            label="Regions / Admins"
            value={`${metaQuery.data?.regions ?? 0} / ${metaQuery.data?.admins ?? 0}`}
            icon={Map}
            loading={metaQuery.isLoading}
          />
        ) : (
          <StatCard
            label="Pending renewals"
            value={expired + expiringSoon}
            icon={CalendarClock}
            tone="warning"
            loading={loading}
          />
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="text-sm font-semibold">Members by region</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="members" radius={[6, 6, 0, 0]}>
                  {byRegion.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="text-sm font-semibold">Revenue by region</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="revenue" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="text-sm font-semibold">Monthly growth</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Line type="monotone" dataKey="members" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="text-sm font-semibold">Recent registrations</h2>
          <ul className="mt-4 divide-y divide-border">
            {members.slice(0, 6).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <Link to="/members/$id" params={{ id: m.id }} className="truncate font-medium hover:underline">
                    {m.full_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {m.membership_number} · {m.regions?.name ?? "—"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(m.created_at)}
                </span>
              </li>
            ))}
            {!loading && members.length === 0 ? (
              <li className="py-6 text-sm text-muted-foreground">
                No members yet. Start by adding your first member.
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="mt-6 surface-card p-5">
        <h2 className="text-sm font-semibold">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link to="/members/new">Add member</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to="/members">Search members</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to="/payments">View collections</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to="/reports">Reports</Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Last updated {formatDate(today)}
        </p>
      </div>
    </AppShell>
  );
}