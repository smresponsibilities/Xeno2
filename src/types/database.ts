export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          shopify_id: string
          store_url: string
          access_token: string
          has_ingested_initial_data: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shopify_id: string
          store_url: string
          access_token: string
          has_ingested_initial_data?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shopify_id?: string
          store_url?: string
          access_token?: string
          has_ingested_initial_data?: boolean
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          shopify_id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          total_spent: number
          orders_count: number
          store_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shopify_id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          total_spent?: number
          orders_count?: number
          store_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shopify_id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          total_spent?: number
          orders_count?: number
          store_id?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          shopify_id: string
          title: string
          vendor: string
          store_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shopify_id: string
          title: string
          vendor: string
          store_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shopify_id?: string
          title?: string
          vendor?: string
          store_id?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          shopify_id: string
          total_price: number
          fulfillment_status: string
          processed_at: string
          customer_id: string
          store_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shopify_id: string
          total_price: number
          fulfillment_status: string
          processed_at: string
          customer_id: string
          store_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shopify_id?: string
          total_price?: number
          fulfillment_status?: string
          processed_at?: string
          customer_id?: string
          store_id?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
