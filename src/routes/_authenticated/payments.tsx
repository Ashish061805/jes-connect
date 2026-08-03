import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeIndianRupee, Clock, Receipt } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useRegions } from "@/hooks/useRegions";
import { formatCurrency, formatDateTime, titleCase } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments — JES ID" },
      { name: "description", content: "Track membership fees, renewals and collections across regions." },
      { property: "og:title", content: "Payments — JES ID" },
      { property: "og:description", content: "Track membership fees, renewals and collections." },
    ],
  }),
  component: PaymentsPage,
});

type PaymentRow = {
  id: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  payment_status: string;
  payment_date: string;
  transaction_id: string | null;
  members: { full_name: string; membership_number: string | null } | null;
  regions: { name: string } | null;
};

function PaymentsPage() {
  const [region, setRegion] = useState("all");
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: regions = [] } = useRegions();

  const query = useQuery({
    queryKey: ["payments", region, type, from, to],
    queryFn: async () => {
      let q = supabase
        .from("payments")
        .select(
          "id, amount, payment_type, payment_method, payment_status, payment_date, transaction_id, members(full_name, membership_number), regions(name)",
        )
        .order("payment_date", { ascending: false })
        .limit(500);
      if (region !== "all") q = q.eq("region_id", region);
      if (type !== "all") q = q.eq("payment_type", type as never);
      if (from) q = q.gte("payment_date", from);
      if (to) q = q.lte("payment_date", `${to}T23:59:59`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PaymentRow[];
    },
  });

  const rows = query.data ?? [];
  const total = rows
    .filter((r) => r.payment_status === "paid")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const pending = rows.filter((r) => r.payment_status === "pending").length;

  return (
    <AppShell title="Payments" description="All membership fees and renewals">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Collected" value={formatCurrency(total)} icon={BadgeIndianRupee} tone="success" />
        <StatCard label="Transactions" value={String(rows.length)} icon={Receipt} />
        <StatCard label="Pending" value={String(pending)} icon={Clock} tone="warning" />
      </div>

      <div className="surface-card mt-4 grid gap-3 p-4 md:grid-cols-4">
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger>
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="new_membership">New membership</SelectItem>
            <SelectItem value="renewal">Renewal</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="surface-card mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Skeleton className="h-24 w-full" />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDateTime(p.payment_date)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{p.members?.full_name ?? "—"}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {p.members?.membership_number ?? ""}
                    </div>
                  </TableCell>
                  <TableCell>{p.regions?.name ?? "—"}</TableCell>
                  <TableCell>{titleCase(p.payment_type)}</TableCell>
                  <TableCell>{titleCase(p.payment_method)}</TableCell>
                  <TableCell>{formatCurrency(Number(p.amount))}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.payment_status} />
                  </TableCell>
                </TableRow>
              ))
            )}
            {!query.isLoading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No payments recorded for these filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}