import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPost } from '@/lib/gmb'
import type { NewGmbPost } from '@/types'

// GET ?clientId=... — return cached posts from DB
export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId')
    if (!clientId) return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('gmb_posts')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, data: data ?? [] })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

// POST { clientId, ...post } — create a new post on GMB
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { clientId?: string } & Partial<NewGmbPost>
    const { clientId, ...postData } = body
    if (!clientId || !postData.topic_type || !postData.summary) {
      return NextResponse.json({ ok: false, error: 'clientId, topic_type and summary are required' }, { status: 400 })
    }

    const post = await createPost(clientId, postData as NewGmbPost)
    return NextResponse.json({ ok: true, data: post })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isNotConnected = msg.includes('not connected') || msg.includes('must re-authorize')
    return NextResponse.json(
      { ok: false, error: msg, ...(isNotConnected ? { code: 'NOT_CONNECTED' } : {}) },
      { status: isNotConnected ? 401 : 500 },
    )
  }
}
