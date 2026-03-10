import { NextRequest, NextResponse } from 'next/server'
import { deletePost } from '@/lib/gmb'

// DELETE /api/gmb/posts/[id]?clientId=...
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const clientId = req.nextUrl.searchParams.get('clientId')
    if (!clientId) return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })

    await deletePost(clientId, id)
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
