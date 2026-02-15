import { NextResponse } from 'next/server'
import { getAuditsByProtocolSlug } from '@/lib/data/audits'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const audits = getAuditsByProtocolSlug(params.slug)
  return NextResponse.json({ audits, count: audits.length })
}
