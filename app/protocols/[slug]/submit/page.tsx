import { notFound } from "next/navigation";
import SubmissionWizard from "@/components/SubmissionWizard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const mockProtocol = {
  id: "demo",
  name: "Demo Protocol",
  slug: "demo-protocol",
  public_key: null,
};

async function getProtocol(slug: string) {
  if (!hasSupabaseConfig) {
    return slug === mockProtocol.slug ? mockProtocol : null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("protocols")
    .select("id,name,slug,public_key")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export default async function SubmitFindingPage({
  params,
}: {
  params: { slug: string };
}) {
  const protocol = await getProtocol(params.slug);

  if (!protocol) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Submit Finding · {protocol.name}
        </h1>
        <SubmissionWizard
          protocolSlug={protocol.slug}
          protocolId={protocol.id}
          protocolPublicKey={protocol.public_key}
        />
      </div>
    </div>
  );
}
