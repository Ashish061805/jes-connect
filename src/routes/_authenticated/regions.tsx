import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useCurrentAdmin } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/regions")({
  head: () => ({
    meta: [
      { title: "Regions — JES ID" },
      { name: "description", content: "Create and manage JES regions and their membership code prefixes." },
      { property: "og:title", content: "Regions — JES ID" },
      { property: "og:description", content: "Create and manage JES regions and code prefixes." },
    ],
  }),
  component: RegionsPage,
});

function RegionsPage() {
  const { data: regions = [], isLoading } = useRegions();
  const { data: me } = useCurrentAdmin();
  const admin = me?.admin;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", city: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!admin) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("regions").insert({
        name: form.name,
        code: form.code.toUpperCase(),
        city: form.city || null,
        description: form.description || null,
      });
      if (error) throw error;
      await logAudit({
        adminId: admin.id,
        adminName: admin.full_name,
        action: "region_created",
        description: `Created region ${form.name} (${form.code.toUpperCase()})`,
        entityType: "region",
      });
      toast.success("Region created");
      setForm({ name: "", code: "", city: "", description: "" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create region");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    const { error } = await supabase.from("regions").update({ is_active: isActive }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["regions"] });
  }

  return (
    <AppShell
      title="Regions"
      description="Membership numbers are generated per region prefix."
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          Add region
        </Button>
      }
    >
      <div className="surface-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell>{r.city ?? "—"}</TableCell>
                <TableCell>{r.description ?? "—"}</TableCell>
                <TableCell>{formatDate(r.created_at)}</TableCell>
                <TableCell>
                  <Switch checked={r.is_active} onCheckedChange={(v) => toggle(r.id, v)} />
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && regions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No regions yet. Add your first region to start registering members.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add region</DialogTitle>
            <DialogDescription>
              The code becomes part of membership numbers, e.g. JES-RNC-000001.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Region name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Code (2-5 letters)</Label>
              <Input
                value={form.code}
                maxLength={5}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={saving || !form.name || !form.code}>
              {saving ? "Saving…" : "Create region"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}