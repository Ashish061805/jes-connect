import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PhotoCapture } from "@/components/PhotoCapture";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentAdmin } from "@/hooks/useAuth";
import { useRegions } from "@/hooks/useRegions";
import { uploadMemberPhoto } from "@/lib/photos";
import { logAudit } from "@/lib/audit";
import { addMonths, todayISO } from "@/lib/format";
import { BLOOD_GROUPS, GENDERS, PAYMENT_METHODS } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/members/new")({
  head: () => ({
    meta: [
      { title: "Register Member — JES ID" },
      { name: "description", content: "Register a new Jharkhand Ekata Samaj member with photo, details and payment." },
      { property: "og:title", content: "Register Member — JES ID" },
      { property: "og:description", content: "Register a new JES member with photo, details and payment." },
    ],
  }),
  component: NewMemberPage,
});

function NewMemberPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useCurrentAdmin();
  const admin = me?.admin;
  const isMain = admin?.role === "main_admin";
  const { data: regions = [] } = useRegions(true);

  const [photo, setPhoto] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    father_name: "",
    mother_name: "",
    mobile: "",
    alternate_mobile: "",
    gender: "",
    dob: "",
    occupation: "",
    blood_group: "",
    aadhaar_number: "",
    address: "",
    emergency_contact: "",
    region_id: "",
    joining_date: todayISO(),
    membership_status: "active",
    duration_months: "12",
    amount: "500",
    payment_method: "cash",
    transaction_id: "",
  });

  const regionId = isMain ? form.region_id : (admin?.region_id ?? "");

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!admin) return;
    if (!regionId) {
      toast.error("Select a region for this member");
      return;
    }
    setSaving(true);
    try {
      let photoPath: string | null = null;
      if (photo) {
        photoPath = await uploadMemberPhoto(photo, "jpg");
      }

      const months = Number(form.duration_months || 12);
      const isLifetime = form.membership_status === "lifetime";
      const start = form.joining_date || todayISO();

      const { data: member, error } = await supabase
        .from("members")
        .insert({
          full_name: form.full_name,
          father_name: form.father_name || null,
          mother_name: form.mother_name || null,
          mobile: form.mobile,
          alternate_mobile: form.alternate_mobile || null,
          gender: form.gender || null,
          dob: form.dob || null,
          occupation: form.occupation || null,
          blood_group: form.blood_group || null,
          aadhaar_number: form.aadhaar_number || null,
          address: form.address || null,
          emergency_contact: form.emergency_contact || null,
          photo_url: photoPath,
          region_id: regionId,
          created_by_admin_id: admin.id,
          current_admin_id: admin.id,
          joining_date: start,
          membership_status: isLifetime ? "lifetime" : "active",
          membership_start_date: start,
          membership_expiry_date: isLifetime ? null : addMonths(start, months),
        })
        .select("*")
        .single();
      if (error) throw error;

      const amount = Number(form.amount || 0);
      let paymentId: string | null = null;
      if (amount > 0) {
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert({
            member_id: member.id,
            payment_type: "new_membership",
            amount,
            payment_method: form.payment_method as never,
            payment_status: "paid",
            transaction_id: form.transaction_id || null,
            region_id: regionId,
            collected_by_admin: admin.id,
          })
          .select("id")
          .single();
        if (paymentError) throw paymentError;
        paymentId = payment.id;
      }

      await supabase.from("membership_history").insert({
        member_id: member.id,
        action: "new_membership",
        previous_expiry_date: null,
        new_expiry_date: member.membership_expiry_date,
        duration_months: isLifetime ? null : months,
        amount,
        payment_id: paymentId,
        performed_by: admin.id,
      });

      await logAudit({
        adminId: admin.id,
        adminName: admin.full_name,
        action: "member_registered",
        description: `Registered ${member.full_name} (${member.membership_number})`,
        entityType: "member",
        entityId: member.id,
      });

      queryClient.invalidateQueries();
      toast.success(`Member registered — ${member.membership_number}`);
      navigate({ to: "/members/$id", params: { id: member.id } });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not register member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Register new member" description="Capture photo, details and the membership payment">
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="surface-card h-fit p-5">
          <h2 className="text-sm font-semibold">Member photo</h2>
          <p className="mb-4 text-xs text-muted-foreground">Capture with camera or upload a file.</p>
          <PhotoCapture value={photo} onChange={setPhoto} />
        </div>

        <div className="space-y-6">
          <section className="surface-card p-5">
            <h2 className="text-sm font-semibold">Personal details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required>
                <Input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </Field>
              <Field label="Mobile" required>
                <Input
                  required
                  inputMode="tel"
                  value={form.mobile}
                  onChange={(e) => set("mobile", e.target.value)}
                />
              </Field>
              <Field label="Father's name">
                <Input value={form.father_name} onChange={(e) => set("father_name", e.target.value)} />
              </Field>
              <Field label="Mother's name">
                <Input value={form.mother_name} onChange={(e) => set("mother_name", e.target.value)} />
              </Field>
              <Field label="Alternate mobile">
                <Input
                  value={form.alternate_mobile}
                  onChange={(e) => set("alternate_mobile", e.target.value)}
                />
              </Field>
              <Field label="Emergency contact">
                <Input
                  value={form.emergency_contact}
                  onChange={(e) => set("emergency_contact", e.target.value)}
                />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date of birth">
                <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              </Field>
              <Field label="Occupation">
                <Input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} />
              </Field>
              <Field label="Blood group">
                <Select value={form.blood_group} onValueChange={(v) => set("blood_group", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Aadhaar number">
                <Input
                  value={form.aadhaar_number}
                  onChange={(e) => set("aadhaar_number", e.target.value)}
                />
              </Field>
              <Field label="Joining date">
                <Input
                  type="date"
                  value={form.joining_date}
                  onChange={(e) => set("joining_date", e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address">
                  <Textarea rows={3} value={form.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
              </div>
            </div>
          </section>

          <section className="surface-card p-5">
            <h2 className="text-sm font-semibold">Membership</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Region" required>
                {isMain ? (
                  <Select value={form.region_id} onValueChange={(v) => set("region_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    readOnly
                    value={regions.find((r) => r.id === admin?.region_id)?.name ?? "Not assigned"}
                  />
                )}
              </Field>
              <Field label="Membership type">
                <Select value={form.membership_status} onValueChange={(v) => set("membership_status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Standard (with expiry)</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Duration (months)">
                <Input
                  type="number"
                  min={1}
                  disabled={form.membership_status === "lifetime"}
                  value={form.duration_months}
                  onChange={(e) => set("duration_months", e.target.value)}
                />
              </Field>
            </div>
          </section>

          <section className="surface-card p-5">
            <h2 className="text-sm font-semibold">Membership payment</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Amount (₹)">
                <Input
                  type="number"
                  min={0}
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                />
              </Field>
              <Field label="Payment method">
                <Select value={form.payment_method} onValueChange={(v) => set("payment_method", v)}>
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
              </Field>
              <Field label="Transaction ID">
                <Input
                  value={form.transaction_id}
                  onChange={(e) => set("transaction_id", e.target.value)}
                />
              </Field>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save member & generate ID"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/members" })}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}