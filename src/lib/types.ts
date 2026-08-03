import type { Tables } from "@/integrations/supabase/types";

export type Region = Tables<"regions">;
export type Admin = Tables<"admins">;
export type Member = Tables<"members">;
export type Payment = Tables<"payments">;
export type MembershipHistory = Tables<"membership_history">;
export type AuditLog = Tables<"audit_logs">;

export type MembershipStatus = "active" | "expired" | "suspended" | "lifetime";
export type PaymentType = "new_membership" | "renewal";
export type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer" | "cheque";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

export type MemberWithRelations = Member & {
  regions?: Pick<Region, "id" | "name" | "code" | "city"> | null;
};

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const GENDERS = ["Male", "Female", "Other"];