// ============================================================
// LocalRank Pro — Google My Business service library
// SERVER-SIDE ONLY — never import this in 'use client' files
// ============================================================
import { createClient as createSupabaseServer } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import type { GmbReview, GmbPost, GmbInsight, GmbBusinessInfo, NewGmbPost } from '@/types'

// ── Config ────────────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const APP_URL              = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const STATE_SECRET         = process.env.GMB_STATE_SECRET ?? 'dev_secret_change_me'
const REDIRECT_URI         = `${APP_URL}/api/gmb/callback`

// Google API base URLs
const ACCOUNTS_API   = 'https://mybusinessaccountmanagement.googleapis.com/v1'
const BIZ_INFO_API   = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const REVIEWS_API    = 'https://mybusiness.googleapis.com/v4'
const POSTS_API      = 'https://mybusiness.googleapis.com/v4'
const PERF_API       = 'https://businessprofileperformance.googleapis.com/v1'

// ── Admin Supabase client (bypasses RLS — used in OAuth callback only) ────────

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseAdmin(url, key)
}

// ── OAuth State (HMAC-SHA256 signed, CSRF protection) ────────────────────────

interface OAuthState {
  clientId: string
  nonce: string
  magicToken?: string   // present when flow was started from a magic-link invite
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function encodeState(state: OAuthState): Promise<string> {
  const payload = btoa(JSON.stringify(state))
  const sig = await hmacSign(payload, STATE_SECRET)
  return `${payload}.${sig}`
}

async function decodeState(raw: string): Promise<OAuthState> {
  const [payload, sig] = raw.split('.')
  if (!payload || !sig) throw new Error('Invalid state format')
  const expected = await hmacSign(payload, STATE_SECRET)
  if (expected !== sig) throw new Error('State signature mismatch — possible CSRF')
  return JSON.parse(atob(payload)) as OAuthState
}

// ── Token management ─────────────────────────────────────────────────────────

/** Returns a valid access token, refreshing it if near expiry. Throws if disconnected. */
export async function getValidAccessToken(clientId: string): Promise<string> {
  const supabase = await createSupabaseServer()
  const { data: row } = await supabase
    .from('gmb_tokens')
    .select('access_token, refresh_token, token_expires_at')
    .eq('client_id', clientId)
    .single()

  if (!row) throw new Error(`Client ${clientId} is not connected to GMB`)

  // Refresh if within 5 minutes of expiry
  const expiresAt = new Date(row.token_expires_at).getTime()
  if (Date.now() + 5 * 60 * 1000 < expiresAt) {
    return row.access_token
  }

  // Refresh the token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: row.refresh_token,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    // Token was revoked — clean up and tell caller to re-authorize
    await supabase.from('gmb_tokens').delete().eq('client_id', clientId)
    throw new Error('GMB token revoked — must re-authorize')
  }

  const tokens = await res.json() as { access_token: string; expires_in: number }
  const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await supabase
    .from('gmb_tokens')
    .update({ access_token: tokens.access_token, token_expires_at: newExpiry })
    .eq('client_id', clientId)

  return tokens.access_token
}

// ── OAuth flow ────────────────────────────────────────────────────────────────

/** Generate the Google OAuth URL for a specific client.
 *  Pass magicToken when the flow is initiated from a client-facing magic link. */
