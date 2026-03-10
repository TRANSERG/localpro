import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateBusinessInfo } from '@/lib/gmb'

// GET ?clientId=... — return cached business info from DB
export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId')
    if (!clientId) return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })

    const supabase = await createClient()
    const { data } = await supabase
      .from('gmb_business_info')
      .select('*')
      .eq('client_id', clientId)
      .single()

    return NextResponse.json({ ok: true, data: data ?? null })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

// PATCH { clientId, title?, description?, primary_phone?, website_uri? }
export async function PATCH(req: NextRequest) {
  try {
    const { clientId, ...updates } = await req.json() as {
      clientId?: string
      title?: string
      description?: string
      primary_phone?: string
      website_uri?: string
    }
    if (!clientId) return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })

    await updateBusinessInfo(clientId, updates)
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
