/**
 * Supabase Database Types — auto-generated from live schema.
 * Fixes TypeScript 'never' type errors on all queries.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          handle: string | null
          display_name: string | null
          avatar_url: string | null
          wallet_address: string | null
          is_agent: boolean
          reputation_score: number | null
          specialties: string[] | null
          created_at: string
          updated_at: string
          bio: string | null
          website: string | null
          twitter: string | null
          status: string
          payout_wallet: string | null
          kyc_status: string
          kyc_verified_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['users']['Row']> & { handle?: string }
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
      agent_rankings: {
        Row: {
          id: string
          agent_id: string
          rank: number
          points: number
          total_submissions: number
          accepted_submissions: number
          total_bounty_amount: number
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['agent_rankings']['Row']> & { agent_id: string }
        Update: Partial<Database['public']['Tables']['agent_rankings']['Row']>
      }
      protocols: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          category: string | null
          chains: string[] | null
          max_bounty: number | null
          logo_url: string | null
          public_key: string | null
          created_at: string
          updated_at: string | null
          website_url: string | null
          github_url: string | null
          docs_url: string | null
          contact_email: string | null
          verified: boolean
          owner_id: string | null
        }
        Insert: Partial<Database['public']['Tables']['protocols']['Row']> & { slug: string; name: string }
        Update: Partial<Database['public']['Tables']['protocols']['Row']>
      }
      programs: {
        Row: {
          id: string
          protocol_id: string
          status: string
          scope_version: number
          duplicate_policy: string
          response_sla_hours: number
          poc_required: boolean
          kyc_required: boolean
          payout_currency: string
          min_payout: number
          max_payout: number
          encryption_public_key: string | null
          payout_wallet: string | null
          exclusions: string[]
          cooldown_hours: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['programs']['Row']> & { protocol_id: string }
        Update: Partial<Database['public']['Tables']['programs']['Row']>
      }
      program_scopes: {
        Row: {
          id: string
          program_id: string
          version: number
          contracts: Json
          in_scope: string[]
          out_of_scope: string[]
          severity_definitions: Json
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['program_scopes']['Row']> & { program_id: string; version: number }
        Update: Partial<Database['public']['Tables']['program_scopes']['Row']>
      }
      findings: {
        Row: {
          id: string
          protocol_id: string | null
          researcher_id: string
          title: string
          severity: string
          encrypted_report_url: string | null
          status: string
          created_at: string
          updated_at: string
          program_id: string | null
          scope_version: number | null
          duplicate_of: string | null
          triage_notes: string | null
          triaged_at: string | null
          triaged_by: string | null
          accepted_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          payout_amount: number | null
          payout_tx_hash: string | null
          payout_currency: string | null
          paid_at: string | null
          poc_url: string | null
          encrypted_report: Json | null
          description: string | null
        }
        Insert: Partial<Database['public']['Tables']['findings']['Row']> & { researcher_id: string; title: string; severity: string }
        Update: Partial<Database['public']['Tables']['findings']['Row']>
      }
      protocol_members: {
        Row: {
          id: string
          protocol_id: string
          user_id: string
          role: string
          invited_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['protocol_members']['Row']> & { protocol_id: string; user_id: string }
        Update: Partial<Database['public']['Tables']['protocol_members']['Row']>
      }
      finding_comments: {
        Row: {
          id: string
          finding_id: string
          user_id: string
          content: string
          is_internal: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['finding_comments']['Row']> & { finding_id: string; user_id: string; content: string }
        Update: Partial<Database['public']['Tables']['finding_comments']['Row']>
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          key_hash: string
          key_prefix: string
          name: string
          scopes: string[]
          rate_limit_per_hour: number
          last_used_at: string | null
          expires_at: string | null
          revoked_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['api_keys']['Row']> & { user_id: string; key_hash: string; key_prefix: string }
        Update: Partial<Database['public']['Tables']['api_keys']['Row']>
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          type: string | null
          url: string | null
          file_path: string | null
          downloads: number
          user_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['resources']['Row']> & { title: string }
        Update: Partial<Database['public']['Tables']['resources']['Row']>
      }
      messages: {
        Row: {
          id: string
          title: string | null
          content: string | null
          upvotes: number
          user_id: string | null
          parent_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['messages']['Row']>
        Update: Partial<Database['public']['Tables']['messages']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
