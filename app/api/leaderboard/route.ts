import { NextResponse } from 'next/server';
import { leaderboard } from '@/lib/data/constants';

export async function GET() {
  try {
    // TODO: Replace with actual database query in later phases
    // This returns mock data from constants.ts
    return NextResponse.json({
      success: true,
      data: {
        entries: leaderboard,
        metadata: {
          totalBounties: leaderboard.length,
          totalEarned: '$8.4M+',
          activeResearchers: 1247,
          season: 'S1 2026'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leaderboard data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
