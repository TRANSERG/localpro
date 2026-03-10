import { NextRequest, NextResponse } from 'next/server'
import { replyToReview } from '@/lib/gmb'

// PUT { clientId, reviewId, reply } — post reply to a GMB review
export async function PUT(req: NextRequest) {
  try {
    const { clientId, reviewId, reply } = await req.json() as {
      clientId?: string
      reviewId?: string
      reply?: string
    }
    if (!clientId || !reviewId || !reply?.trim()) {
      return NextResponse.json({ ok: false, error: 'clientId, reviewId and reply are required' }, { status: 400 })
    }

    await replyToReview(clientId, reviewId, reply.trim())
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isNotConnected = msg.includes('not connected') || msg.includes('must re-authorize')
    return NextResponse.json(
      { ok: false, error: msg, ...(isNotConnected ? { code: 'NOT_CONNECTED' } : {}) },
      { status: isNotConnected ? 401 : 500 },
    )
  }
}
