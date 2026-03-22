import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { client_id, ideas, ...singleFields } = body

    if (!client_id) {
      return NextResponse.json({ ok: false, error: 'client_id is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Batch insert (from AI generation) or single insert
    if (Array.isArray(ideas) && ideas.length > 0) {
      const rows = ideas.map((idea: Record<string, unknown>) => ({ client_id, ...idea }))
      const { data, error } = await supabase
        .from('content_ideas')
        .insert(rows)
        .select()
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true, data })
    }

    const { data, error } = await supabase
      .from('content_ideas')
      .insert({ client_id, ...singleFields })
      .select()
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
      .from('content_ideas')
      .update(fields)
      .eq('id', id)
      .select()
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
    const { error } = await supabase.from('content_ideas').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}