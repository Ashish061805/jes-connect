import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Region } from "@/lib/types";

export function useRegions(activeOnly = false) {
  return useQuery({
    queryKey: ["regions", activeOnly],
    staleTime: 60_000,
    queryFn: async () => {
      let query = supabase.from("regions").select("*").order("name");
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Region[];
    },
  });
}

export function useAdmins() {
  return useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admins")
        .select("*, regions(name, code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}