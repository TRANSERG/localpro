import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'reference-images'
const MAX_IMAGES = 5

// GET — list reference images for a client
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) {
    return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: files, error } = await supabase.storage
      .from(BUCKET)
      .list(clientId, { sortBy: { column: 'created_at', order: 'desc' } })

    if (error) throw new Error(error.message)

    const images = (files ?? [])
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
      .map(f => {
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(`${clientId}/${f.name}`)
        return { name: f.name, url: publicUrl }
      })

    return NextResponse.json({ ok: true, images })
  } catch (err) {
    console.error('[ReferenceImages] List error:', err)
    return NextResponse.json({ ok: true, images: [] })
  }
}

// POST — upload a reference image
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const clientId = formData.get('clientId') as string
    const file = formData.get('file') as File

    if (!clientId || !file) {
      return NextResponse.json({ ok: false, error: 'clientId and file required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check existing count (max 5)
    const { data: existing } = await supabase.storage
      .from(BUCKET)
      .list(clientId)
    const imageFiles = (existing ?? []).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
    if (imageFiles.length >= MAX_IMAGES) {
      return NextResponse.json({ ok: false, error: 'Maximum 5 reference images allowed' }, { status: 400 })
    }

    // Upload file
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const fileName = `ref-${Date.now()}.${ext}`
    const storagePath = `${clientId}/${fileName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type || 'image/png', upsert: false })

    if (uploadErr) throw new Error(uploadErr.message)

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    return NextResponse.json({
      ok: true,
      image: { name: fileName, url: publicUrl },
    })
  } catch (err) {
    console.error('[ReferenceImages] Upload error:', err)
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 })
  }
}

// DELETE — remove a reference image
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, fileName } = body

    if (!clientId || !fileName) {
      return NextResponse.json({ ok: false, error: 'clientId and fileName required' }, { status: 400 })
    }

    const supabase = await createClient()
    const storagePath = `${clientId}/${fileName}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath])

    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ReferenceImages] Delete error:', err)
    return NextResponse.json({ ok: false, error: 'Delete failed' }, { status: 500 })
  }
}
