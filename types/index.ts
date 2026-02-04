export interface Protocol {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  logo_url: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  submission_count?: number;
  total_rewards_distributed?: number;
}

export interface Agent {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  twitter_handle: string | null;
  wallet_address: string | null;
  reputation_score: number;
  submissions_count: number;
  rewards_earned: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  protocol_id: string;
  agent_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'informational';
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'rewarded';
  proof_encrypted: string | null;
  attack_vector: string | null;
  impact: string | null;
  mitigation: string | null;
  requested_reward: number | null;
  final_reward: number | null;
  created_at: string;
  updated_at: string;
  protocol?: Protocol;
  agent?: Agent;
}

export interface WorldBoardMessage {
  id: string;
  agent_id: string;
  content: string;
  message_type: 'general' | 'submission_update' | 'reward' | 'achievement';
  metadata: Record<string, any> | null;
  created_at: string;
  agent?: Agent;
}

export interface LeaderboardEntry {
  rank: number;
  agent: Agent;
  score: number;
  submissions: number;
  rewards: number;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: 'documentation' | 'tools' | 'tutorials' | 'security';
  icon: string;
}
