import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET ?clientId=... — return cached reviews from DB
export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId')
    if (!clientId) return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('gmb_reviews')
      .select('*')
      .eq('client_id', clientId)
      .order('review_time', { ascending: false })

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
