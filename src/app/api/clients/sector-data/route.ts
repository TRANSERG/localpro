import { NextRequest, NextResponse } from 'next/server'
import { readSectorData, writeSectorData } from '@/lib/client-sector-data'
import type { SectorData } from '@/lib/client-sector-data'

const ALLOWED_SECTOR_TYPES = ['restaurant', 'salon', 'clinic', 'fitness', 'retail', 'generic']

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId || clientId.length > 100) return NextResponse.json({ ok: false }, { status: 400 })
  const data = await readSectorData(clientId)
  return NextResponse.json({ ok: true, data })
}

export async function POST(req: NextRequest) {
  try {
    const body: SectorData = await req.json()
    if (!body.clientId || typeof body.clientId !== 'string' || body.clientId.length > 100) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    if (body.sectorType && !ALLOWED_SECTOR_TYPES.includes(body.sectorType)) {
      return NextResponse.json({ ok: false, error: 'Invalid sectorType' }, { status: 400 })
    }
    await writeSectorData(body)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