export async function generateAuthUrl(
  clientId: string,
  opts: { magicToken?: string } = {},
): Promise<string> {
  const state = await encodeState({ clientId, nonce: crypto.randomUUID(), ...opts })
  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/business.manage',
    access_type:   'offline',
    prompt:        'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

/** Handle the OAuth callback: exchange code for tokens, store in DB.
 *  Returns clientId and, if the flow started from a magic link, the magicToken. */
export async function handleOAuthCallback(
  code: string,
  rawState: string,
): Promise<{ clientId: string; magicToken?: string }> {
  const { clientId, magicToken } = await decodeState(rawState)

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code',
    }),
    signal: AbortSignal.timeout(10000),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
    id_token?: string
  }

  // Get Google account email from userinfo
  let googleEmail: string | null = null
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      signal: AbortSignal.timeout(5000),
    })
    if (userRes.ok) {
      const user = await userRes.json() as { email?: string }
      googleEmail = user.email ?? null
    }
  } catch { /* non-fatal */ }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  // Store tokens using admin client (no user session in callback)
  const admin = getAdminClient()
  await admin.from('gmb_tokens').upsert({
    client_id:       clientId,
    google_email:    googleEmail,
    access_token:    tokens.access_token,
    refresh_token:   tokens.refresh_token,
    token_expires_at: expiresAt,
  }, { onConflict: 'client_id' })

  // Auto-discover the GMB location — retry once after a short delay if the
  // first attempt fails (Google APIs sometimes need a moment after grant).
  try {
    await discoverAndStoreLocation(clientId, tokens.access_token, admin)
  } catch (err) {
    console.warn('[GMB callback] First discovery attempt failed, retrying in 2s…', err)
    try {
      await new Promise(r => setTimeout(r, 2000))
      await discoverAndStoreLocation(clientId, tokens.access_token, admin)
    } catch (retryErr) {
      console.error('[GMB callback] Location discovery failed after retry:', retryErr)
    }
  }

  // Mark the magic-link invite as used if this flow came from one
  if (magicToken) {
    try {
      await admin
        .from('gmb_connect_invites')
        .update({ used_at: new Date().toISOString() })
        .eq('token', magicToken)
    } catch { /* non-fatal */ }
  }

  return { clientId, magicToken }
}

/** Auto-discover the first GMB location accessible to the connected account.
 *  Works with any Supabase client (admin or authenticated). */
async function discoverAndStoreLocation(
  clientId: string,
  accessToken: string,
  db: ReturnType<typeof getAdminClient>,
) {
  const acctRes = await fetch(`${ACCOUNTS_API}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000),
  })
  if (!acctRes.ok) {
    const err = await acctRes.text()
    console.error(`[GMB discovery] accounts API ${acctRes.status}: ${err}`)
    throw new Error(`Accounts API error (${acctRes.status})`)
  }

  const accts = await acctRes.json() as { accounts?: Array<{ name: string; accountName: string }> }
  const account = accts.accounts?.[0]
  if (!account) {
    console.error('[GMB discovery] No accounts returned from Google')
    throw new Error('No Google Business accounts found')
  }

  const locRes = await fetch(
    `${BIZ_INFO_API}/${account.name}/locations?readMask=name,title`,
    { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000) },
  )
  if (!locRes.ok) {
    const err = await locRes.text()
    console.error(`[GMB discovery] locations API ${locRes.status}: ${err}`)
    throw new Error(`Locations API error (${locRes.status})`)
  }

  const locs = await locRes.json() as { locations?: Array<{ name: string; title: string }> }
  const loc = locs.locations?.[0]
  if (!loc) {
    console.error('[GMB discovery] No locations found under account', account.name)
    throw new Error('No locations found under the Google Business account')
  }

  await db.from('gmb_tokens').update({
    account_name:   account.name,
    location_name:  loc.name,
    location_title: loc.title,
  }).eq('client_id', clientId)

  console.log(`[GMB discovery] Linked ${loc.title} (${loc.name}) for client ${clientId}`)
}

/** Disconnect a client from GMB (delete tokens). */
export async function disconnectClient(clientId: string): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: row } = await supabase
    .from('gmb_tokens')
    .select('access_token')
    .eq('client_id', clientId)
    .single()

  if (row?.access_token) {
    // Attempt to revoke the token at Google (best-effort)
    fetch(`https://oauth2.googleapis.com/revoke?token=${row.access_token}`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    }).catch((err) => {
      console.warn('[GMB] Token revocation failed (non-fatal):', err)
    })
  }

  await supabase.from('gmb_tokens').delete().eq('client_id', clientId)
}

/** List all GMB locations accessible to a connected client. */
export async function listLocations(
  clientId: string,
): Promise<Array<{ name: string; title: string }>> {
  const accessToken = await getValidAccessToken(clientId)
  const supabase = await createSupabaseServer()
  const { data: tokenRow } = await supabase
    .from('gmb_tokens')
    .select('account_name')
    .eq('client_id', clientId)
    .single()

  if (!tokenRow?.account_name) return []

  const res = await fetch(
    `${BIZ_INFO_API}/${tokenRow.account_name}/locations?readMask=name,title`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) return []
  const data = await res.json() as { locations?: Array<{ name: string; title: string }> }
  return data.locations ?? []
}

