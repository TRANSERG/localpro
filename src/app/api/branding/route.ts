import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST { client_id, ...fields } — create branding profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { client_id, ...fields } = body
    if (!client_id) {
      return NextResponse.json({ ok: false, error: 'client_id is required' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('branding_profiles')
      .insert({ client_id, ...fields })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

// PUT { id, ...fields } — update branding profile
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...fields } = body
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('branding_profiles')
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

// DELETE ?id=... — delete branding profile
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 })
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from('branding_profiles')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
