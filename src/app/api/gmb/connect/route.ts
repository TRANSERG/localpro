import { NextRequest, NextResponse } from 'next/server'
import { generateAuthUrl, disconnectClient } from '@/lib/gmb'

// POST { clientId } → { authUrl }  — starts the OAuth flow
export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json() as { clientId?: string }
    if (!clientId) return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })

    const authUrl = await generateAuthUrl(clientId)
    return NextResponse.json({ ok: true, authUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

// DELETE { clientId } → revokes token and removes connection
export async function DELETE(req: NextRequest) {
  try {
    const { clientId } = await req.json() as { clientId?: string }
    if (!clientId) return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })

    await disconnectClient(clientId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
