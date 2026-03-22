import { NextRequest, NextResponse } from 'next/server'
import { recordEvent } from '@/lib/review-analytics'

export async function POST(req: NextRequest) {
  try {
    const { clientId, event, rating } = await req.json()
    if (!clientId || typeof clientId !== 'string' || clientId.length > 100) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    if (!['visit', 'rating', 'complete'].includes(event)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }
    await recordEvent(clientId, event, rating)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
