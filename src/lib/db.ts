// ============================================================
// LocalRank Pro — Supabase query helpers (server-side only)
// ============================================================
import { createClient } from '@/lib/supabase/server'
import type {
  Client, Profile, Keyword, Task, ReviewTracker,
  Competitor, MonthlyReport, BrandingProfile, GBPSettings,
  SOP, GBPAuditItem, GBPAuditResponse, GmbConnectionStatus,
} from '@/types'

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('business_name')
  return (data ?? []) as Client[]
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('full_name')
  return (data ?? []) as Profile[]
}

export async function getKeywords(): Promise<Keyword[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('keywords')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as Keyword[]
}

export async function getTasks(monthYear?: string): Promise<Task[]> {
  const supabase = await createClient()
  let query = supabase.from('tasks').select('*').order('due_date')
  if (monthYear) query = query.eq('month_year', monthYear)
  const { data } = await query
  return (data ?? []) as Task[]
}

export async function getReviews(monthYear?: string): Promise<ReviewTracker[]> {
  const supabase = await createClient()
  let query = supabase
    .from('review_tracker')
    .select('*')
    .order('month_year', { ascending: false })
  if (monthYear) query = query.eq('month_year', monthYear)
  const { data } = await query
  return (data ?? []) as ReviewTracker[]
}

export async function getCompetitors(): Promise<Competitor[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('competitors')
    .select('*')
    .order('competitor_name')
  return (data ?? []) as Competitor[]
}

export async function getMonthlyReports(): Promise<MonthlyReport[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('monthly_reports')
    .select('*')
    .order('month_year', { ascending: false })
  return (data ?? []) as MonthlyReport[]
}

export async function getBrandingProfiles(): Promise<BrandingProfile[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('branding_profiles').select('*')
  return (data ?? []) as BrandingProfile[]
}

export async function getGBPSettingsAll(): Promise<GBPSettings[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('gbp_settings').select('*')
  return (data ?? []) as GBPSettings[]
}

export async function getSOPs(): Promise<SOP[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sops')
    .select('*')
    .order('sort_order')
  return (data ?? []) as SOP[]
}

export async function getGBPAuditItems(): Promise<GBPAuditItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gbp_audit_items')
    .select('*')
    .order('sort_order')
  return (data ?? []) as GBPAuditItem[]
}

export async function getGBPAuditResponses(): Promise<GBPAuditResponse[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gbp_audit_responses')
    .select('*, audit_item:gbp_audit_items(*)')
  return (data ?? []) as GBPAuditResponse[]
}

/** GMB connection statuses for a list of clients — never exposes tokens */
export async function getGmbConnectionStatuses(
  clientIds: string[],
): Promise<GmbConnectionStatus[]> {
  if (clientIds.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('gmb_tokens')
    .select(
      'client_id, google_email, location_title, reviews_synced_at, posts_synced_at, insights_synced_at, info_synced_at',
    )
    .in('client_id', clientIds)
  const connectedIds = new Set((data ?? []).map((r) => r.client_id))
  const tokenMap = new Map((data ?? []).map((r) => [r.client_id, r]))
  return clientIds.map((id) => {
    const row = tokenMap.get(id)
    return {
      client_id: id,
      is_connected: connectedIds.has(id),
      google_email: row?.google_email ?? null,
      location_title: row?.location_title ?? null,
      reviews_synced_at: row?.reviews_synced_at ?? null,
      posts_synced_at: row?.posts_synced_at ?? null,
      insights_synced_at: row?.insights_synced_at ?? null,
      info_synced_at: row?.info_synced_at ?? null,
    }
  })
}

/** Aggregate monthly_reports data for the performance chart */
export async function getPerformanceChartData() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('monthly_reports')
    .select('month_year, profile_views, website_clicks, total_calls')
    .order('month_year')
    .limit(12)
  if (!data || data.length === 0) return null
  return data.map(r => ({
    month: new Date(r.month_year + '-01').toLocaleString('en-IN', { month: 'short' }),
    views: (r.profile_views ?? 0),
    clicks: (r.website_clicks ?? 0),
    calls: (r.total_calls ?? 0),
  }))
}
