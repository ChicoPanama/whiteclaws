/**
 * Supabase Database Types — auto-generated from live schema.
 * Clean merge: no duplicate table definitions, proper Insert/Update types.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

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
        Insert: Partial<Database['public']['Tables']['users']['Row']> & { handle?: string }
        Update: Partial<Database['public']['Tables']['users']['Row']>
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
        Insert: Partial<Database['public']['Tables']['agent_rankings']['Row']> & { agent_id: string }
        Update: Partial<Database['public']['Tables']['agent_rankings']['Row']>
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
          security_email: string | null
          github_org: string | null
          twitter: string | null
          discord: string | null
          telegram: string | null
          legal_email: string | null
          whitepaper_url: string | null
          bounty_policy_url: string | null
          developer_docs_url: string | null
          status_page_url: string | null
          reddit_url: string | null
          blog_url: string | null
          coingecko_id: string | null
          market_cap_rank: number | null
          auditors: Json | null
          audit_report_urls: Json | null
        }
        Insert: Partial<Database['public']['Tables']['protocols']['Row']> & { slug: string; name: string }
        Update: Partial<Database['public']['Tables']['protocols']['Row']>
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
          quality_score: number | null
          similarity_hash: string | null
          submission_source: string
          immunefi_routed: boolean
          immunefi_routed_at: string | null
          notification_sent: boolean
        }
        Insert: Partial<Database['public']['Tables']['findings']['Row']> & { researcher_id: string; title: string; severity: string }
        Update: Partial<Database['public']['Tables']['findings']['Row']>
        Relationships: [
          {
            foreignKeyName: "findings_protocol_id_fkey",
            columns: ["protocol_id"],
            referencedRelation: "protocols",
            referencedColumns: ["id"],
            isOneToOne: false
          },
          {
            foreignKeyName: "findings_researcher_id_fkey",
            columns: ["researcher_id"],
            referencedRelation: "users",
            referencedColumns: ["id"],
            isOneToOne: false
          },
          {
            foreignKeyName: "findings_program_id_fkey",
            columns: ["program_id"],
            referencedRelation: "programs",
            referencedColumns: ["id"],
            isOneToOne: false
          }
        ]
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
          downloads: number
          user_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['resources']['Row']> & { title: string }
        Update: Partial<Database['public']['Tables']['resources']['Row']>
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "finding_comments_finding_id_fkey",
            columns: ["finding_id"],
            referencedRelation: "findings",
            referencedColumns: ["id"],
            isOneToOne: false
          },
          {
            foreignKeyName: "finding_comments_user_id_fkey",
            columns: ["user_id"],
            referencedRelation: "users",
            referencedColumns: ["id"],
            isOneToOne: false
          }
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
        Insert: Partial<Database['public']['Tables']['api_keys']['Row']> & { user_id: string; key_hash: string; key_prefix: string }
        Update: Partial<Database['public']['Tables']['api_keys']['Row']>
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Insert: Partial<Database['public']['Tables']['access_sbt']['Row']> & { user_id: string; wallet_address: string }
        Update: Partial<Database['public']['Tables']['access_sbt']['Row']>
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
        Insert: Partial<Database['public']['Tables']['participation_events']['Row']> & { user_id: string; event_type: string; season: number; week: number }
        Update: Partial<Database['public']['Tables']['participation_events']['Row']>
        Relationships: []
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
        Relationships: []
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
        Insert: Partial<Database['public']['Tables']['referral_links']['Row']> & { referrer_id: string; code: string; wallet_address: string }
        Update: Partial<Database['public']['Tables']['referral_links']['Row']>
        Relationships: []
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
        Insert: Partial<Database['public']['Tables']['referral_rewards']['Row']> & { referrer_id: string; referred_id: string; season: number }
        Update: Partial<Database['public']['Tables']['referral_rewards']['Row']>
        Relationships: []
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
        Insert: Partial<Database['public']['Tables']['x_verifications']['Row']> & { user_id: string; x_handle: string; x_id: string; wallet_address: string }
        Update: Partial<Database['public']['Tables']['x_verifications']['Row']>
        Relationships: []
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
        Insert: Partial<Database['public']['Tables']['season_config']['Row']> & { season: number }
        Update: Partial<Database['public']['Tables']['season_config']['Row']>
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
