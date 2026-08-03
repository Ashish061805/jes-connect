export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          region_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          region_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          region_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          admin_name: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          admin_name?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          admin_name?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          aadhaar_number: string | null
          address: string | null
          alternate_mobile: string | null
          blood_group: string | null
          created_at: string
          created_by_admin_id: string | null
          current_admin_id: string | null
          dob: string | null
          emergency_contact: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          id: string
          joining_date: string
          membership_expiry_date: string | null
          membership_number: string | null
          membership_start_date: string
          membership_status: Database["public"]["Enums"]["membership_status"]
          mobile: string
          mother_name: string | null
          occupation: string | null
          photo_url: string | null
          region_id: string
          updated_at: string
        }
        Insert: {
          aadhaar_number?: string | null
          address?: string | null
          alternate_mobile?: string | null
          blood_group?: string | null
          created_at?: string
          created_by_admin_id?: string | null
          current_admin_id?: string | null
          dob?: string | null
          emergency_contact?: string | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          joining_date?: string
          membership_expiry_date?: string | null
          membership_number?: string | null
          membership_start_date?: string
          membership_status?: Database["public"]["Enums"]["membership_status"]
          mobile: string
          mother_name?: string | null
          occupation?: string | null
          photo_url?: string | null
          region_id: string
          updated_at?: string
        }
        Update: {
          aadhaar_number?: string | null
          address?: string | null
          alternate_mobile?: string | null
          blood_group?: string | null
          created_at?: string
          created_by_admin_id?: string | null
          current_admin_id?: string | null
          dob?: string | null
          emergency_contact?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          joining_date?: string
          membership_expiry_date?: string | null
          membership_number?: string | null
          membership_start_date?: string
          membership_status?: Database["public"]["Enums"]["membership_status"]
          mobile?: string
          mother_name?: string | null
          occupation?: string | null
          photo_url?: string | null
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_current_admin_id_fkey"
            columns: ["current_admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_history: {
        Row: {
          action: string
          amount: number | null
          created_at: string
          duration_months: number | null
          id: string
          member_id: string
          new_expiry_date: string | null
          payment_id: string | null
          performed_by: string | null
          previous_expiry_date: string | null
        }
        Insert: {
          action: string
          amount?: number | null
          created_at?: string
          duration_months?: number | null
          id?: string
          member_id: string
          new_expiry_date?: string | null
          payment_id?: string | null
          performed_by?: string | null
          previous_expiry_date?: string | null
        }
        Update: {
          action?: string
          amount?: number | null
          created_at?: string
          duration_months?: number | null
          id?: string
          member_id?: string
          new_expiry_date?: string | null
          payment_id?: string | null
          performed_by?: string | null
          previous_expiry_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_history_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_history_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          collected_by_admin: string | null
          created_at: string
          id: string
          member_id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_type: Database["public"]["Enums"]["payment_type"]
          region_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          collected_by_admin?: string | null
          created_at?: string
          id?: string
          member_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type?: Database["public"]["Enums"]["payment_type"]
          region_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          collected_by_admin?: string | null
          created_at?: string
          id?: string
          member_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_type?: Database["public"]["Enums"]["payment_type"]
          region_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_collected_by_admin_fkey"
            columns: ["collected_by_admin"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          city: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          member_counter: number
          name: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          member_counter?: number
          name: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          member_counter?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_member: { Args: { _member_id: string }; Returns: boolean }
      is_active_admin: { Args: { _uid: string }; Returns: boolean }
      is_main_admin: { Args: { _uid: string }; Returns: boolean }
      my_region: { Args: { _uid: string }; Returns: string }
    }
    Enums: {
      app_role: "main_admin" | "regional_admin"
      membership_status: "active" | "expired" | "suspended" | "lifetime"
      payment_method: "cash" | "upi" | "card" | "bank_transfer" | "cheque"
      payment_status: "paid" | "pending" | "failed" | "refunded"
      payment_type: "new_membership" | "renewal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["main_admin", "regional_admin"],
      membership_status: ["active", "expired", "suspended", "lifetime"],
      payment_method: ["cash", "upi", "card", "bank_transfer", "cheque"],
      payment_status: ["paid", "pending", "failed", "refunded"],
      payment_type: ["new_membership", "renewal"],
    },
  },
} as const
