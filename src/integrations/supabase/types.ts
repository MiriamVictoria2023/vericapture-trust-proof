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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          created_at: string
          details: Json | null
          device_id: string | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          suspicious: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          created_at?: string
          details?: Json | null
          device_id?: string | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          suspicious?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          created_at?: string
          details?: Json | null
          device_id?: string | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          suspicious?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blockchain_ledger: {
        Row: {
          block_hash: string
          block_index: number
          created_at: string
          evidence_hash: string
          id: string
          nonce: number
          previous_hash: string
          user_id: string
        }
        Insert: {
          block_hash: string
          block_index: number
          created_at?: string
          evidence_hash: string
          id?: string
          nonce: number
          previous_hash: string
          user_id: string
        }
        Update: {
          block_hash?: string
          block_index?: number
          created_at?: string
          evidence_hash?: string
          id?: string
          nonce?: number
          previous_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      cases: {
        Row: {
          access_expiry: string
          assigned_to: string
          case_code: string
          created_at: string
          evidence_count: number
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_expiry?: string
          assigned_to?: string
          case_code: string
          created_at?: string
          evidence_count?: number
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_expiry?: string
          assigned_to?: string
          case_code?: string
          created_at?: string
          evidence_count?: number
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custody_log: {
        Row: {
          action: string
          actor: string
          created_at: string
          details: string | null
          evidence_id: string
          id: string
          ip_address: string
          user_id: string
        }
        Insert: {
          action: string
          actor: string
          created_at?: string
          details?: string | null
          evidence_id: string
          id?: string
          ip_address?: string
          user_id: string
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string
          details?: string | null
          evidence_id?: string
          id?: string
          ip_address?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custody_log_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "evidence_records"
            referencedColumns: ["id"]
          },
        ]
      }
      device_fingerprints: {
        Row: {
          browser: string | null
          device_id: string
          first_seen_at: string
          id: string
          language: string | null
          last_seen_at: string
          os: string | null
          screen_resolution: string | null
          timezone: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_id: string
          first_seen_at?: string
          id?: string
          language?: string | null
          last_seen_at?: string
          os?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device_id?: string
          first_seen_at?: string
          id?: string
          language?: string | null
          last_seen_at?: string
          os?: string | null
          screen_resolution?: string | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      evidence_records: {
        Row: {
          block_index: number | null
          case_id: string
          created_at: string
          device_id: string | null
          device_info: string | null
          encrypted_path: string | null
          encryption_algo: string | null
          encryption_iv: string | null
          encryption_salt: string | null
          file_name: string
          file_size: number
          file_type: string
          geo_lat: number | null
          geo_lng: number | null
          id: string
          notary_hash: string | null
          sha256_hash: string
          status: string
          tamper_status: string | null
          tamper_verified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block_index?: number | null
          case_id: string
          created_at?: string
          device_id?: string | null
          device_info?: string | null
          encrypted_path?: string | null
          encryption_algo?: string | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          file_name: string
          file_size: number
          file_type?: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          notary_hash?: string | null
          sha256_hash: string
          status?: string
          tamper_status?: string | null
          tamper_verified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block_index?: number | null
          case_id?: string
          created_at?: string
          device_id?: string | null
          device_info?: string | null
          encrypted_path?: string | null
          encryption_algo?: string | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          notary_hash?: string | null
          sha256_hash?: string
          status?: string
          tamper_status?: string | null
          tamper_verified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_records_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "investigator" | "supervisor" | "admin"
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
      app_role: ["investigator", "supervisor", "admin"],
    },
  },
} as const
