import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Admin } from "@/lib/types";

export function useCurrentAdmin() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["current-admin"] });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ["current-admin"],
    staleTime: 30_000,
    queryFn: async (): Promise<{ admin: Admin | null; email: string | null }> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return { admin: null, email: null };
      const { data, error } = await supabase.from("admins").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return { admin: data as Admin | null, email: user.email ?? null };
    },
  });
}

export function useIsMainAdmin() {
  const { data } = useCurrentAdmin();
  return data?.admin?.role === "main_admin";
}