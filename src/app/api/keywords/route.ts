import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { keywords } = await req.json()

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ ok: false, error: 'keywords array is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const rows = keywords.map((k: {
      client_id: string
      keyword: string
      keyword_type: string
      monthly_search_volume: number
      competition: string
      priority: string
    }) => ({
      client_id: k.client_id,
      keyword: k.keyword,
      keyword_type: k.keyword_type,
      monthly_search_volume: k.monthly_search_volume,
      competition: k.competition,
      priority: k.priority,
      used_in_gbp: false,
      used_on_website: false,
      is_selected: false,
    }))

    const { data, error } = await supabase
      .from('keywords')
      .insert(rows)
      .select()

    if (error) {
      console.error('Insert keywords error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, keywords: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
