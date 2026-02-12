/**
 * Supabase Database Types — derived from migrations 0001-006.
 * All 19 tables with Row, Insert, Update, and Relationships.
 *
 * To regenerate from live DB:
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
          reputation_score: number | null
          specialties: string[] | null
          wallet_address: string | null
          public_key: string | null
          created_at: string
          updated_at: string
          api_key_hash: string | null
          api_key_prefix: string | null
          status: string
          bio: string | null
          website: string | null
          twitter: string | null
          payout_wallet: string | null
          kyc_status: string | null
          kyc_verified_at: string | null
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'agent_rankings_agent_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'agent_rankings'
            referencedColumns: ['agent_id']
          },
        ]
      }
      protocols: {
        Row: {
          id: string
          name: string
          slug: string
          immunefi_url: string | null
          chains: string[] | null
          max_bounty: number | null
          tvl: number | null
          logo_url: string | null
          description: string | null
          contracts: Json | null
          is_active: boolean
          created_at: string
          updated_at: string | null
          public_key: string | null
          min_bounty: number | null
          severity_payouts: Json | null
          kyc_required: boolean
          scope_details: Json | null
          contracts_detailed: Json | null
          assets: Json | null
          known_issues: string | null
          program_rules: string | null
          documentation_urls: string[] | null
          languages: string[] | null
          audit_history: Json | null
          previous_hacks: Json | null
          launch_date: string | null
          tvl_verified: boolean
          last_synced_at: string | null
          category: string | null
          website_url: string | null
          github_url: string | null
          docs_url: string | null
          contact_email: string | null
          owner_id: string | null
          verified: boolean
          claimed: boolean
          claimed_at: string | null
          immunefi_slug: string | null
          immunefi_url: string | null
          security_email: string | null
          github_org: string | null
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      findings: {
        Row: {
          id: string
          protocol_id: string | null
          researcher_id: string
          title: string
          severity: string
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
          agent_id: string | null
          program_id: string | null
          scope_version: number | null
          duplicate_of: string | null
          triage_notes: string | null
          triaged_at: string | null
          triaged_by: string | null
          rejected_at: string | null
          rejection_reason: string | null
          payout_amount: number | null
          payout_tx_hash: string | null
          payout_currency: string | null
          poc_url: string | null
          encrypted_report: Json | null
          description: string | null
          quality_score: number | null
          similarity_hash: string | null
          submission_source: string
          immunefi_routed: boolean
          immunefi_routed_at: string | null
          notification_sent: boolean
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'findings_protocol_id_fkey'
            columns: ['protocol_id']
            isOneToOne: false
            referencedRelation: 'protocols'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'findings_researcher_id_fkey'
            columns: ['researcher_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
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
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          type: string | null
          url: string | null
          file_path: string | null
          author_id: string | null
          downloads: number
          upvotes: number
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
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
          specialties: string[] | null
          last_activity_at: string | null
          updated_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'agent_rankings_agent_id_fkey'
            columns: ['agent_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
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
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'protocol_members_protocol_id_fkey'
            columns: ['protocol_id']
            isOneToOne: false
            referencedRelation: 'protocols'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'protocol_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
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
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'finding_comments_finding_id_fkey'
            columns: ['finding_id']
            isOneToOne: false
            referencedRelation: 'findings'
            referencedColumns: ['id']
          },
        ]
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
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'api_keys_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      programs: {
        Row: {
          id: string
          protocol_id: string
          status: string
          scope_version: number
          duplicate_policy: string | null
          response_sla_hours: number | null
          poc_required: boolean
          kyc_required: boolean
          payout_currency: string
          min_payout: number
          max_payout: number
          encryption_public_key: string | null
          payout_wallet: string | null
          exclusions: string[] | null
          cooldown_hours: number
          created_at: string
          updated_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'programs_protocol_id_fkey'
            columns: ['protocol_id']
            isOneToOne: false
            referencedRelation: 'protocols'
            referencedColumns: ['id']
          },
        ]
      }
      program_scopes: {
        Row: {
          id: string
          program_id: string
          version: number
          contracts: Json
          in_scope: string[] | null
          out_of_scope: string[] | null
          severity_definitions: Json | null
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'program_scopes_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
        ]
      }
      access_sbt: {
        Row: {
          id: string
          user_id: string
          wallet_address: string
          tx_hash: string | null
          mint_price: string
          payment_token: string
          minted_at: string
          token_id: number | null
          is_early: boolean
          status: string
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'access_sbt_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      participation_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          points: number
          metadata: Json
          wallet_address: string | null
          verified: boolean
          season: number
          week: number
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'participation_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      contribution_scores: {
        Row: {
          id: string
          user_id: string
          season: number
          security_points: number
          growth_points: number
          engagement_points: number
          social_points: number
          total_score: number
          rank: number | null
          streak_weeks: number
          last_active_at: string | null
          sybil_multiplier: number
          updated_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'contribution_scores_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      referral_links: {
        Row: {
          id: string
          referrer_id: string
          code: string
          wallet_address: string
          total_referred: number
          qualified_referred: number
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'referral_links_referrer_id_fkey'
            columns: ['referrer_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      referral_rewards: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          qualifying_action: string | null
          qualified_at: string | null
          referrer_bonus: number
          season: number
          status: string
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'referral_rewards_referrer_id_fkey'
            columns: ['referrer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'referral_rewards_referred_id_fkey'
            columns: ['referred_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      x_verifications: {
        Row: {
          id: string
          user_id: string
          user_type: string
          x_handle: string
          x_id: string
          tweet_id: string | null
          wallet_address: string
          verified_at: string | null
          tweet_checked_at: string | null
          status: string
          created_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: 'x_verifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      anti_sybil_flags: {
        Row: {
          id: string
          wallet_address: string
          risk_score: number
          flags: Json
          cluster_id: string | null
          reviewed: boolean
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      season_config: {
        Row: {
          id: string
          season: number
          start_date: string | null
          end_date: string | null
          pool_size: number | null
          status: string
          weekly_cap: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      participation_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          points: number
          metadata: Json
          wallet_address: string | null
          verified: boolean
          season: number
          week: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['participation_events']['Row']> & { user_id: string; event_type: string; season: number; week: number }
        Update: Partial<Database['public']['Tables']['participation_events']['Row']>
      }
      contribution_scores: {
        Row: {
          id: string
          user_id: string
          season: number
          security_points: number
          growth_points: number
          engagement_points: number
          social_points: number
          penalty_points: number
          total_score: number
          rank: number | null
          streak_weeks: number
          last_active_at: string | null
          sybil_multiplier: number
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['contribution_scores']['Row']> & { user_id: string; season: number }
        Update: Partial<Database['public']['Tables']['contribution_scores']['Row']>
      }
      spam_flags: {
        Row: {
          id: string
          user_id: string
          flag_type: string
          severity: string
          points_deducted: number
          metadata: Json
          finding_id: string | null
          reviewed: boolean
          reviewed_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['spam_flags']['Row']> & { user_id: string; flag_type: string }
        Update: Partial<Database['public']['Tables']['spam_flags']['Row']>
      }
      finding_notifications: {
        Row: {
          id: string
          finding_id: string | null
          protocol_id: string | null
          channel: string
          recipient: string
          sent_at: string
          status: string
          error: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['finding_notifications']['Row']> & { channel: string; recipient: string }
        Update: Partial<Database['public']['Tables']['finding_notifications']['Row']>
      }
      anti_sybil_flags: {
        Row: {
          id: string
          wallet_address: string
          risk_score: number
          flags: Json
          cluster_id: string | null
          reviewed: boolean
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['anti_sybil_flags']['Row']> & { wallet_address: string }
        Update: Partial<Database['public']['Tables']['anti_sybil_flags']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
