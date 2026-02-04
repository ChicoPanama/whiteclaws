import { NextRequest, NextResponse } from "next/server";

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
    // In production, fetch from database with proper sorting
    const leaderboard = mockLeaderboard.slice(0, limit);

    return NextResponse.json({
      leaderboard,
      period,
      total: mockLeaderboard.length,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
