import { NextResponse } from 'next/server'
import { getAuditById } from '@/lib/data/audits'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const audit = getAuditById(params.id)
  if (!audit) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
  }
  return NextResponse.json(audit)
}
