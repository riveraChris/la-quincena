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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      allocation_rules: {
        Row: {
          debts_pct: number
          expenses_pct: number
          id: string
          member_id: string
          savings_pct: number
          updated_at: string
        }
        Insert: {
          debts_pct?: number
          expenses_pct?: number
          id?: string
          member_id: string
          savings_pct?: number
          updated_at?: string
        }
        Update: {
          debts_pct?: number
          expenses_pct?: number
          id?: string
          member_id?: string
          savings_pct?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocation_rules_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          created_at: string
          family_id: string
          id: string
          month: number
          period: number
          year: number
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          month: number
          period: number
          year: number
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          month?: number
          period?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          amount: number
          budget_id: string
          debt_id: string
          id: string
          new_balance: number
          paid_at: string
        }
        Insert: {
          amount: number
          budget_id: string
          debt_id: string
          id?: string
          new_balance: number
          paid_at?: string
        }
        Update: {
          amount?: number
          budget_id?: string
          debt_id?: string
          id?: string
          new_balance?: number
          paid_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string
          current_balance: number
          family_id: string
          id: string
          interest_free_deadline: string | null
          is_auto_recalculate: boolean
          name: string
          notes: string | null
          our_minimum_payment: number
          q1_amount: number
          q2_amount: number
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          family_id: string
          id?: string
          interest_free_deadline?: string | null
          is_auto_recalculate?: boolean
          name: string
          notes?: string | null
          our_minimum_payment?: number
          q1_amount?: number
          q2_amount?: number
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          family_id?: string
          id?: string
          interest_free_deadline?: string | null
          is_auto_recalculate?: boolean
          name?: string
          notes?: string | null
          our_minimum_payment?: number
          q1_amount?: number
          q2_amount?: number
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_items: {
        Row: {
          amount: number
          budget_id: string
          category: string
          created_at: string
          debt_id: string | null
          id: string
          is_paid: boolean
          name: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
        }
        Insert: {
          amount: number
          budget_id: string
          category: string
          created_at?: string
          debt_id?: string | null
          id?: string
          is_paid?: boolean
          name: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
        }
        Update: {
          amount?: number
          budget_id?: string
          category?: string
          created_at?: string
          debt_id?: string | null
          id?: string
          is_paid?: boolean
          name?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_items_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_items_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          color: string | null
          created_at: string
          display_name: string
          family_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_name: string
          family_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_name?: string
          family_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          amount: number
          budget_id: string
          created_at: string
          id: string
          label: string | null
          member_id: string
          type: string
        }
        Insert: {
          amount: number
          budget_id: string
          created_at?: string
          id?: string
          label?: string | null
          member_id: string
          type: string
        }
        Update: {
          amount?: number
          budget_id?: string
          created_at?: string
          id?: string
          label?: string | null
          member_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomes_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          member_id: string
          subscription: Json
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          subscription: Json
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          subscription?: Json
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      savings: {
        Row: {
          amount: number
          budget_id: string
          id: string
          label: string | null
        }
        Insert: {
          amount: number
          budget_id: string
          id?: string
          label?: string | null
        }
        Update: {
          amount?: number
          budget_id?: string
          id?: string
          label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "savings_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_family_for_user: {
        Args: { family_name: string; member_display_name: string }
        Returns: string
      }
      get_my_family_ids: { Args: never; Returns: string[] }
      auto_create_quincena_expenses: {
        Args: { p_budget_id: string; p_family_id: string; p_period: number }
        Returns: undefined
      }
      get_or_create_budget: {
        Args: { p_family_id: string; p_year: number; p_month: number; p_period: number }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
