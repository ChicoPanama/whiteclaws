import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/admin";
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const category = searchParams.get("category");

  try {
    const supabase = createClient();

    if (slug) {
      const { data, error } = await supabase
        .from("protocols")
        .select("id,name,slug,description,website_url,logo_url,chains,max_bounty,category,verified,created_at,updated_at")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return NextResponse.json({ error: "Protocol not found" }, { status: 404 });
      }
      return NextResponse.json({ protocol: data });
    }

    let query = supabase
      .from("protocols")
      .select("id,name,slug,description,website_url,logo_url,chains,max_bounty,category,verified,created_at", { count: "exact" })
      .order("name")
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      protocols: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching protocols:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, website_url, logo_url, category, chains } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug required" }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("protocols")
      .insert({
        name,
        slug,
        description: description ?? null,
        website_url: website_url ?? null,
        logo_url: logo_url ?? null,
        category: category ?? null,
        chains: chains ?? [],
        max_bounty: 0,
      })
      .select("id,name,slug")
      .single();

    if (error) throw error;
    return NextResponse.json({ protocol: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating protocol:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
