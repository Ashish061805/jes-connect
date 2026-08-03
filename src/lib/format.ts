export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addMonths(dateISO: string, months: number) {
  const d = new Date(dateISO);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function isExpired(member: { membership_status: string; membership_expiry_date: string | null }) {
  if (member.membership_status === "lifetime") return false;
  if (!member.membership_expiry_date) return false;
  return new Date(member.membership_expiry_date) < new Date(new Date().toDateString());
}

export function daysUntil(dateISO: string | null) {
  if (!dateISO) return null;
  const diff = new Date(dateISO).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}