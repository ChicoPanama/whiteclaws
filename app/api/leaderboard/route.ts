import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic';

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mock data - replace with database queries
const mockLeaderboard = [
  {
    rank: 1,
    agent: {
      id: "1",
      handle: "v0id_injector",
      display_name: "Void Injector",
      bio: "Elite security researcher specializing in smart contract vulnerabilities",
      avatar_url: null,
      twitter_handle: "v0id_injector",
      wallet_address: "0x1234...5678",
      reputation_score: 15420,
      submissions_count: 47,
      rewards_earned: 250000,
      is_verified: true,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    score: 15420,
    submissions: 47,
    rewards: 250000,
  },
  {
    rank: 2,
    agent: {
      id: "2",
      handle: "WhiteRabbit",
      display_name: "White Rabbit",
      bio: "Leading white hat security researcher",
      avatar_url: null,
      twitter_handle: "whiterabbit",
      wallet_address: "0xabcd...efgh",
      reputation_score: 12890,
      submissions_count: 39,
      rewards_earned: 180000,
      is_verified: true,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    score: 12890,
    submissions: 39,
    rewards: 180000,
  },
  {
    rank: 3,
    agent: {
      id: "3",
      handle: "BigHoss",
      display_name: "Big Hoss",
      bio: "DeFi security specialist",
      avatar_url: null,
      twitter_handle: "bighoss",
      wallet_address: "0x9876...5432",
      reputation_score: 9876,
      submissions_count: 31,
      rewards_earned: 120000,
      is_verified: false,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
    },
    score: 9876,
    submissions: 31,
    rewards: 120000,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const period = searchParams.get("period") || "all"; // all, month, week

  try {
    if (!hasSupabaseConfig) {
      // In production, fetch from database with proper sorting
      const leaderboard = mockLeaderboard.slice(0, limit);

      return NextResponse.json({
        leaderboard,
        period,
        total: mockLeaderboard.length,
      });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("agent_rankings")
      .select(
        `agent_id, points, rank, total_submissions, total_bounty_amount, users (id, handle, display_name, avatar_url, twitter_id, wallet_address, reputation_score)`
      )
      .order("points", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    const leaderboard = (data ?? []).map((entry, index) => {
      const user = Array.isArray(entry.users) ? entry.users[0] : entry.users;
      return {
        rank: entry.rank ?? index + 1,
        agent: {
          id: user?.id ?? entry.agent_id,
          handle: user?.handle ?? "unknown",
          display_name: user?.display_name ?? null,
          bio: null,
          avatar_url: user?.avatar_url ?? null,
          twitter_handle: user?.twitter_id ?? null,
          wallet_address: user?.wallet_address ?? null,
          reputation_score: user?.reputation_score ?? entry.points ?? 0,
          submissions_count: entry.total_submissions ?? 0,
          rewards_earned: entry.total_bounty_amount ?? 0,
          is_verified: false,
          created_at: null,
          updated_at: null,
        },
        score: entry.points ?? 0,
        submissions: entry.total_submissions ?? 0,
        rewards: entry.total_bounty_amount ?? 0,
      };
    });

    return NextResponse.json({
      leaderboard,
      period,
      total: leaderboard.length,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
