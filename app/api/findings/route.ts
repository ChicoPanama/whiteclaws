import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const hasSupabaseConfig =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const submissionSchema = z.object({
  protocolId: z.string().uuid(),
  title: z.string().min(1),
  severity: z.enum(["critical", "high", "medium", "low"]),
  encryptedPayload: z.object({
    ciphertext: z.string().min(1),
    nonce: z.string().min(1),
    senderPublicKey: z.string().min(1),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = submissionSchema.parse(body);

    if (!hasSupabaseConfig) {
      return NextResponse.json(
        { status: "queued", findingId: "demo" },
        { status: 201 }
      );
    }

    const supabase = createClient();
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const encryptedReport = JSON.stringify(validated.encryptedPayload);

    const { data, error } = await supabase
      .from("findings")
      .insert({
        protocol_id: validated.protocolId,
        researcher_id: sessionData.session.user.id,
        title: validated.title,
        severity: validated.severity,
        encrypted_report_url: encryptedReport,
        status: "submitted",
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { status: "queued", findingId: data.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating finding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
