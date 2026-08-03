import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import { useAdmins, useRegions } from "@/hooks/useRegions";
import { useCurrentAdmin } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { formatDate, titleCase } from "@/lib/format";
import {
  createRegionalAdmin,
  reassignMembers,
  resetAdminPassword,
} from "@/lib/admins.functions";

export const Route = createFileRoute("/_authenticated/admins")({
  head: () => ({
    meta: [
      { title: "Regional admins — JES ID" },
      { name: "description", content: "Create regional admins, reset passwords and reassign members." },
      { property: "og:title", content: "Regional admins — JES ID" },
      { property: "og:description", content: "Create regional admins and reassign members." },
    ],
  }),
  component: AdminsPage,
});

type AdminRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  region_id: string | null;
  regions: { name: string; code: string } | null;
};

function AdminsPage() {
  const { data: admins = [], isLoading } = useAdmins();
  const { data: regions = [] } = useRegions(true);
  const { data: me } = useCurrentAdmin();
  const queryClient = useQueryClient();
  const createFn = useServerFn(createRegionalAdmin);
  const resetFn = useServerFn(resetAdminPassword);
  const reassignFn = useServerFn(reassignMembers);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    region_id: "",
  });
  const [reassign, setReassign] = useState<{ from: AdminRow | null; to: string }>({
    from: null,
    to: "",
  });

  const rows = admins as unknown as AdminRow[];

  async function create() {
    if (!me?.admin) return;
    setSaving(true);
    try {
      await createFn({
        data: {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          phone: form.phone || null,
          region_id: form.region_id || null,
        },
      });
      await logAudit({
        adminId: me.admin.id,
        adminName: me.admin.full_name,
        action: "admin_created",
        description: `Created regional admin ${form.full_name}`,
        entityType: "admin",
      });
      toast.success("Regional admin created");
      setOpen(false);
      setForm({ full_name: "", email: "", password: "", phone: "", region_id: "" });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create admin");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(admin: AdminRow, active: boolean) {
    const { error } = await supabase.from("admins").update({ is_active: active }).eq("id", admin.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(active ? "Admin activated" : "Admin deactivated — members are untouched");
    queryClient.invalidateQueries({ queryKey: ["admins"] });
  }

  async function doReset(admin: AdminRow) {
    const password = window.prompt(`New password for ${admin.full_name} (min 8 characters)`);
    if (!password) return;
    try {
      await resetFn({ data: { admin_id: admin.id, password } });
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed");
    }
  }

  async function doReassign() {
    if (!reassign.from || !reassign.to) return;
    try {
      const result = await reassignFn({
        data: { from_admin_id: reassign.from.id, to_admin_id: reassign.to },
      });
      toast.success(`${result.moved} member(s) reassigned`);
      setReassign({ from: null, to: "" });
      queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reassignment failed");
    }
  }

  return (
    <AppShell
      title="Regional admins"
      description="Members always stay in the system, even when an admin leaves."
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          Add admin
        </Button>
      }
    >
      <div className="surface-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Active</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.full_name}</TableCell>
                <TableCell>{a.email ?? "—"}</TableCell>
                <TableCell>{a.regions?.name ?? "All regions"}</TableCell>
                <TableCell>{titleCase(a.role)}</TableCell>
                <TableCell>{formatDate(a.created_at)}</TableCell>
                <TableCell>
                  <Switch
                    checked={a.is_active}
                    disabled={a.role === "main_admin"}
                    onCheckedChange={(v) => toggleActive(a, v)}
                  />
                </TableCell>
                <TableCell className="space-x-2 text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => doReset(a)}>
                    Reset password
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReassign({ from: a, to: "" })}
                  >
                    Reassign members
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No admins yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add regional admin</DialogTitle>
            <DialogDescription>
              They will only see members of their assigned region.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Temporary password</Label>
                <Input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Select
                  value={form.region_id}
                  onValueChange={(v) => setForm({ ...form, region_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={create}
              disabled={saving || !form.email || form.password.length < 8 || !form.full_name}
            >
              {saving ? "Creating…" : "Create admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(reassign.from)}
        onOpenChange={(v) => !v && setReassign({ from: null, to: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign members</DialogTitle>
            <DialogDescription>
              Move every member currently handled by {reassign.from?.full_name} to another admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New admin</Label>
            <Select value={reassign.to} onValueChange={(v) => setReassign({ ...reassign, to: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select admin" />
              </SelectTrigger>
              <SelectContent>
                {rows
                  .filter((a) => a.id !== reassign.from?.id && a.is_active)
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.full_name} — {a.regions?.name ?? "All regions"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassign({ from: null, to: "" })}>
              Cancel
            </Button>
            <Button onClick={doReassign} disabled={!reassign.to}>
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}