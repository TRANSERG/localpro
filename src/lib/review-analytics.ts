import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export interface ReviewAnalytics {
  clientId: string
  visits: number
  completions: number
  ratings: Record<string, number> // "1" through "5"
  lastVisit: string | null
}

const DEFAULT_RATINGS: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }

/** Admin client for public (unauthenticated) API routes like /api/review/track */
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** Map a DB row to the ReviewAnalytics interface */
function rowToAnalytics(
  clientId: string,
  row: { visits: number; completions: number; ratings: unknown; last_visit: string | null } | null,
): ReviewAnalytics {
  const ratings = (row?.ratings && typeof row.ratings === 'object')
    ? { ...DEFAULT_RATINGS, ...(row.ratings as Record<string, number>) }
    : { ...DEFAULT_RATINGS }
  return {
    clientId,
    visits: row?.visits ?? 0,
    completions: row?.completions ?? 0,
    ratings,
    lastVisit: row?.last_visit ?? null,
  }
}

export async function readAnalytics(clientId: string): Promise<ReviewAnalytics> {
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('review_analytics')
    .select('visits, completions, ratings, last_visit')
    .eq('client_id', clientId)
    .single()
  return rowToAnalytics(clientId, data)
}

export async function readAllAnalytics(clientIds: string[]): Promise<ReviewAnalytics[]> {
  if (clientIds.length === 0) return []
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('review_analytics')
    .select('client_id, visits, completions, ratings, last_visit')
    .in('client_id', clientIds)
  const rowMap = new Map((data ?? []).map(r => [r.client_id, r]))
  return clientIds.map(id => rowToAnalytics(id, rowMap.get(id) ?? null))
}

/**
 * Record a review-link event. Uses admin client because this is called
 * from the public /api/review/track route (no user session).
 */
export async function recordEvent(
  clientId: string,
  event: 'visit' | 'rating' | 'complete',
  rating?: number,
): Promise<void> {
  const admin = getAdminClient()

  // Fetch current row (or null)
  const { data: existing } = await admin
    .from('review_analytics')
    .select('visits, completions, ratings, last_visit')
    .eq('client_id', clientId)
    .single()

  const visits = existing?.visits ?? 0
  const completions = existing?.completions ?? 0
  const ratings: Record<string, number> = {
    ...DEFAULT_RATINGS,
    ...((existing?.ratings as Record<string, number>) ?? {}),
  }
  let lastVisit = existing?.last_visit ?? null

  if (event === 'visit') {
    lastVisit = new Date().toISOString()
  }
  if (event === 'rating' && rating && rating >= 1 && rating <= 5) {
    ratings[String(rating)] = (ratings[String(rating)] ?? 0) + 1
  }

  const row = {
    client_id: clientId,
    visits: event === 'visit' ? visits + 1 : visits,
    completions: event === 'complete' ? completions + 1 : completions,
    ratings,
    last_visit: lastVisit,
    updated_at: new Date().toISOString(),
  }

  await admin
    .from('review_analytics')
    .upsert(row, { onConflict: 'client_id' })
}
