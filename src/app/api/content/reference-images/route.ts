import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const REF_DIR = path.join(process.cwd(), 'public', 'reference-images')

function sanitizeClientId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '')
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  }
  return map[ext.toLowerCase()] ?? 'image/png'
}

// GET — list reference images for a client
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) {
    return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })
  }

  const dir = path.join(REF_DIR, sanitizeClientId(clientId))
  try {
    await fs.access(dir)
    const files = await fs.readdir(dir)
    const images = files
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .map(f => ({
        name: f,
        url: `/reference-images/${sanitizeClientId(clientId)}/${f}`,
      }))
    return NextResponse.json({ ok: true, images })
  } catch {
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

    const safeId = sanitizeClientId(clientId)
    const dir = path.join(REF_DIR, safeId)
    await fs.mkdir(dir, { recursive: true })

    // Check existing count (max 5)
    const existing = await fs.readdir(dir).catch(() => [])
    const imageFiles = existing.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    if (imageFiles.length >= 5) {
      return NextResponse.json({ ok: false, error: 'Maximum 5 reference images allowed' }, { status: 400 })
    }

    // Save file
    const ext = path.extname(file.name) || '.png'
    const fileName = `ref-${Date.now()}${ext}`
    const filePath = path.join(dir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    return NextResponse.json({
      ok: true,
      image: {
        name: fileName,
        url: `/reference-images/${safeId}/${fileName}`,
      },
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

    // Prevent path traversal
    const safeName = path.basename(fileName)
    const filePath = path.join(REF_DIR, sanitizeClientId(clientId), safeName)

    await fs.unlink(filePath)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'File not found or delete failed' }, { status: 404 })
  }
}
