import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
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
import { formatDate, isExpired } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/members/")({
  head: () => ({
    meta: [
      { title: "Members — JES ID" },
      { name: "description", content: "Search, filter and manage Jharkhand Ekata Samaj members." },
      { property: "og:title", content: "Members — JES ID" },
      { property: "og:description", content: "Search, filter and manage JES members." },
    ],
  }),
  component: MembersPage,
});

const PAGE_SIZE = 20;

type Row = {
  id: string;
  membership_number: string | null;
  full_name: string;
  mobile: string;
  gender: string | null;
  joining_date: string;
  membership_status: string;
  membership_expiry_date: string | null;
  region_id: string;
  regions: { name: string } | null;
};

function MembersPage() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState("all");
  const [gender, setGender] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const { data: regions = [] } = useRegions();

  const membersQuery = useQuery({
    queryKey: ["members", search, region, status, gender, from, to],
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select(
          "id, membership_number, full_name, mobile, gender, joining_date, membership_status, membership_expiry_date, region_id, regions(name)",
        )
        .order("created_at", { ascending: false })
        .limit(500);

      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(
          `full_name.ilike.${term},mobile.ilike.${term},membership_number.ilike.${term}`,
        );
      }
      if (region !== "all") query = query.eq("region_id", region);
      if (status !== "all") query = query.eq("membership_status", status as never);
      if (gender !== "all") query = query.eq("gender", gender);
      if (from) query = query.gte("joining_date", from);
      if (to) query = query.lte("joining_date", to);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rows = membersQuery.data ?? [];
  const pageRows = useMemo(
    () => rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [rows, page],
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  return (
    <AppShell
      title="Members"
      description={`${rows.length} member${rows.length === 1 ? "" : "s"} found`}
      actions={
        <Button asChild size="sm">
          <Link to="/members/new">
            <UserPlus className="mr-1.5 h-4 w-4" /> Add member
          </Link>
        </Button>
      }
    >
      <div className="surface-card p-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, mobile or membership no."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
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
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
            </SelectContent>
          </Select>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger>
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="surface-card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membership no.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersQuery.isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : pageRows.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{m.membership_number}</TableCell>
                      <TableCell className="font-medium">{m.full_name}</TableCell>
                      <TableCell>{m.mobile}</TableCell>
                      <TableCell>{m.regions?.name ?? "—"}</TableCell>
                      <TableCell>{formatDate(m.joining_date)}</TableCell>
                      <TableCell>
                        {m.membership_status === "lifetime"
                          ? "Lifetime"
                          : formatDate(m.membership_expiry_date)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={
                            isExpired(m) && m.membership_status === "active"
                              ? "expired"
                              : m.membership_status
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link to="/members/$id" params={{ id: m.id }}>
                            Open
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              {!membersQuery.isLoading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    No members match these filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {pages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}