/** Update which GMB location is linked to a client. */
export async function setLocation(
  clientId: string,
  locationName: string,
  locationTitle: string,
): Promise<void> {
  const supabase = await createSupabaseServer()
  await supabase
    .from('gmb_tokens')
    .update({ location_name: locationName, location_title: locationTitle })
    .eq('client_id', clientId)
}

// ── Location guard ────────────────────────────────────────────────────────────

interface TokenRowWithLocation {
  access_token?: string
  location_name: string
  account_name: string | null
}

/**
 * Ensures a GMB location is linked for the client. If `location_name` is missing
 * from the token row it re-attempts auto-discovery before giving up.
 * Returns the location_name and account_name so callers can build API paths.
 */
async function ensureLocationLinked(
  clientId: string,
  accessToken: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
): Promise<TokenRowWithLocation> {
  const { data: row } = await supabase
    .from('gmb_tokens')
    .select('location_name, account_name')
    .eq('client_id', clientId)
    .single()

  if (row?.location_name) return row as TokenRowWithLocation

  // location_name is missing — attempt auto-discovery using the admin client
  // (the authenticated Supabase client may lack write access to gmb_tokens
  //  depending on RLS, so we use the admin client here)
  console.warn(`[GMB] location_name missing for client ${clientId}, attempting discovery…`)
  const admin = getAdminClient()
  await discoverAndStoreLocation(clientId, accessToken, admin)

  const { data: updated } = await supabase
    .from('gmb_tokens')
    .select('location_name, account_name')
    .eq('client_id', clientId)
    .single()

  if (!updated?.location_name) {
    throw new Error('No GMB location linked for this client — auto-discovery failed. Please select a location manually.')
  }
  return updated as TokenRowWithLocation
}

/** Build the v4 API resource path (accounts/{id}/locations/{id}) from stored fields. */
function v4LocationPath(accountName: string | null, locationName: string): string {
  if (accountName && !locationName.includes('/accounts/')) {
    return `${accountName}/${locationName}`
  }
  return locationName
}

// ── Reviews ───────────────────────────────────────────────────────────────────

/** Sync reviews from Google into gmb_reviews. Returns count upserted. */
export async function syncReviews(clientId: string): Promise<number> {
  const accessToken = await getValidAccessToken(clientId)
  const supabase = await createSupabaseServer()
  const loc = await ensureLocationLinked(clientId, accessToken, supabase)
  const v4Path = v4LocationPath(loc.account_name, loc.location_name)

  const res = await fetch(
    `${REVIEWS_API}/${v4Path}/reviews?pageSize=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Reviews API error: ${err}`)
  }

  const data = await res.json() as {
    reviews?: Array<{
      reviewId: string
      reviewer: { displayName: string; profilePhotoUrl?: string }
      starRating: string
      comment?: string
      createTime: string
      updateTime: string
      reviewReply?: { comment: string; updateTime: string }
    }>
  }

  const reviews = data.reviews ?? []
  if (reviews.length === 0) {
    await supabase.from('gmb_tokens').update({ reviews_synced_at: new Date().toISOString() }).eq('client_id', clientId)
    return 0
  }

  const rows = reviews.map(r => ({
    client_id:      clientId,
    gmb_review_id:  r.reviewId,
    reviewer_name:  r.reviewer.displayName,
    reviewer_photo: r.reviewer.profilePhotoUrl ?? null,
    star_rating:    r.starRating,
    comment:        r.comment ?? null,
    review_time:    r.createTime,
    reply_comment:  r.reviewReply?.comment ?? null,
    reply_time:     r.reviewReply?.updateTime ?? null,
  }))

  const { error } = await supabase
    .from('gmb_reviews')
    .upsert(rows, { onConflict: 'client_id,gmb_review_id' })

  if (error) throw new Error(error.message)

  await supabase.from('gmb_tokens').update({ reviews_synced_at: new Date().toISOString() }).eq('client_id', clientId)
  return rows.length
}

