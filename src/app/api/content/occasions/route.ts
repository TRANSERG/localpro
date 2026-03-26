import { NextRequest, NextResponse } from 'next/server'
import { getOccasionsForMonth } from '@/lib/occasion-lookup'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const yearStr = searchParams.get('year')
  const monthStr = searchParams.get('month')

  if (!yearStr || !monthStr) {
    return NextResponse.json({ ok: false, error: 'year and month query params are required' }, { status: 400 })
  }

  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ ok: false, error: 'year must be a number, month must be 1-12' }, { status: 400 })
  }

  try {
    const occasions = await getOccasionsForMonth(year, month)
    return NextResponse.json({ ok: true, occasions })
  } catch (err) {
    console.error('[Occasions API] Error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to fetch occasions' }, { status: 500 })
  }
}
