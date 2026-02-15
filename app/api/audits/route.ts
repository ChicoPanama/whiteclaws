import { NextRequest, NextResponse } from 'next/server'
import { auditCatalog, getAuditFilters } from '@/lib/data/audits'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const chain = params.get('chain')
  const primitive = params.get('primitive')
  const auditor = params.get('auditor')
  const category = params.get('category')
  const q = params.get('q')?.toLowerCase()
  const limit = Math.min(parseInt(params.get('limit') || '100', 10), 200)
  const offset = parseInt(params.get('offset') || '0', 10)

  let audits = [...auditCatalog]

  if (chain) {
    audits = audits.filter(a => a.chains.some(c => c.toLowerCase() === chain.toLowerCase()))
  }
  if (primitive) {
    audits = audits.filter(a => a.primitive.toLowerCase() === primitive.toLowerCase())
  }
  if (auditor) {
    audits = audits.filter(a => a.auditor.toLowerCase() === auditor.toLowerCase())
  }
  if (category) {
    audits = audits.filter(a => a.category.toLowerCase() === category.toLowerCase())
  }
  if (q) {
    audits = audits.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.protocol.toLowerCase().includes(q) ||
      a.auditor.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.primitive.toLowerCase().includes(q)
    )
  }

  const total = audits.length
  const paged = audits.slice(offset, offset + limit)

  return NextResponse.json({
    audits: paged,
    total,
    filters: getAuditFilters(),
  })
}