/** Post or update a reply to a GMB review. */
export async function replyToReview(
  clientId: string,
  reviewId: string,
  replyText: string,
): Promise<void> {
  const accessToken = await getValidAccessToken(clientId)
  const supabase = await createSupabaseServer()
  const loc = await ensureLocationLinked(clientId, accessToken, supabase)
  const v4Path = v4LocationPath(loc.account_name, loc.location_name)

  const { data: reviewRow } = await supabase
    .from('gmb_reviews')
    .select('gmb_review_id')
    .eq('id', reviewId)
    .eq('client_id', clientId)
    .single()

  if (!reviewRow) throw new Error('Review not found')

  const res = await fetch(
    `${REVIEWS_API}/${v4Path}/reviews/${reviewRow.gmb_review_id}/reply`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: replyText }),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Reply failed: ${err}`)
  }

  // Update local cache
  await supabase
    .from('gmb_reviews')
    .update({ reply_comment: replyText, reply_time: new Date().toISOString() })
    .eq('id', reviewId)
}

// ── Posts ─────────────────────────────────────────────────────────────────────

/** Sync posts from Google into gmb_posts. Returns count upserted. */
export async function syncPosts(clientId: string): Promise<number> {
  const accessToken = await getValidAccessToken(clientId)
  const supabase = await createSupabaseServer()
  const loc = await ensureLocationLinked(clientId, accessToken, supabase)
  const v4Path = v4LocationPath(loc.account_name, loc.location_name)

  const res = await fetch(
    `${POSTS_API}/${v4Path}/localPosts?pageSize=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Posts API error: ${err}`)
  }

  const data = await res.json() as {
    localPosts?: Array<{
      name: string
      languageCode: string
      summary?: string
      topicType: string
      state: string
      createTime: string
      callToAction?: { actionType: string; url?: string }
      event?: { title: string; schedule: { startDateTime: Record<string, number>; endDateTime: Record<string, number> } }
      media?: Array<{ googleUrl?: string; sourceUrl?: string }>
    }>
  }

  const posts = data.localPosts ?? []
  if (posts.length === 0) {
    await supabase.from('gmb_tokens').update({ posts_synced_at: new Date().toISOString() }).eq('client_id', clientId)
    return 0
  }

  const rows = posts.map(p => {
    const postId = p.name.split('/').pop()!
    const dtToIso = (dt: Record<string, number>) =>
      dt ? new Date(dt.year, (dt.month ?? 1) - 1, dt.day ?? 1, dt.hours ?? 0, dt.minutes ?? 0).toISOString() : null
    return {
      client_id:   clientId,
      gmb_post_id: postId,
      topic_type:  p.topicType ?? 'STANDARD',
      summary:     p.summary ?? null,
      event_title: p.event?.title ?? null,
      event_start: p.event ? dtToIso(p.event.schedule.startDateTime) : null,
      event_end:   p.event ? dtToIso(p.event.schedule.endDateTime) : null,
      cta_type:    p.callToAction?.actionType ?? null,
      cta_url:     p.callToAction?.url ?? null,
      media_urls:  p.media?.map(m => m.googleUrl ?? m.sourceUrl ?? '').filter(Boolean) ?? [],
      state:       p.state,
      create_time: p.createTime,
    }
  })

  const { error } = await supabase
    .from('gmb_posts')
    .upsert(rows, { onConflict: 'client_id,gmb_post_id' })

  if (error) throw new Error(error.message)
  await supabase.from('gmb_tokens').update({ posts_synced_at: new Date().toISOString() }).eq('client_id', clientId)
  return rows.length
}

/** Create a new GMB post. */
export async function createPost(clientId: string, post: NewGmbPost): Promise<GmbPost> {
  const accessToken = await getValidAccessToken(clientId)
  const supabase = await createSupabaseServer()
  const loc = await ensureLocationLinked(clientId, accessToken, supabase)
  const v4Path = v4LocationPath(loc.account_name, loc.location_name)

  const body: Record<string, unknown> = {
    languageCode: 'en',
    summary:     post.summary,
    topicType:   post.topic_type,
  }

  if (post.cta_type) {
    body.callToAction = { actionType: post.cta_type, url: post.cta_url }
  }

  if (post.topic_type === 'EVENT' && post.event_title) {
    const toGoogleDt = (iso: string) => {
      const d = new Date(iso)
      return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hours: d.getHours(), minutes: d.getMinutes() }
    }
    body.event = {
      title:    post.event_title,
      schedule: {
        startDateTime: toGoogleDt(post.event_start!),
        endDateTime:   toGoogleDt(post.event_end!),
      },
    }
  }

  const res = await fetch(
    `${POSTS_API}/${v4Path}/localPosts`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Create post failed: ${err}`)
  }

  const created = await res.json() as { name: string; state: string; createTime: string }
  const postId = created.name.split('/').pop()!

  const row = {
    client_id:   clientId,
    gmb_post_id: postId,
    topic_type:  post.topic_type,
    summary:     post.summary,
    event_title: post.event_title ?? null,
    event_start: post.event_start ?? null,
    event_end:   post.event_end ?? null,
    cta_type:    post.cta_type ?? null,
    cta_url:     post.cta_url ?? null,
    media_urls:  [],
    state:       created.state,
    create_time: created.createTime,
  }

  const { data: saved } = await supabase
    .from('gmb_posts')
    .insert(row)
    .select()
    .single()

  return saved as GmbPost
}

