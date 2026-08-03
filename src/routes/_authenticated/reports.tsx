import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — JES ID" },
      { name: "description", content: "Export member and collection reports for any region and date range." },
      { property: "og:title", content: "Reports — JES ID" },
      { property: "og:description", content: "Export member and collection reports." },
    ],
  }),
  component: ReportsPage,
});

type ReportRow = {
  membership_number: string | null;
  full_name: string;
  mobile: string;
  joining_date: string;
  membership_expiry_date: string | null;
  membership_status: string;
  regions: { name: string } | null;
};

function toCsv(rows: ReportRow[]) {
  const header = [
    "Membership No",
    "Name",
    "Mobile",
    "Region",
    "Joining date",
    "Expiry date",
    "Status",
  ];
  const body = rows.map((r) =>
    [
      r.membership_number ?? "",
      r.full_name,
      r.mobile,
      r.regions?.name ?? "",
      r.joining_date,
      r.membership_expiry_date ?? "",
      r.membership_status,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...body].join("\n");
}

function ReportsPage() {
  const { data: regions = [] } = useRegions();
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const query = useQuery({
    queryKey: ["report-members", region, status, from, to],
    queryFn: async () => {
      let q = supabase
        .from("members")
        .select(
          "membership_number, full_name, mobile, joining_date, membership_expiry_date, membership_status, regions(name)",
        )
        .order("joining_date", { ascending: false })
        .limit(2000);
      if (region !== "all") q = q.eq("region_id", region);
      if (status !== "all") q = q.eq("membership_status", status as never);
      if (from) q = q.gte("joining_date", from);
      if (to) q = q.lte("joining_date", to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ReportRow[];
    },
  });

  const collectionsQuery = useQuery({
    queryKey: ["report-collections", region, from, to],
    queryFn: async () => {
      let q = supabase.from("payments").select("amount, payment_status, region_id, regions(name)").limit(5000);
      if (region !== "all") q = q.eq("region_id", region);
      if (from) q = q.gte("payment_date", from);
      if (to) q = q.lte("payment_date", `${to}T23:59:59`);
      const { data, error } = await q;
      if (error) throw error;
      const totals = new Map<string, number>();
      for (const p of (data ?? []) as unknown as {
        amount: number;
        payment_status: string;
        regions: { name: string } | null;
      }[]) {
        if (p.payment_status !== "paid") continue;
        const key = p.regions?.name ?? "Unassigned";
        totals.set(key, (totals.get(key) ?? 0) + Number(p.amount));
      }
      return [...totals.entries()].map(([name, total]) => ({ name, total }));
    },
  });

  const rows = query.data ?? [];

  function download() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jes-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      title="Reports"
      description="Filter member data and export it as CSV"
      actions={
        <Button size="sm" onClick={download} disabled={rows.length === 0}>
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      }
    >
      <div className="surface-card grid gap-3 p-4 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Region</Label>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger>
              <SelectValue />
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
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Joined from</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Joined to</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membership no.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 100).map((r) => (
                <TableRow key={`${r.membership_number}-${r.mobile}`}>
                  <TableCell className="font-mono text-xs">{r.membership_number}</TableCell>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell>{r.regions?.name ?? "—"}</TableCell>
                  <TableCell>{formatDate(r.joining_date)}</TableCell>
                  <TableCell className="capitalize">{r.membership_status}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No records for these filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="surface-card h-fit p-5">
          <h2 className="text-sm font-semibold">Collections by region</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(collectionsQuery.data ?? []).map((c) => (
              <li key={c.name} className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">{c.name}</span>
                <span className="font-semibold">{formatCurrency(c.total)}</span>
              </li>
            ))}
            {(collectionsQuery.data ?? []).length === 0 ? (
              <li className="text-muted-foreground">No collections yet.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}