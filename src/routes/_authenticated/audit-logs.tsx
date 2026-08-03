import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, titleCase } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  head: () => ({
    meta: [
      { title: "Audit logs — JES ID" },
      { name: "description", content: "Immutable trail of every admin action in the JES membership system." },
      { property: "og:title", content: "Audit logs — JES ID" },
      { property: "og:description", content: "Immutable trail of every admin action." },
    ],
  }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["audit-logs", search],
    queryFn: async () => {
      let q = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        q = q.or(`admin_name.ilike.${term},action.ilike.${term},description.ilike.${term}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell title="Audit logs" description="Every action is recorded and cannot be edited">
      <div className="surface-card p-4">
        <Input
          placeholder="Search by admin, action or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="surface-card mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-24 w-full" />
                </TableCell>
              </TableRow>
            ) : (
              (query.data ?? []).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(log.created_at)}</TableCell>
                  <TableCell className="font-medium">{log.admin_name}</TableCell>
                  <TableCell>{titleCase(log.action)}</TableCell>
                  <TableCell className="text-muted-foreground">{log.description ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
            {!query.isLoading && (query.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  No activity recorded yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}