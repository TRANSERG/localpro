import { NextRequest, NextResponse } from 'next/server'
import { resolveGemInstructions, saveLocalGemInstructions } from '@/lib/gem-config-loader'

// GET — Load gem instructions for a client (fallback chain: local → hardcoded → empty)
export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId')
    if (!clientId) {
      return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })
    }

    // Fetch business_name + gem_instructions from Supabase
    let businessName: string | undefined
    let supabaseGemInstructions = ''
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const [{ data: client }, { data: branding }] = await Promise.all([
        supabase.from('clients').select('business_name').eq('id', clientId).single(),
        supabase.from('branding_profiles').select('gem_instructions').eq('client_id', clientId).single(),
      ])
      businessName = client?.business_name
      supabaseGemInstructions = (branding?.gem_instructions as string) ?? ''
    } catch {
      // Supabase unavailable — will skip hardcoded and Supabase fallbacks
    }

    const result = await resolveGemInstructions(clientId, businessName)
    if (!result.instructions && supabaseGemInstructions) {
      return NextResponse.json({ ok: true, instructions: supabaseGemInstructions, source: 'hardcoded' })
    }
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[GemConfig] GET error:', err)
    return NextResponse.json({ ok: true, instructions: '', source: 'empty' })
  }
}

// PUT — Save gem instructions for a client to local file
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, instructions } = body

    if (!clientId) {
      return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })
    }
    if (typeof instructions !== 'string') {
      return NextResponse.json({ ok: false, error: 'instructions must be a string' }, { status: 400 })
    }

    await saveLocalGemInstructions(clientId, instructions)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[GemConfig] Save error:', err)
    return NextResponse.json({ ok: false, error: 'Save failed' }, { status: 500 })
  }
}
