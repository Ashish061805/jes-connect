import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, CreditCard, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JES ID — Jharkhand Ekata Samaj Membership System" },
      {
        name: "description",
        content:
          "Membership management for Jharkhand Ekata Samaj: register members, collect payments, renew memberships and print QR-enabled ID cards.",
      },
      { property: "og:title", content: "JES ID — Membership Management" },
      {
        property: "og:description",
        content:
          "Register members, collect payments, renew memberships and print QR-enabled ID cards across every JES region.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: BadgeCheck, title: "Member registry", text: "Auto-numbered memberships per region with full history." },
  { icon: CreditCard, title: "Payments & renewals", text: "Permanent payment records and one-click renewals." },
  { icon: QrCode, title: "QR ID cards", text: "Preview, print and download PVC or A4 ID cards." },
  { icon: ShieldCheck, title: "Region-level security", text: "Regional admins only ever see their own members." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground">
            JES
          </div>
          <span className="font-semibold">JES ID</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Admin sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 sm:pt-20">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Jharkhand Ekata Samaj
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          One secure system for every JES member, region and renewal.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground">
          Register members with photo capture, collect and track payments, renew memberships and
          issue printable QR ID cards — with audit logs and strict region-level access.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Open the admin console</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="surface-card p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
