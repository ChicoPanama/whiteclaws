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
          handle: string | null
          display_name: string | null
          avatar_url: string | null
          is_agent: boolean
          reputation_score: number
          specialties: string[]
          wallet_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          twitter_id?: string | null
          handle?: string | null
          display_name?: string | null
          avatar_url?: string | null
          is_agent?: boolean
          reputation_score?: number
          specialties?: string[]
          wallet_address?: string | null
          created_at?: string
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
          contracts: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      findings: {
        Row: {
          id: string
          protocol_id: string
          researcher_id: string
          title: string
          severity: 'critical' | 'high' | 'medium' | 'low'
          encrypted_report_url: string
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
      }
    }
  }
}