/** Delete a GMB post (both from Google and the local cache). */
export async function deletePost(clientId: string, postDbId: string): Promise<void> {
  const accessToken = await getValidAccessToken(clientId)
  const supabase = await createSupabaseServer()
  const loc = await ensureLocationLinked(clientId, accessToken, supabase)
  const v4Path = v4LocationPath(loc.account_name, loc.location_name)

  const { data: postRow } = await supabase
    .from('gmb_posts')
    .select('gmb_post_id')
    .eq('id', postDbId)
    .single()

  if (postRow?.gmb_post_id) {
    await fetch(
      `${POSTS_API}/${v4Path}/localPosts/${postRow.gmb_post_id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
    ).catch(() => { /* ignore */ })
  }

  await supabase.from('gmb_posts').delete().eq('id', postDbId)
}

// ── Insights ──────────────────────────────────────────────────────────────────

const INSIGHT_METRICS = [
  'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
  'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
  'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
  'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
  'CALL_CLICKS',
  'WEBSITE_CLICKS',
  'BUSINESS_DIRECTION_REQUESTS',
] as const

/** Sync GMB insights for the last N days. Returns count of rows upserted. */
export async function syncInsights(clientId: string, days = 90): Promise<number> {
  const accessToken = await getValidAccessToken(clientId)
  const supabase = await createSupabaseServer()
  const loc = await ensureLocationLinked(clientId, accessToken, supabase)

  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

  const toDateObj = (d: Date) => ({
    year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
  })

  const res = await fetch(
    `${PERF_API}/${loc.location_name}:fetchMultiDailyMetricsTimeSeries`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dailyMetrics: INSIGHT_METRICS,
        dailyRange: { startDate: toDateObj(startDate), endDate: toDateObj(endDate) },
      }),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Insights API error: ${err}`)
  }

  const data = await res.json() as {
    multiDailyMetricTimeSeries?: Array<{
      dailyMetric: string
      dailySubEntityType?: string
      timeSeries: {
        datedValues: Array<{ date: { year: number; month: number; day: number }; value?: number }>
      }
    }>
  }

  const rows: Array<{ client_id: string; metric_date: string; metric_type: string; value: number }> = []

  for (const series of data.multiDailyMetricTimeSeries ?? []) {
    for (const dv of series.timeSeries?.datedValues ?? []) {
      if (!dv.date) continue
      const dateStr = `${dv.date.year}-${String(dv.date.month).padStart(2, '0')}-${String(dv.date.day).padStart(2, '0')}`
      rows.push({
        client_id:   clientId,
        metric_date: dateStr,
        metric_type: series.dailyMetric,
        value:       dv.value ?? 0,
      })
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from('gmb_insights')
      .upsert(rows, { onConflict: 'client_id,metric_date,metric_type' })
    if (error) throw new Error(error.message)
  }

  await supabase.from('gmb_tokens').update({ insights_synced_at: new Date().toISOString() }).eq('client_id', clientId)
  return rows.length
}

// ── Business Info ─────────────────────────────────────────────────────────────

/** Sync business information from Google. */
export async function syncBusinessInfo(clientId: string): Promise<GmbBusinessInfo> {
  const accessToken = await getValidAccessToken(clientId)
  const supabase = await createSupabaseServer()
  const linked = await ensureLocationLinked(clientId, accessToken, supabase)

  const fields = 'name,title,phoneNumbers,websiteUri,categories,regularHours,storefrontAddress,profile,openInfo'
  const res = await fetch(
    `${BIZ_INFO_API}/${linked.location_name}?readMask=${fields}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Business Info API error: ${err}`)
  }

  const loc = await res.json() as {
    title?: string
    profile?: { description?: string }
    phoneNumbers?: { primaryPhone?: string }
    websiteUri?: string
    categories?: { primaryCategory?: { name: string; displayName: string } }
    storefrontAddress?: {
      addressLines?: string[]
      locality?: string
      administrativeArea?: string
      postalCode?: string
      regionCode?: string
    }
    openInfo?: { status?: string }
    regularHours?: {
      periods?: Array<{
        openDay: string
        closeDay?: string
        openTime: { hours?: number; minutes?: number }
        closeTime: { hours?: number; minutes?: number }
      }>
    }
  }

  const formatTime = (t: { hours?: number; minutes?: number }) =>
    `${String(t.hours ?? 0).padStart(2, '0')}:${String(t.minutes ?? 0).padStart(2, '0')}`

  const row = {
    client_id:                      clientId,
    title:                          loc.title ?? null,
    description:                    loc.profile?.description ?? null,
    primary_phone:                  loc.phoneNumbers?.primaryPhone ?? null,
    website_uri:                    loc.websiteUri ?? null,
    primary_category_name:          loc.categories?.primaryCategory?.name ?? null,
    primary_category_display_name:  loc.categories?.primaryCategory?.displayName ?? null,
    open_for_business:              loc.openInfo?.status ?? null,
    address:                        loc.storefrontAddress ?? null,
    regular_hours:                  loc.regularHours?.periods?.map(p => ({
      openDay:   p.openDay,
      closeDay:  p.closeDay ?? p.openDay,
      openTime:  formatTime(p.openTime),
      closeTime: formatTime(p.closeTime),
    })) ?? [],
    synced_at: new Date().toISOString(),
  }

  const { data: saved } = await supabase
    .from('gmb_business_info')
    .upsert(row, { onConflict: 'client_id' })
    .select()
    .single()

  await supabase.from('gmb_tokens').update({ info_synced_at: new Date().toISOString() }).eq('client_id', clientId)
  return saved as GmbBusinessInfo
}

