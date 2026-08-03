import { supabase } from "@/integrations/supabase/client";

export async function logAudit(params: {
  adminId: string;
  adminName: string;
  action: string;
  description?: string;
  entityType?: string;
  entityId?: string;
}) {
  try {
    await supabase.from("audit_logs").insert({
      admin_id: params.adminId,
      admin_name: params.adminName,
      action: params.action,
      description: params.description ?? null,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
    });
  } catch (error) {
    console.error("audit log failed", error);
  }
}