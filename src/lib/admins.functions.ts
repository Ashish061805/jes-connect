import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  phone: z.string().optional().nullable(),
  region_id: z.string().uuid().optional().nullable(),
});

async function assertMainAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("admins")
    .select("role, is_active")
    .eq("id", context.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.role !== "main_admin" || !data.is_active) throw new Error("Forbidden");
}

export const createRegionalAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertMainAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        phone: data.phone ?? null,
        region_id: data.region_id ?? null,
        role: "regional_admin",
      },
    });
    if (error) throw new Error(error.message);

    const userId = created.user?.id;
    if (userId) {
      await supabaseAdmin
        .from("admins")
        .update({
          full_name: data.full_name,
          phone: data.phone ?? null,
          region_id: data.region_id ?? null,
          role: "regional_admin",
          is_active: true,
        })
        .eq("id", userId);
    }
    return { id: userId };
  });

export const resetAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ admin_id: z.string().uuid(), password: z.string().min(8) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertMainAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.admin_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reassignMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ from_admin_id: z.string().uuid(), to_admin_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertMainAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error: targetError } = await supabaseAdmin
      .from("admins")
      .select("id, region_id")
      .eq("id", data.to_admin_id)
      .maybeSingle();
    if (targetError) throw new Error(targetError.message);
    if (!target) throw new Error("Target admin not found");

    const { data: moved, error } = await supabaseAdmin
      .from("members")
      .update({ current_admin_id: data.to_admin_id })
      .eq("current_admin_id", data.from_admin_id)
      .select("id");
    if (error) throw new Error(error.message);
    return { moved: moved?.length ?? 0 };
  });