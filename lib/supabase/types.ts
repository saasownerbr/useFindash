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
      accessories: {
        Row: {
          category: string | null
          cost: number
          created_at: string
          id: string
          name: string
          quantity: number
          sale_price: number
          store_id: string
        }
        Insert: {
          category?: string | null
          cost: number
          created_at?: string
          id?: string
          name: string
          quantity?: number
          sale_price: number
          store_id: string
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          sale_price?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accessories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_entries: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          month: string
          store_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          description: string
          id?: string
          month: string
          store_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          month?: string
          store_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_entries_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          acquisition_channel: string | null
          birthdate: string | null
          created_at: string
          id: string
          ltv: number
          name: string
          store_id: string
          whatsapp: string
        }
        Insert: {
          acquisition_channel?: string | null
          birthdate?: string | null
          created_at?: string
          id?: string
          ltv?: number
          name: string
          store_id: string
          whatsapp: string
        }
        Update: {
          acquisition_channel?: string | null
          birthdate?: string | null
          created_at?: string
          id?: string
          ltv?: number
          name?: string
          store_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_inputs: {
        Row: {
          created_at: string
          id: string
          leads_instagram: number
          leads_pdv: number
          leads_referral: number
          leads_whatsapp: number
          month: string
          paid_traffic_investment: number
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leads_instagram?: number
          leads_pdv?: number
          leads_referral?: number
          leads_whatsapp?: number
          month: string
          paid_traffic_investment?: number
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leads_instagram?: number
          leads_pdv?: number
          leads_referral?: number
          leads_whatsapp?: number
          month?: string
          paid_traffic_investment?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_inputs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_costs: {
        Row: {
          battery_cost: number | null
          camera_cost: number | null
          id: string
          model: string
          screen_cost: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          battery_cost?: number | null
          camera_cost?: number | null
          id?: string
          model: string
          screen_cost?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          battery_cost?: number | null
          camera_cost?: number | null
          id?: string
          model?: string
          screen_cost?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_costs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      price_reference: {
        Row: {
          base_price: number
          grade_multiplier_a: number
          grade_multiplier_a_plus: number
          grade_multiplier_b: number
          grade_multiplier_c: number
          id: string
          model: string
          storage: string
          store_id: string
          updated_at: string
        }
        Insert: {
          base_price: number
          grade_multiplier_a?: number
          grade_multiplier_a_plus?: number
          grade_multiplier_b?: number
          grade_multiplier_c?: number
          id?: string
          model: string
          storage: string
          store_id: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          grade_multiplier_a?: number
          grade_multiplier_a_plus?: number
          grade_multiplier_b?: number
          grade_multiplier_c?: number
          id?: string
          model?: string
          storage?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_reference_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          acquisition_cost: number
          checkup_data: Json | null
          color: string | null
          created_at: string
          days_in_stock: number
          final_price: number | null
          grade: string | null
          id: string
          imei: string | null
          model: string
          purchase_date: string | null
          repair_cost: number
          status: string
          storage: string
          store_id: string
          suggested_price: number | null
          supplier: string | null
          type: string
        }
        Insert: {
          acquisition_cost: number
          checkup_data?: Json | null
          color?: string | null
          created_at?: string
          days_in_stock?: number
          final_price?: number | null
          grade?: string | null
          id?: string
          imei?: string | null
          model: string
          purchase_date?: string | null
          repair_cost?: number
          status?: string
          storage: string
          store_id: string
          suggested_price?: number | null
          supplier?: string | null
          type: string
        }
        Update: {
          acquisition_cost?: number
          checkup_data?: Json | null
          color?: string | null
          created_at?: string
          days_in_stock?: number
          final_price?: number | null
          grade?: string | null
          id?: string
          imei?: string | null
          model?: string
          purchase_date?: string | null
          repair_cost?: number
          status?: string
          storage?: string
          store_id?: string
          suggested_price?: number | null
          supplier?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_accessories: {
        Row: {
          accessory_id: string
          id: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          accessory_id: string
          id?: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Update: {
          accessory_id?: string
          id?: string
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_accessories_accessory_id_fkey"
            columns: ["accessory_id"]
            isOneToOne: false
            referencedRelation: "accessories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_accessories_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          acquisition_cost: number
          commission_amount: number | null
          customer_id: string
          gross_margin: number | null
          id: string
          installments: number
          payment_method: string | null
          product_id: string | null
          repair_cost: number
          sale_channel: string
          sale_price: number
          seller_id: string
          sold_at: string
          store_id: string
        }
        Insert: {
          acquisition_cost?: number
          commission_amount?: number | null
          customer_id: string
          gross_margin?: number | null
          id?: string
          installments?: number
          payment_method?: string | null
          product_id?: string | null
          repair_cost?: number
          sale_channel: string
          sale_price: number
          seller_id: string
          sold_at?: string
          store_id: string
        }
        Update: {
          acquisition_cost?: number
          commission_amount?: number | null
          customer_id?: string
          gross_margin?: number | null
          id?: string
          installments?: number
          payment_method?: string | null
          product_id?: string | null
          repair_cost?: number
          sale_channel?: string
          sale_price?: number
          seller_id?: string
          sold_at?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "store_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_users: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          name: string
          role: string
          store_id: string
          user_id: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          name: string
          role: string
          store_id: string
          user_id: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          name?: string
          role?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_users_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          logo_url: string | null
          min_margin: number
          monthly_revenue_goal: number
          name: string
          stock_alert_days: number
          upgrade_alert_months: number
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          min_margin?: number
          monthly_revenue_goal?: number
          name: string
          stock_alert_days?: number
          upgrade_alert_months?: number
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          min_margin?: number
          monthly_revenue_goal?: number
          name?: string
          stock_alert_days?: number
          upgrade_alert_months?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_sale: {
        Args: {
          p_accessories: Json
          p_acquisition_cost: number
          p_customer_id: string
          p_installments: number
          p_payment_method: string
          p_product_id: string | null
          p_repair_cost: number
          p_sale_channel: string
          p_sale_price: number
          p_seller_id: string
          p_store_id: string
        }
        Returns: string
      }
      create_store_with_owner: {
        Args: {
          monthly_goal?: number
          owner_name: string
          store_cnpj?: string
          store_name: string
        }
        Returns: string
      }
      has_store_role: {
        Args: { roles: string[]; target_store_id: string }
        Returns: boolean
      }
      is_store_member: { Args: { target_store_id: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
