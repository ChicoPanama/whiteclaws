import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
// Force dynamic rendering for API route
export const dynamic = 'force-dynamic';

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    if (!hasSupabaseConfig) {
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
    }

    const supabase = createClient();

    if (slug) {
      const { data, error } = await supabase
        .from("protocols")
        .select(
          "id,name,slug,description,immunefi_url,logo_url,chains,max_bounty,tvl,is_active,created_at,updated_at"
        )
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return NextResponse.json(
          { error: "Protocol not found" },
          { status: 404 }
        );
      }

      const protocol = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        website_url: data.immunefi_url,
        twitter_handle: null,
        logo_url: data.logo_url,
        category: null,
        chain: data.chains?.[0] ?? null,
        bountyPool: data.max_bounty ?? 0,
        severity: null,
        is_active: data.is_active,
        submission_count: 0,
        total_rewards_distributed: 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return NextResponse.json({ protocol });
    }

    const { data, error } = await supabase
      .from("protocols")
      .select(
        "id,name,slug,description,immunefi_url,logo_url,chains,max_bounty,tvl,is_active,created_at,updated_at"
      )
      .order("name");

    if (error) {
      throw error;
    }

    const protocols = (data ?? []).map((protocol) => ({
      id: protocol.id,
      name: protocol.name,
      slug: protocol.slug,
      description: protocol.description,
      website_url: protocol.immunefi_url,
      twitter_handle: null,
      logo_url: protocol.logo_url,
      category: null,
      chain: protocol.chains?.[0] ?? null,
      bountyPool: protocol.max_bounty ?? 0,
      severity: null,
      is_active: protocol.is_active,
      submission_count: 0,
      total_rewards_distributed: 0,
      created_at: protocol.created_at,
      updated_at: protocol.updated_at,
    }));

    return NextResponse.json({ protocols });
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

    if (!hasSupabaseConfig) {
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
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("protocols")
      .insert({
        name: validated.name,
        slug: validated.slug,
        description: validated.description ?? null,
        immunefi_url: validated.website_url ?? null,
        logo_url: validated.logo_url ?? null,
        chains: validated.chain ? [validated.chain] : [],
        max_bounty: validated.bountyPool ?? 0,
        is_active: true,
      })
      .select(
        "id,name,slug,description,immunefi_url,logo_url,chains,max_bounty,tvl,is_active,created_at,updated_at"
      )
      .single();

    if (error) {
      throw error;
    }

    const protocol = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      website_url: data.immunefi_url,
      twitter_handle: null,
      logo_url: data.logo_url,
      category: null,
      chain: data.chains?.[0] ?? null,
      bountyPool: data.max_bounty ?? 0,
      severity: null,
      is_active: data.is_active,
      submission_count: 0,
      total_rewards_distributed: 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json({ protocol }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
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
