export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          business_name: string
          industry: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          phone: string | null
          website: string | null
          gbp_url: string | null
          primary_contact_name: string | null
          primary_contact_email: string | null
          status: 'active' | 'inactive' | 'paused'
          logo_url: string | null
          brand_colors: Json | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      gbp_audit_items: {
        Row: {
          id: string
          client_id: string
          created_at: string
          updated_at: string
          category: string
          item: string
          status: 'complete' | 'incomplete' | 'na'
          notes: string | null
          priority: 'high' | 'medium' | 'low'
        }
        Insert: Omit<Database['public']['Tables']['gbp_audit_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['gbp_audit_items']['Insert']>
      }
      keywords: {
        Row: {
          id: string
          client_id: string
          created_at: string
          updated_at: string
          keyword: string
          target_location: string | null
          current_rank: number | null
          previous_rank: number | null
          best_rank: number | null
          search_volume: number | null
          notes: string | null
          is_tracked: boolean
        }
        Insert: Omit<Database['public']['Tables']['keywords']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['keywords']['Insert']>
      }
      keyword_history: {
        Row: {
          id: string
          keyword_id: string
          recorded_at: string
          rank: number
          url: string | null
        }
        Insert: Omit<Database['public']['Tables']['keyword_history']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['keyword_history']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          client_id: string
          created_at: string
          updated_at: string
          platform: 'google' | 'yelp' | 'facebook' | 'other'
          reviewer_name: string
          rating: number
          review_text: string | null
          review_date: string
          responded: boolean
          response_text: string | null
          response_date: string | null
          sentiment: 'positive' | 'neutral' | 'negative' | null
          external_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      competitors: {
        Row: {
          id: string
          client_id: string
          created_at: string
          updated_at: string
          business_name: string
          website: string | null
          gbp_url: string | null
          address: string | null
          avg_rating: number | null
          review_count: number | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['competitors']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['competitors']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          client_id: string | null
          created_at: string
          updated_at: string
          title: string
          description: string | null
          due_date: string
          status: 'pending' | 'in_progress' | 'completed' | 'overdue'
          priority: 'high' | 'medium' | 'low'
          category: string | null
          assigned_to: string | null
          is_recurring: boolean
          recurrence_pattern: string | null
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      branding_profiles: {
        Row: {
          id: string
          client_id: string
          created_at: string
          updated_at: string
          primary_color: string | null
          secondary_color: string | null
          accent_color: string | null
          font_primary: string | null
          font_secondary: string | null
          logo_url: string | null
          tagline: string | null
          brand_voice: string | null
          target_audience: string | null
          usp: string | null
          social_handles: Json | null
        }
        Insert: Omit<Database['public']['Tables']['branding_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['branding_profiles']['Insert']>
      }
      gbp_settings: {
        Row: {
          id: string
          client_id: string
          created_at: string
          updated_at: string
          business_description: string | null
          categories: string[] | null
          attributes: Json | null
          service_areas: string[] | null
          hours: Json | null
          special_hours: Json | null
          products: Json | null
          services: Json | null
          questions_answers: Json | null
          photos_count: number | null
          posts_frequency: string | null
        }
        Insert: Omit<Database['public']['Tables']['gbp_settings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['gbp_settings']['Insert']>
      }
      performance_metrics: {
        Row: {
          id: string
          client_id: string
          recorded_at: string
          metric_type: string
          value: number
          period: string
        }
        Insert: Omit<Database['public']['Tables']['performance_metrics']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['performance_metrics']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience types
export type Client = Database['public']['Tables']['clients']['Row']
export type GBPAuditItem = Database['public']['Tables']['gbp_audit_items']['Row']
export type Keyword = Database['public']['Tables']['keywords']['Row']
export type KeywordHistory = Database['public']['Tables']['keyword_history']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Competitor = Database['public']['Tables']['competitors']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type BrandingProfile = Database['public']['Tables']['branding_profiles']['Row']
export type GBPSettings = Database['public']['Tables']['gbp_settings']['Row']
export type PerformanceMetric = Database['public']['Tables']['performance_metrics']['Row']
