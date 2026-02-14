import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
export const dynamic = 'force-dynamic';

const protocolCreateSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/i, "slug must be alphanumeric with hyphens only"),
  description: z.string().max(10_000).optional().nullable(),
  website_url: z.string().url().optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  chains: z.array(z.string().max(40)).optional().nullable(),
});

async function requireAuthenticatedSession(): Promise<
  { ok: true; userId: string } | { ok: false; res: NextResponse }
> {
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user?.id) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, userId: data.session.user.id };
}

function requireAdminKey(req: NextRequest): { ok: true } | { ok: false; res: NextResponse } {
  const adminKey = process.env.ADMIN_API_KEY;
  const authHeader = req.headers.get("authorization");
  if (!adminKey) {
    // Fail closed: if admin key isn't configured, do not allow creates.
    return {
      ok: false,
      res: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  if (authHeader !== `Bearer ${adminKey}`) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true };
}

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
        .select("id,name,slug,description,website_url,logo_url,chains,max_bounty,category,verified,created_at,updated_at,twitter,discord,telegram,github_url,github_org,docs_url,security_email,contact_email,legal_email,bounty_policy_url,auditors,audit_report_urls,whitepaper_url,developer_docs_url,status_page_url,reddit_url,blog_url,coingecko_id,market_cap_rank,immunefi_url")
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
      .select("id,name,slug,description,website_url,logo_url,chains,max_bounty,category,verified,created_at,twitter,discord,telegram,github_url,docs_url,security_email,contact_email,auditors,bounty_policy_url,coingecko_id,market_cap_rank,immunefi_url", { count: "exact" })
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
    const session = await requireAuthenticatedSession();
    if (!session.ok) return session.res;

    const admin = requireAdminKey(request);
    if (!admin.ok) return admin.res;

    const body = await request.json().catch(() => ({}));
    const parsed = protocolCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, slug, description, website_url, logo_url, category, chains } = parsed.data;

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