/** Update business info on Google (title, description, phone, website). */
export async function updateBusinessInfo(
  clientId: string,
  updates: { title?: string; description?: string; primary_phone?: string; website_uri?: string },
): Promise<void> {
  const accessToken = await getValidAccessToken(clientId)
  const supabase = await createSupabaseServer()
  const linked = await ensureLocationLinked(clientId, accessToken, supabase)

  const body: Record<string, unknown> = {}
  const updateMask: string[] = []

  if (updates.title !== undefined) {
    body.title = updates.title
    updateMask.push('title')
  }
  if (updates.description !== undefined) {
    body.profile = { description: updates.description }
    updateMask.push('profile.description')
  }
  if (updates.primary_phone !== undefined) {
    body.phoneNumbers = { primaryPhone: updates.primary_phone }
    updateMask.push('phoneNumbers.primaryPhone')
  }
  if (updates.website_uri !== undefined) {
    body.websiteUri = updates.website_uri
    updateMask.push('websiteUri')
  }

  if (updateMask.length === 0) return

  const res = await fetch(
    `${BIZ_INFO_API}/${linked.location_name}?updateMask=${updateMask.join(',')}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Update business info failed: ${err}`)
  }

  // Update local cache
  const dbUpdates: Record<string, unknown> = { synced_at: new Date().toISOString() }
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.primary_phone !== undefined) dbUpdates.primary_phone = updates.primary_phone
  if (updates.website_uri !== undefined) dbUpdates.website_uri = updates.website_uri

  await supabase.from('gmb_business_info').update(dbUpdates).eq('client_id', clientId)
}
