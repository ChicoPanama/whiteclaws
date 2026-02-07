import { createClient } from "@supabase/supabase-js";

const apiUrl =
  process.env.IMMUNEFI_API_URL ?? "https://immunefi.com/api/bug-bounty-programs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing SUPABASE env vars for sync.");
}

const supabase = createClient(supabaseUrl, serviceKey);

async function fetchPrograms() {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Immunefi fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  return payload?.data ?? payload?.programs ?? payload ?? [];
}

async function sync() {
  const programs = await fetchPrograms();

  const rows = programs.map((program) => ({
    name: program.name,
    slug: program.slug,
    description: program.description ?? null,
    immunefi_url: program.url ?? null,
    chains: program.chains ?? [],
    max_bounty: program.max_bounty ?? null,
    tvl: program.tvl ?? null,
    logo_url: program.logo ?? null,
    is_active: true,
  }));

  if (rows.length === 0) {
    console.log("No programs found to sync.");
    return;
  }

  const { error } = await supabase.from("protocols").upsert(rows, {
    onConflict: "slug",
  });

  if (error) {
    throw error;
  }

  console.log(`Synced ${rows.length} protocols from Immunefi.`);
}

sync().catch((error) => {
  console.error(error);
  process.exit(1);
});
