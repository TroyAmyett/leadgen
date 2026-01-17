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
      leads: {
        Row: {
          id: string
          account_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          company: string | null
          title: string | null
          linkedin_url: string | null
          website: string | null
          enrichment_data: Json
          enrichment_status: 'pending' | 'enriching' | 'enriched' | 'failed' | 'skipped'
          enrichment_provider: string | null
          enriched_at: string | null
          source: 'manual' | 'csv_import' | 'api' | 'scrape' | 'integration'
          source_details: Json
          lead_score: number | null
          lead_grade: 'A' | 'B' | 'C' | 'D' | 'F' | null
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'disqualified' | 'archived'
          created_at: string
          created_by: string
          created_by_type: 'user' | 'agent'
          updated_at: string
          updated_by: string
          updated_by_type: 'user' | 'agent'
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_type: 'user' | 'agent' | null
          tags: string[]
          external_ids: Json
        }
        Insert: {
          id?: string
          account_id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          title?: string | null
          linkedin_url?: string | null
          website?: string | null
          enrichment_data?: Json
          enrichment_status?: 'pending' | 'enriching' | 'enriched' | 'failed' | 'skipped'
          enrichment_provider?: string | null
          enriched_at?: string | null
          source?: 'manual' | 'csv_import' | 'api' | 'scrape' | 'integration'
          source_details?: Json
          lead_score?: number | null
          lead_grade?: 'A' | 'B' | 'C' | 'D' | 'F' | null
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'disqualified' | 'archived'
          created_at?: string
          created_by: string
          created_by_type?: 'user' | 'agent'
          updated_at?: string
          updated_by: string
          updated_by_type?: 'user' | 'agent'
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_type?: 'user' | 'agent' | null
          tags?: string[]
          external_ids?: Json
        }
        Update: {
          id?: string
          account_id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          title?: string | null
          linkedin_url?: string | null
          website?: string | null
          enrichment_data?: Json
          enrichment_status?: 'pending' | 'enriching' | 'enriched' | 'failed' | 'skipped'
          enrichment_provider?: string | null
          enriched_at?: string | null
          source?: 'manual' | 'csv_import' | 'api' | 'scrape' | 'integration'
          source_details?: Json
          lead_score?: number | null
          lead_grade?: 'A' | 'B' | 'C' | 'D' | 'F' | null
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'disqualified' | 'archived'
          created_at?: string
          created_by?: string
          created_by_type?: 'user' | 'agent'
          updated_at?: string
          updated_by?: string
          updated_by_type?: 'user' | 'agent'
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_type?: 'user' | 'agent' | null
          tags?: string[]
          external_ids?: Json
        }
      }
      enrichment_jobs: {
        Row: {
          id: string
          account_id: string
          lead_id: string
          provider: 'local' | 'apify' | 'mock' | 'clearbit' | 'apollo' | 'hunter'
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          input: Json
          result: Json | null
          error: string | null
          started_at: string | null
          completed_at: string | null
          duration_ms: number | null
          credits_used: number
          created_at: string
          created_by: string
          created_by_type: 'user' | 'agent'
        }
        Insert: {
          id?: string
          account_id: string
          lead_id: string
          provider: 'local' | 'apify' | 'mock' | 'clearbit' | 'apollo' | 'hunter'
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          input?: Json
          result?: Json | null
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
          credits_used?: number
          created_at?: string
          created_by: string
          created_by_type?: 'user' | 'agent'
        }
        Update: {
          id?: string
          account_id?: string
          lead_id?: string
          provider?: 'local' | 'apify' | 'mock' | 'clearbit' | 'apollo' | 'hunter'
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
          input?: Json
          result?: Json | null
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
          credits_used?: number
          created_at?: string
          created_by?: string
          created_by_type?: 'user' | 'agent'
        }
      }
      import_batches: {
        Row: {
          id: string
          account_id: string
          filename: string
          file_size: number | null
          total_rows: number | null
          imported_rows: number
          failed_rows: number
          duplicate_rows: number
          column_mapping: Json
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          error: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          created_by_type: 'user' | 'agent'
        }
        Insert: {
          id?: string
          account_id: string
          filename: string
          file_size?: number | null
          total_rows?: number | null
          imported_rows?: number
          failed_rows?: number
          duplicate_rows?: number
          column_mapping: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          created_by_type?: 'user' | 'agent'
        }
        Update: {
          id?: string
          account_id?: string
          filename?: string
          file_size?: number | null
          total_rows?: number | null
          imported_rows?: number
          failed_rows?: number
          duplicate_rows?: number
          column_mapping?: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          created_by_type?: 'user' | 'agent'
        }
      }
      leadgen_user_preferences: {
        Row: {
          id: string
          user_id: string
          default_enrichment_provider: string
          auto_enrich_on_import: boolean
          default_import_mapping: Json
          table_columns: Json
          items_per_page: number
          notify_on_import_complete: boolean
          notify_on_enrichment_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_enrichment_provider?: string
          auto_enrich_on_import?: boolean
          default_import_mapping?: Json
          table_columns?: Json
          items_per_page?: number
          notify_on_import_complete?: boolean
          notify_on_enrichment_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_enrichment_provider?: string
          auto_enrich_on_import?: boolean
          default_import_mapping?: Json
          table_columns?: Json
          items_per_page?: number
          notify_on_import_complete?: boolean
          notify_on_enrichment_complete?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_accounts: {
        Row: {
          id: string
          user_id: string
          account_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          role?: string
          created_at?: string
        }
      }
      user_api_keys: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          provider: string
          encrypted_key: string
          encryption_iv: string
          key_hint: string
          is_valid: boolean
          last_validated_at: string | null
          last_used_at: string | null
          usage_count: number
          scopes: string[]
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          account_id?: string | null
          provider: string
          encrypted_key: string
          encryption_iv: string
          key_hint: string
          is_valid?: boolean
          last_validated_at?: string | null
          last_used_at?: string | null
          usage_count?: number
          scopes?: string[]
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string | null
          provider?: string
          encrypted_key?: string
          encryption_iv?: string
          key_hint?: string
          is_valid?: boolean
          last_validated_at?: string | null
          last_used_at?: string | null
          usage_count?: number
          scopes?: string[]
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
    Functions: {
      get_user_account_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_lead_stats: {
        Args: { p_account_id: string }
        Returns: {
          total_leads: number
          enriched_leads: number
          pending_leads: number
          failed_leads: number
          enrichment_rate: number
        }[]
      }
      bulk_update_lead_status: {
        Args: {
          p_lead_ids: string[]
          p_status: string
          p_updated_by: string
        }
        Returns: number
      }
    }
  }
}

// Convenience types
export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']

export type EnrichmentJob = Database['public']['Tables']['enrichment_jobs']['Row']
export type ImportBatch = Database['public']['Tables']['import_batches']['Row']
export type UserPreferences = Database['public']['Tables']['leadgen_user_preferences']['Row']
export type Account = Database['public']['Tables']['accounts']['Row']
export type UserAccount = Database['public']['Tables']['user_accounts']['Row']
export type UserApiKey = Database['public']['Tables']['user_api_keys']['Row']
