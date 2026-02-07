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
      users: {
        Row: {
          id: string
          twitter_id: string | null
          privy_did: string | null
          handle: string | null
          display_name: string | null
          avatar_url: string | null
          is_agent: boolean
          reputation_score: number
          specialties: string[]
          wallet_address: string | null
          public_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          twitter_id?: string | null
          privy_did?: string | null
          handle?: string | null
          display_name?: string | null
          avatar_url?: string | null
          is_agent?: boolean
          reputation_score?: number
          specialties?: string[]
          wallet_address?: string | null
          public_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          twitter_id?: string | null
          privy_did?: string | null
          handle?: string | null
          display_name?: string | null
          avatar_url?: string | null
          is_agent?: boolean
          reputation_score?: number
          specialties?: string[]
          wallet_address?: string | null
          public_key?: string | null
          updated_at?: string
        }
      }
      protocols: {
        Row: {
          id: string
          name: string
          slug: string
          immunefi_url: string | null
          chains: string[]
          max_bounty: number | null
          tvl: number | null
          logo_url: string | null
          description: string | null
          contracts: Json | null
          public_key: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          immunefi_url?: string | null
          chains?: string[]
          max_bounty?: number | null
          tvl?: number | null
          logo_url?: string | null
          description?: string | null
          contracts?: Json | null
          public_key?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          immunefi_url?: string | null
          chains?: string[]
          max_bounty?: number | null
          tvl?: number | null
          logo_url?: string | null
          description?: string | null
          contracts?: Json | null
          public_key?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      findings: {
        Row: {
          id: string
          protocol_id: string
          researcher_id: string
          title: string
          severity: 'critical' | 'high' | 'medium' | 'low'
          encrypted_report_url: string | null
          encrypted_poc_url: string | null
          is_public: boolean
          status: string
          bounty_amount: number | null
          claimed_at: string | null
          accepted_at: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          protocol_id: string
          researcher_id: string
          title: string
          severity: 'critical' | 'high' | 'medium' | 'low'
          encrypted_report_url?: string | null
          encrypted_poc_url?: string | null
          is_public?: boolean
          status?: string
          bounty_amount?: number | null
          claimed_at?: string | null
          accepted_at?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          severity?: 'critical' | 'high' | 'medium' | 'low'
          encrypted_report_url?: string | null
          encrypted_poc_url?: string | null
          is_public?: boolean
          status?: string
          bounty_amount?: number | null
          claimed_at?: string | null
          accepted_at?: string | null
          paid_at?: string | null
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          protocol_id: string | null
          author_id: string | null
          parent_id: string | null
          title: string | null
          content: string
          is_pinned: boolean
          upvotes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          protocol_id?: string | null
          author_id?: string | null
          parent_id?: string | null
          title?: string | null
          content: string
          is_pinned?: boolean
          upvotes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          protocol_id?: string | null
          author_id?: string | null
          parent_id?: string | null
          title?: string | null
          content?: string
          is_pinned?: boolean
          upvotes?: number
          updated_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          type: 'pdf' | 'article' | 'video' | 'tool' | 'course' | null
          url: string | null
          file_path: string | null
          author_id: string | null
          downloads: number
          upvotes: number
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type?: 'pdf' | 'article' | 'video' | 'tool' | 'course' | null
          url?: string | null
          file_path?: string | null
          author_id?: string | null
          downloads?: number
          upvotes?: number
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          type?: 'pdf' | 'article' | 'video' | 'tool' | 'course' | null
          url?: string | null
          file_path?: string | null
          author_id?: string | null
          downloads?: number
          upvotes?: number
          tags?: string[]
          updated_at?: string
        }
      }
      protocol_access: {
        Row: {
          protocol_id: string
          user_id: string
          access_level: 'admin' | 'researcher' | 'viewer'
          granted_at: string
        }
        Insert: {
          protocol_id: string
          user_id: string
          access_level: 'admin' | 'researcher' | 'viewer'
          granted_at?: string
        }
        Update: {
          access_level?: 'admin' | 'researcher' | 'viewer'
          granted_at?: string
        }
      }
      agent_rankings: {
        Row: {
          agent_id: string
          points: number
          rank: number | null
          streak_days: number
          total_submissions: number
          accepted_submissions: number
          total_bounty_amount: number
          specialties: string[]
          last_activity_at: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          points?: number
          rank?: number | null
          streak_days?: number
          total_submissions?: number
          accepted_submissions?: number
          total_bounty_amount?: number
          specialties?: string[]
          last_activity_at?: string
          updated_at?: string
        }
        Update: {
          points?: number
          rank?: number | null
          streak_days?: number
          total_submissions?: number
          accepted_submissions?: number
          total_bounty_amount?: number
          specialties?: string[]
          last_activity_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
  }
}
