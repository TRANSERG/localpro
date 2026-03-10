import { NextRequest, NextResponse } from 'next/server'
import { syncReviews } from '@/lib/gmb'

// POST { clientId } — sync reviews from Google into Supabase
export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json() as { clientId?: string }
    if (!clientId) return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })

    const count = await syncReviews(clientId)
    return NextResponse.json({ ok: true, synced: count })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isNotConnected = msg.includes('not connected') || msg.includes('must re-authorize')
    return NextResponse.json(
      { ok: false, error: msg, ...(isNotConnected ? { code: 'NOT_CONNECTED' } : {}) },
      { status: isNotConnected ? 401 : 500 },
    )
  }
}
