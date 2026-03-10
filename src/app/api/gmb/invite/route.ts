import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'

/** Anon client — for public token validation (no auth required) */
function getAnonClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/** POST { clientId } — agency creates (or re-uses) a shareable invite link.
 *  Uses the authenticated server client — no service role key required. */
export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json() as { clientId?: string }
    if (!clientId) return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })

    // Use the regular server client — the agency owner is authenticated
    const supabase = await createServerClient()

    // Re-use a valid (unused, non-expired) invite if one already exists
    const { data: existing } = await supabase
      .from('gmb_connect_invites')
      .select('token, expires_at')
      .eq('client_id', clientId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let token: string

    if (existing?.token) {
      token = existing.token
    } else {
      const { data: newRow, error } = await supabase
        .from('gmb_connect_invites')
        .insert({ client_id: clientId })
        .select('token')
        .single()
      if (error || !newRow) throw new Error(error?.message ?? 'Failed to create invite')
      token = newRow.token
    }

    const connectUrl = `${APP_URL}/connect/${token}`
    return NextResponse.json({ ok: true, url: connectUrl, token })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

/** GET ?token= — validate an invite and return public client info + authUrl.
 *  Uses the anon client so no service role key is required. */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ ok: false, error: 'token required' }, { status: 400 })

    const supabase = getAnonClient()

    const { data: invite } = await supabase
      .from('gmb_connect_invites')
      .select('client_id, used_at, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (!invite) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    if (invite.used_at) return NextResponse.json({ ok: false, error: 'already_used' }, { status: 410 })
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ ok: false, error: 'expired' }, { status: 410 })
    }

    // Fetch public-safe client fields
    const { data: client } = await supabase
      .from('clients')
      .select('id, business_name, city, color_tag')
      .eq('id', invite.client_id)
      .single()

    if (!client) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })

    // Build OAuth URL server-side (keeps GOOGLE_CLIENT_ID off the browser)
    const { generateAuthUrl } = await import('@/lib/gmb')
    const authUrl = await generateAuthUrl(invite.client_id, { magicToken: token })

    return NextResponse.json({
      ok: true,
      client: { id: client.id, business_name: client.business_name, city: client.city, color_tag: client.color_tag },
      authUrl,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
