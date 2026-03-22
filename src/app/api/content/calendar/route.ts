import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { client_id, entries, ...fields } = body
    if (!client_id) {
      return NextResponse.json({ ok: false, error: 'client_id is required' }, { status: 400 })
    }
    const supabase = await createClient()

    // Batch insert (from month plan generation)
    if (Array.isArray(entries) && entries.length > 0) {
      const rows = entries.map((e: Record<string, unknown>) => ({ client_id, ...e }))
      const { data, error } = await supabase
        .from('content_calendar')
        .insert(rows)
        .select('*, idea:content_ideas(*)')
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true, data })
    }

    // Single insert
    const { data, error } = await supabase
      .from('content_calendar')
      .insert({ client_id, ...fields })
      .select('*, idea:content_ideas(*)')
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...fields } = body
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('content_calendar')
      .update(fields)
      .eq('id', id)
      .select('*, idea:content_ideas(*)')
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
    }
    const supabase = await createClient()
    const { error } = await supabase.from('content_calendar').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}