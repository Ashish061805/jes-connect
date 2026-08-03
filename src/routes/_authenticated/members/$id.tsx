import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { IDCard } from "@/components/IDCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useCurrentAdmin } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { addMonths, formatCurrency, formatDate, formatDateTime, isExpired, titleCase, todayISO } from "@/lib/format";
import { getPhotoUrl } from "@/lib/photos";
import { PAYMENT_METHODS, type MemberWithRelations } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/members/$id")({
  head: () => ({
    meta: [
      { title: "Member profile — JES ID" },
      { name: "description", content: "View a JES member profile, payments, renewals and ID card." },
      { property: "og:title", content: "Member profile — JES ID" },
      { property: "og:description", content: "View member profile, payments, renewals and ID card." },
    ],
  }),
  component: MemberDetailPage,
});

function MemberDetailPage() {
  const { id } = useParams({ from: "/_authenticated/members/$id" });
  const queryClient = useQueryClient();
  const { data: me } = useCurrentAdmin();
  const admin = me?.admin;
  const [renewOpen, setRenewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const memberQuery = useQuery({
    queryKey: ["member", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*, regions(id, name, code, city)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as MemberWithRelations | null;
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ["member-payments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("member_id", id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const historyQuery = useQuery({
    queryKey: ["member-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_history")
        .select("*")
        .eq("member_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const member = memberQuery.data;

  useEffect(() => {
    let cancelled = false;
    getPhotoUrl(member?.photo_url).then((url) => {
      if (!cancelled) setPhoto(url);
    });
    return () => {
      cancelled = true;
    };
  }, [member?.photo_url]);

  if (memberQuery.isLoading) {
    return (
      <AppShell title="Member profile">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (!member) {
    return (
      <AppShell title="Member not found">
        <div className="surface-card p-8 text-sm text-muted-foreground">
          This member does not exist or is not assigned to you.{" "}
          <Link to="/members" className="text-primary underline">
            Back to members
          </Link>
        </div>
      </AppShell>
    );
  }

  const displayStatus =
    isExpired(member) && member.membership_status === "active" ? "expired" : member.membership_status;

  async function onPrinted() {
    if (!admin || !member) return;
    await logAudit({
      adminId: admin.id,
      adminName: admin.full_name,
      action: "id_card_printed",
      description: `ID card generated for ${member.membership_number}`,
      entityType: "member",
      entityId: member.id,
    });
  }

  return (
    <AppShell
      title={member.full_name}
      description={`${member.membership_number} · ${member.regions?.name ?? "—"}`}
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button size="sm" onClick={() => setRenewOpen(true)}>
            Renew
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="surface-card h-fit p-5">
          <div className="mx-auto h-40 w-32 overflow-hidden rounded-xl border border-border bg-muted">
            {photo ? (
              <img src={photo} alt={member.full_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No photo
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <p className="font-semibold">{member.full_name}</p>
            <p className="font-mono text-xs text-muted-foreground">{member.membership_number}</p>
            <div className="mt-2 flex justify-center">
              <StatusBadge status={displayStatus} />
            </div>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <Row label="Mobile" value={member.mobile} />
            <Row label="Alternate" value={member.alternate_mobile} />
            <Row label="Gender" value={member.gender} />
            <Row label="DOB" value={formatDate(member.dob)} />
            <Row label="Blood group" value={member.blood_group} />
            <Row label="Occupation" value={member.occupation} />
            <Row label="Father" value={member.father_name} />
            <Row label="Mother" value={member.mother_name} />
            <Row label="Aadhaar" value={member.aadhaar_number} />
            <Row label="Joined" value={formatDate(member.joining_date)} />
            <Row
              label="Expiry"
              value={
                member.membership_status === "lifetime"
                  ? "Lifetime"
                  : formatDate(member.membership_expiry_date)
              }
            />
            <Row label="Address" value={member.address} />
          </dl>
        </div>

        <Tabs defaultValue="card">
          <TabsList>
            <TabsTrigger value="card">ID card</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="mt-4">
            <div className="surface-card p-5">
              <IDCard member={member} onPrinted={onPrinted} />
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <div className="surface-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(paymentsQuery.data ?? []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDateTime(p.payment_date)}</TableCell>
                      <TableCell>{titleCase(p.payment_type)}</TableCell>
                      <TableCell>{formatCurrency(Number(p.amount))}</TableCell>
                      <TableCell>{titleCase(p.payment_method)}</TableCell>
                      <TableCell>
                        <StatusBadge status={p.payment_status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.transaction_id ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {(paymentsQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        No payments recorded.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="surface-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Previous expiry</TableHead>
                    <TableHead>New expiry</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(historyQuery.data ?? []).map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>{formatDateTime(h.created_at)}</TableCell>
                      <TableCell>{titleCase(h.action)}</TableCell>
                      <TableCell>{formatDate(h.previous_expiry_date)}</TableCell>
                      <TableCell>{formatDate(h.new_expiry_date)}</TableCell>
                      <TableCell>{formatCurrency(Number(h.amount ?? 0))}</TableCell>
                    </TableRow>
                  ))}
                  {(historyQuery.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No membership history yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <RenewDialog
        open={renewOpen}
        onOpenChange={setRenewOpen}
        member={member}
        onDone={() => queryClient.invalidateQueries()}
      />
      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        member={member}
        onDone={() => queryClient.invalidateQueries()}
      />
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] break-words text-right text-xs font-medium">{value || "—"}</dd>
    </div>
  );
}

function RenewDialog({
  open,
  onOpenChange,
  member,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member: MemberWithRelations;
  onDone: () => void;
}) {
  const { data: me } = useCurrentAdmin();
  const admin = me?.admin;
  const [months, setMonths] = useState("12");
  const [amount, setAmount] = useState("500");
  const [method, setMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [saving, setSaving] = useState(false);

  async function renew() {
    if (!admin) return;
    setSaving(true);
    try {
      const base =
        member.membership_expiry_date && new Date(member.membership_expiry_date) > new Date()
          ? member.membership_expiry_date
          : todayISO();
      const newExpiry = addMonths(base, Number(months || 12));

      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          member_id: member.id,
          payment_type: "renewal",
          amount: Number(amount || 0),
          payment_method: method as never,
          payment_status: "paid",
          transaction_id: transactionId || null,
          region_id: member.region_id,
          collected_by_admin: admin.id,
        })
        .select("id")
        .single();
      if (paymentError) throw paymentError;

      const { error: updateError } = await supabase
        .from("members")
        .update({ membership_expiry_date: newExpiry, membership_status: "active" })
        .eq("id", member.id);
      if (updateError) throw updateError;

      await supabase.from("membership_history").insert({
        member_id: member.id,
        action: "renewal",
        previous_expiry_date: member.membership_expiry_date,
        new_expiry_date: newExpiry,
        duration_months: Number(months || 12),
        amount: Number(amount || 0),
        payment_id: payment.id,
        performed_by: admin.id,
      });

      await logAudit({
        adminId: admin.id,
        adminName: admin.full_name,
        action: "membership_renewed",
        description: `Renewed ${member.membership_number} until ${newExpiry}`,
        entityType: "member",
        entityId: member.id,
      });

      toast.success("Membership renewed");
      onOpenChange(false);
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Renewal failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renew membership</DialogTitle>
          <DialogDescription>
            Membership number {member.membership_number} stays the same.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Renewal duration (months)</Label>
            <Input type="number" min={1} value={months} onChange={(e) => setMonths(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Renewal fee (₹)</Label>
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Transaction ID</Label>
            <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={renew} disabled={saving}>
            {saving ? "Renewing…" : "Confirm renewal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  open,
  onOpenChange,
  member,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member: MemberWithRelations;
  onDone: () => void;
}) {
  const { data: me } = useCurrentAdmin();
  const admin = me?.admin;
  const [form, setForm] = useState({
    full_name: member.full_name,
    mobile: member.mobile,
    alternate_mobile: member.alternate_mobile ?? "",
    occupation: member.occupation ?? "",
    address: member.address ?? "",
    emergency_contact: member.emergency_contact ?? "",
    membership_status: member.membership_status as string,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!admin) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("members")
        .update({
          full_name: form.full_name,
          mobile: form.mobile,
          alternate_mobile: form.alternate_mobile || null,
          occupation: form.occupation || null,
          address: form.address || null,
          emergency_contact: form.emergency_contact || null,
          membership_status: form.membership_status as never,
        })
        .eq("id", member.id);
      if (error) throw error;
      await logAudit({
        adminId: admin.id,
        adminName: admin.full_name,
        action: "member_updated",
        description: `Updated ${member.membership_number}`,
        entityType: "member",
        entityId: member.id,
      });
      toast.success("Member updated");
      onOpenChange(false);
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit member</DialogTitle>
          <DialogDescription>Records are never deleted, only updated.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Mobile</Label>
            <Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Alternate mobile</Label>
            <Input
              value={form.alternate_mobile}
              onChange={(e) => setForm({ ...form, alternate_mobile: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Emergency contact</Label>
            <Input
              value={form.emergency_contact}
              onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Occupation</Label>
            <Input
              value={form.occupation}
              onChange={(e) => setForm({ ...form, occupation: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.membership_status}
              onValueChange={(v) => setForm({ ...form, membership_status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Textarea
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}