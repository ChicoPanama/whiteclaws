import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const protocolSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  website_url: z.string().url().optional().nullable(),
  twitter_handle: z.string().optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  chain: z.string().optional().nullable(),
  bountyPool: z.number().default(0),
  severity: z.enum(["critical", "high", "medium", "low", "informational"]).optional(),
});

// Mock data - replace with database queries
const mockProtocols = [
  {
    id: "1",
    name: "SSV Network",
    slug: "ssv-network",
    description: "Distributed validator infrastructure for Ethereum",
    website_url: "https://ssv.network",
    twitter_handle: "ssv_network",
    logo_url: null,
    category: "Infrastructure",
    chain: "Ethereum",
    bountyPool: 1000000,
    severity: "critical",
    is_active: true,
    submission_count: 12,
    total_rewards_distributed: 50000,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: "2",
    name: "Uniswap",
    slug: "uniswap",
    description: "Decentralized exchange protocol",
    website_url: "https://uniswap.org",
    twitter_handle: "Uniswap",
    logo_url: null,
    category: "DeFi",
    chain: "Ethereum",
    bountyPool: 2500000,
    severity: "critical",
    is_active: true,
    submission_count: 45,
    total_rewards_distributed: 125000,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  try {
    if (slug) {
      const protocol = mockProtocols.find((p) => p.slug === slug);
      if (!protocol) {
        return NextResponse.json(
          { error: "Protocol not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ protocol });
    }

    return NextResponse.json({ protocols: mockProtocols });
  } catch (error) {
    console.error("Error fetching protocols:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = protocolSchema.parse(body);

    // In production, save to database
    const newProtocol = {
      id: String(mockProtocols.length + 1),
      ...validated,
      is_active: true,
      submission_count: 0,
      total_rewards_distributed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ protocol: newProtocol }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating protocol:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
