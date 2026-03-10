import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET ?clientId=...&days=30 — return aggregated daily insights from DB
export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId')
    const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10)
    if (!clientId) return NextResponse.json({ ok: false, error: 'clientId required' }, { status: 400 })

    const supabase = await createClient()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('gmb_insights')
      .select('metric_date, metric_type, value')
      .eq('client_id', clientId)
      .gte('metric_date', since)
      .order('metric_date')

    if (error) throw new Error(error.message)

    // Aggregate daily totals for the chart:
    // views = desktop_maps + desktop_search + mobile_maps + mobile_search
    // calls = CALL_CLICKS
    // clicks = WEBSITE_CLICKS
    // directions = BUSINESS_DIRECTION_REQUESTS
    const byDate: Record<string, { date: string; views: number; calls: number; clicks: number; directions: number }> = {}

    for (const row of data ?? []) {
      if (!byDate[row.metric_date]) {
        byDate[row.metric_date] = { date: row.metric_date, views: 0, calls: 0, clicks: 0, directions: 0 }
      }
      const d = byDate[row.metric_date]
      if (row.metric_type.includes('IMPRESSIONS')) d.views += row.value
      else if (row.metric_type === 'CALL_CLICKS') d.calls += row.value
      else if (row.metric_type === 'WEBSITE_CLICKS') d.clicks += row.value
      else if (row.metric_type === 'BUSINESS_DIRECTION_REQUESTS') d.directions += row.value
    }

    const chart = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
    const totals = chart.reduce(
      (acc, d) => ({
        views: acc.views + d.views,
        calls: acc.calls + d.calls,
        clicks: acc.clicks + d.clicks,
        directions: acc.directions + d.directions,
      }),
      { views: 0, calls: 0, clicks: 0, directions: 0 },
    )

    return NextResponse.json({ ok: true, data: { chart, totals } })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
