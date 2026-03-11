'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { ClientAvatar } from '@/components/ui/client-avatar'
import type { Client, GmbConnectionStatus, GmbReview, GmbPost, GmbBusinessInfo, NewGmbPost } from '@/types'
import {
  CheckCircle2, AlertCircle, RefreshCw, Wifi, WifiOff,
  Star, MessageSquare, Send, Plus, Trash2, Edit2, X,
  Globe, Phone, MapPin, Clock, Building2, TrendingUp,
  BarChart3, Eye, MousePointerClick, Navigation, ChevronDown, ChevronUp,
  Link2, Copy, Check,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// ── Star rating helpers ───────────────────────────────────────────────────────

const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }

function StarRating({ rating, size = 'sm' }: { rating: string; size?: 'sm' | 'md' }) {
  const stars = STAR_MAP[rating] ?? 0
  const s = size === 'md' ? 'h-4 w-4' : 'h-3 w-3'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn(s, i <= stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200')} />
      ))}
    </div>
  )
}

// ── Sync badge ────────────────────────────────────────────────────────────────

function SyncBadge({ syncedAt }: { syncedAt: string | null }) {
  if (!syncedAt) return <span className="text-[11px] text-gray-400">Never synced</span>
  return (
    <span className="text-[11px] text-gray-400">
      Synced {new Date(syncedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

// ── Reviews Tab ───────────────────────────────────────────────────────────────

function ReviewsTab({ clientId, syncedAt }: { clientId: string; syncedAt: string | null }) {
  const [reviews, setReviews] = useState<GmbReview[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const loadReviews = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/gmb/reviews?clientId=${clientId}`)
    const json = await res.json() as { ok: boolean; data: GmbReview[] }
    if (json.ok) setReviews(json.data)
    setLoading(false)
  }, [clientId])

  useEffect(() => { loadReviews() }, [loadReviews])

  async function handleSync() {
    setSyncing(true)
    setError(null)
    const res = await fetch('/api/gmb/reviews/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
    const json = await res.json() as { ok: boolean; error?: string; synced?: number }
    if (json.ok) { await loadReviews(); router.refresh() }
    else setError(json.error ?? 'Sync failed')
    setSyncing(false)
  }

  async function handleReply(reviewId: string) {
    if (!replyText.trim()) return
    setSending(true)
    setError(null)
    const res = await fetch('/api/gmb/reviews/reply', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, reviewId, reply: replyText }),
    })
    const json = await res.json() as { ok: boolean; error?: string }
    if (json.ok) {
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply_comment: replyText, reply_time: new Date().toISOString() } : r))
      setReplyingId(null)
      setReplyText('')
    } else setError(json.error ?? 'Reply failed')
    setSending(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">{reviews.length} reviews</span>
          <SyncBadge syncedAt={syncedAt} />
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
          {syncing ? 'Syncing…' : 'Sync from Google'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          No reviews synced yet. Click "Sync from Google" to pull reviews.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {review.reviewer_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.reviewer_photo} alt={review.reviewer_name ?? ''} className="h-9 w-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                      {getInitials(review.reviewer_name ?? '?')}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{review.reviewer_name ?? 'Anonymous'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={review.star_rating} />
                      <span className="text-[11px] text-gray-400">{formatDate(review.review_time)}</span>
                    </div>
                  </div>
                </div>
                {!review.reply_comment && (
                  <button onClick={() => { setReplyingId(review.id); setReplyText('') }}
                    className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 shrink-0">
                    <MessageSquare className="h-3 w-3" /> Reply
                  </button>
                )}
              </div>

              {review.comment && (
                <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
              )}

              {review.reply_comment && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-[11px] font-semibold text-blue-600 mb-1">Your reply · {formatDate(review.reply_time)}</p>
                  <p className="text-sm text-blue-900">{review.reply_comment}</p>
                </div>
              )}

              {replyingId === review.id && (
                <div className="space-y-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write your reply…"
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleReply(review.id)} disabled={sending || !replyText.trim()}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                      <Send className="h-3 w-3" /> {sending ? 'Posting…' : 'Post Reply'}
                    </button>
                    <button onClick={() => { setReplyingId(null); setReplyText('') }}
                      className="h-8 px-3 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── New Post Modal ────────────────────────────────────────────────────────────

function NewPostModal({
  clientId,
  onClose,
  onCreated,
}: {
  clientId: string
  onClose: () => void
  onCreated: (post: GmbPost) => void
}) {
  const [form, setForm] = useState<Partial<NewGmbPost>>({ topic_type: 'STANDARD', summary: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof NewGmbPost>(k: K, v: NewGmbPost[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const CTA_OPTIONS = ['LEARN_MORE', 'BOOK', 'ORDER', 'SHOP', 'SIGN_UP', 'CALL']

  async function handleCreate() {
    if (!form.summary?.trim()) { setError('Summary is required'); return }
    if (form.topic_type === 'EVENT' && !form.event_title) { setError('Event title is required'); return }
    setSaving(true)
    setError(null)
    const res = await fetch('/api/gmb/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, ...form }),
    })
    const json = await res.json() as { ok: boolean; data?: GmbPost; error?: string }
    if (json.ok && json.data) { onCreated(json.data); onClose() }
    else { setError(json.error ?? 'Failed to create post'); setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">New GMB Post</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Post Type</label>
            <select value={form.topic_type} onChange={e => set('topic_type', e.target.value as NewGmbPost['topic_type'])}
              className="w-full h-8 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="STANDARD">What&apos;s New</option>
              <option value="EVENT">Event</option>
              <option value="OFFER">Offer</option>
            </select>
          </div>

          {form.topic_type === 'EVENT' && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Event Title *</label>
                <input value={form.event_title ?? ''} onChange={e => set('event_title', e.target.value)}
                  className="w-full h-8 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Start</label>
                  <input type="datetime-local" value={form.event_start ?? ''}
                    onChange={e => set('event_start', e.target.value)}
                    className="w-full h-8 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">End</label>
                  <input type="datetime-local" value={form.event_end ?? ''}
                    onChange={e => set('event_end', e.target.value)}
                    className="w-full h-8 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Summary *</label>
            <textarea value={form.summary} onChange={e => set('summary', e.target.value)}
              rows={4} maxLength={1500} placeholder="What's happening at your business?"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{form.summary?.length ?? 0}/1500</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Call to Action</label>
              <select value={form.cta_type ?? ''} onChange={e => set('cta_type', e.target.value || undefined)}
                className="w-full h-8 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">None</option>
                {CTA_OPTIONS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
              </select>
            </div>
            {form.cta_type && (
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Button URL</label>
                <input value={form.cta_url ?? ''} onChange={e => set('cta_url', e.target.value)}
                  placeholder="https://..." className="w-full h-8 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            className="h-9 px-5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Publishing…' : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Posts Tab ─────────────────────────────────────────────────────────────────

function PostsTab({ clientId, syncedAt }: { clientId: string; syncedAt: string | null }) {
  const [posts, setPosts] = useState<GmbPost[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const loadPosts = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/gmb/posts?clientId=${clientId}`)
    const json = await res.json() as { ok: boolean; data: GmbPost[] }
    if (json.ok) setPosts(json.data)
    setLoading(false)
  }, [clientId])

  useEffect(() => { loadPosts() }, [loadPosts])

  async function handleSync() {
    setSyncing(true)
    setError(null)
    const res = await fetch('/api/gmb/posts/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
    const json = await res.json() as { ok: boolean; error?: string }
    if (json.ok) { await loadPosts(); router.refresh() }
    else setError(json.error ?? 'Sync failed')
    setSyncing(false)
  }

  async function handleDelete(postId: string) {
    if (!confirm('Delete this post? This will remove it from Google too.')) return
    const res = await fetch(`/api/gmb/posts/${postId}?clientId=${clientId}`, { method: 'DELETE' })
    const json = await res.json() as { ok: boolean; error?: string }
    if (json.ok) setPosts(prev => prev.filter(p => p.id !== postId))
    else setError(json.error ?? 'Delete failed')
  }

  const TOPIC_LABELS: Record<string, string> = { STANDARD: "What's New", EVENT: 'Event', OFFER: 'Offer' }
  const STATE_CLASSES: Record<string, string> = {
    LIVE: 'bg-green-50 text-green-700 border-green-200',
    PROCESSING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">{posts.length} posts</span>
          <SyncBadge syncedAt={syncedAt} />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : 'Sync'}
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> New Post
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading posts…</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          No posts yet. Create your first post or sync from Google.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      {TOPIC_LABELS[post.topic_type] ?? post.topic_type}
                    </span>
                    {post.state && (
                      <span className={cn('text-[11px] font-medium rounded-full px-2 py-0.5 border', STATE_CLASSES[post.state] ?? 'bg-gray-50 text-gray-600 border-gray-200')}>
                        {post.state}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400 ml-auto">{formatDate(post.create_time)}</span>
                  </div>
                  {post.event_title && (
                    <p className="text-sm font-semibold text-gray-900 mb-1">{post.event_title}</p>
                  )}
                  {post.summary && (
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{post.summary}</p>
                  )}
                  {post.cta_type && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 border border-blue-200 rounded-full px-2 py-0.5">
                        {post.cta_type.replace('_', ' ')} →
                      </span>
                    </div>
                  )}
                </div>
                <button onClick={() => handleDelete(post.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <NewPostModal
          clientId={clientId}
          onClose={() => setShowNew(false)}
          onCreated={post => setPosts(prev => [post, ...prev])}
        />
      )}
    </div>
  )
}

// ── Insights Tab ──────────────────────────────────────────────────────────────

type InsightPeriod = 7 | 30 | 90
interface InsightData {
  chart: Array<{ date: string; views: number; calls: number; clicks: number; directions: number }>
  totals: { views: number; calls: number; clicks: number; directions: number }
}

function InsightsTab({ clientId, syncedAt }: { clientId: string; syncedAt: string | null }) {
  const [data, setData] = useState<InsightData | null>(null)
  const [period, setPeriod] = useState<InsightPeriod>(30)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const loadInsights = useCallback(async (days: number) => {
    setLoading(true)
    const res = await fetch(`/api/gmb/insights?clientId=${clientId}&days=${days}`)
    const json = await res.json() as { ok: boolean; data?: InsightData }
    if (json.ok && json.data) setData(json.data)
    else setData(null)
    setLoading(false)
  }, [clientId])

  useEffect(() => { loadInsights(period) }, [loadInsights, period])

  async function handleSync() {
    setSyncing(true)
    setError(null)
    const res = await fetch('/api/gmb/insights/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, days: 90 }),
    })
    const json = await res.json() as { ok: boolean; error?: string }
    if (json.ok) { await loadInsights(period); router.refresh() }
    else setError(json.error ?? 'Sync failed')
    setSyncing(false)
  }

  const kpiCards = data ? [
    { label: 'Total Views', value: data.totals.views, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Calls', value: data.totals.calls, icon: Phone, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Website Clicks', value: data.totals.clicks, icon: MousePointerClick, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Direction Requests', value: data.totals.directions, icon: Navigation, color: 'text-amber-600', bg: 'bg-amber-50' },
  ] : []

  // Format chart dates nicely
  const chartData = data?.chart.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  })) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {([7, 30, 90] as InsightPeriod[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('h-8 px-3 rounded-lg text-xs font-medium border transition-colors',
                period === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
              {p}d
            </button>
          ))}
          <SyncBadge syncedAt={syncedAt} />
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
          {syncing ? 'Syncing…' : 'Sync from Google'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading insights…</div>
      ) : !data ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          No insights yet. Click "Sync from Google" to pull data.
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {kpiCards.map(kpi => (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center mb-3', kpi.bg)}>
                  <kpi.icon className={cn('h-4 w-4', kpi.color)} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{kpi.value.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Line chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-900 mb-4">Daily Performance — Last {period} days</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} name="Views" />
                <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Clicks" />
                <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2} dot={false} name="Calls" />
                <Line type="monotone" dataKey="directions" stroke="#f59e0b" strokeWidth={2} dot={false} name="Directions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

// ── Business Info Tab ─────────────────────────────────────────────────────────

function BusinessInfoTab({ clientId, syncedAt }: { clientId: string; syncedAt: string | null }) {
  const [info, setInfo] = useState<GmbBusinessInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState<Partial<GmbBusinessInfo>>({})
  const [error, setError] = useState<string | null>(null)
  const [hoursOpen, setHoursOpen] = useState(false)
  const router = useRouter()

  const loadInfo = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/gmb/info?clientId=${clientId}`)
    const json = await res.json() as { ok: boolean; data: GmbBusinessInfo | null }
    if (json.ok) setInfo(json.data)
    setLoading(false)
  }, [clientId])

  useEffect(() => { loadInfo() }, [loadInfo])

  async function handleSync() {
    setSyncing(true)
    setError(null)
    const res = await fetch('/api/gmb/info/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
    const json = await res.json() as { ok: boolean; data?: GmbBusinessInfo; error?: string }
    if (json.ok && json.data) { setInfo(json.data); router.refresh() }
    else setError(json.error ?? 'Sync failed')
    setSyncing(false)
  }

  async function handleSave() {
    if (!info) return
    setSaving(true)
    setError(null)
    const updates: Partial<Pick<GmbBusinessInfo, 'title' | 'description' | 'primary_phone' | 'website_uri'>> = {}
    if (draft.title         !== undefined) updates.title         = draft.title         ?? null
    if (draft.description   !== undefined) updates.description   = draft.description   ?? null
    if (draft.primary_phone !== undefined) updates.primary_phone = draft.primary_phone ?? null
    if (draft.website_uri   !== undefined) updates.website_uri   = draft.website_uri   ?? null

    const res = await fetch('/api/gmb/info', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, ...updates }),
    })
    const json = await res.json() as { ok: boolean; error?: string }
    if (json.ok) {
      setInfo(prev => prev ? { ...prev, ...updates } : prev)
      setEditMode(false)
      setDraft({})
    } else setError(json.error ?? 'Save failed')
    setSaving(false)
  }

  function Field({ label, icon: Icon, value, editKey, type = 'text', multiline = false }: {
    label: string; icon: React.ComponentType<{ className?: string }>;
    value: string | null | undefined; editKey?: keyof GmbBusinessInfo;
    type?: string; multiline?: boolean
  }) {
    const editValue = editKey ? (draft[editKey] as string | undefined) ?? value ?? '' : value ?? ''
    return (
      <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
        <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="h-3.5 w-3.5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
          {editMode && editKey ? (
            multiline ? (
              <textarea value={editValue} onChange={e => setDraft(d => ({ ...d, [editKey]: e.target.value }))}
                rows={3} maxLength={750}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            ) : (
              <input type={type} value={editValue} onChange={e => setDraft(d => ({ ...d, [editKey]: e.target.value }))}
                className="w-full h-8 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            )
          ) : (
            <p className="text-sm text-gray-900">{value ?? <span className="text-gray-400">—</span>}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SyncBadge syncedAt={syncedAt} />
        <div className="flex gap-2">
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : 'Sync from Google'}
          </button>
          {info && !editMode && (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700">
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
          )}
          {editMode && (
            <>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save to Google'}
              </button>
              <button onClick={() => { setEditMode(false); setDraft({}) }}
                className="h-8 px-3 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading business info…</div>
      ) : !info ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          No business info yet. Click "Sync from Google" to pull data.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-1">
            <Field label="Business Name" icon={Building2} value={info.title} editKey="title" />
            <Field label="Description" icon={MessageSquare} value={info.description} editKey="description" multiline />
            <Field label="Phone" icon={Phone} value={info.primary_phone} editKey="primary_phone" type="tel" />
            <Field label="Website" icon={Globe} value={info.website_uri} editKey="website_uri" type="url" />
            <Field label="Primary Category" icon={TrendingUp} value={info.primary_category_display_name ?? info.primary_category_name} />
            <Field
              label="Address"
              icon={MapPin}
              value={info.address
                ? [info.address.addressLines?.join(', '), info.address.locality, info.address.postalCode].filter(Boolean).join(', ')
                : null}
            />
            <div className="flex items-start gap-3 py-3">
              <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <BarChart3 className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
                  info.open_for_business === 'OPEN'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200')}>
                  {info.open_for_business === 'OPEN' ? 'Open for Business' : (info.open_for_business ?? 'Unknown')}
                </span>
              </div>
            </div>
          </div>

          {info.regular_hours.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <button
                onClick={() => setHoursOpen(h => !h)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Regular Hours
                </div>
                {hoursOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {hoursOpen && (
                <div className="px-4 pb-3 space-y-1.5 border-t border-gray-50">
                  {info.regular_hours.map((h, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-gray-500 w-28">{h.openDay}</span>
                      <span className="text-gray-900 font-medium">{h.openTime} – {h.closeTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main GMB Page ─────────────────────────────────────────────────────────────

type Tab = 'reviews' | 'posts' | 'insights' | 'info'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'reviews',  label: 'Reviews' },
  { id: 'posts',    label: 'Posts' },
  { id: 'insights', label: 'Insights' },
  { id: 'info',     label: 'Business Info' },
]

// ── Share Link Modal ──────────────────────────────────────────────────────────
// Defined at module level to prevent focus loss issues on re-render

function ShareLinkModal({
  url,
  onClose,
}: {
  url: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  function copyUrl() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Link2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Share connect link</h3>
            <p className="text-xs text-gray-500">Send this to your client — valid for 7 days</p>
          </div>
        </div>

        {/* Steps */}
        <ol className="mb-5 space-y-2 text-[13px] text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">1</span>
            Copy the link below and send it to your client via WhatsApp or email
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">2</span>
            Client opens the link and clicks "Connect with Google"
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">3</span>
            They authorize access — you can then manage their profile from this page
          </li>
        </ol>

        {/* URL box + copy */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-[11px] text-gray-700 truncate select-all">
            {url}
          </div>
          <button
            onClick={copyUrl}
            className={cn(
              'flex items-center gap-1.5 h-10 px-4 rounded-lg text-xs font-semibold transition-all shrink-0',
              copied
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-blue-600 text-white hover:bg-blue-700',
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <p className="mt-4 text-[11px] text-gray-400 text-center">
          The client does not need a VyapaarGrow account · Secured by HMAC-signed state
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function GmbPage({
  initialClients,
  initialStatuses,
  initialClientId,
  initialTab,
  justConnected,
  connectError,
}: {
  initialClients: Client[]
  initialStatuses: GmbConnectionStatus[]
  initialClientId: string | null
  initialTab: string
  justConnected: boolean
  connectError: string | null
}) {
  const [statuses, setStatuses] = useState<GmbConnectionStatus[]>(initialStatuses)
  const [selectedId, setSelectedId] = useState<string | null>(
    initialClientId ?? initialClients[0]?.id ?? null,
  )
  const [activeTab, setActiveTab] = useState<Tab>(
    (TABS.find(t => t.id === initialTab)?.id) ?? 'reviews',
  )
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [shareLinking, setShareLinking] = useState(false)
  const [shareLinkUrl, setShareLinkUrl] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(
    justConnected ? { type: 'success', msg: 'Google Business Profile connected successfully!' }
    : connectError  ? { type: 'error',   msg: `Connection failed: ${connectError}` }
    : null,
  )
  const router = useRouter()

  const selectedClient = initialClients.find(c => c.id === selectedId)
  const selectedStatus = statuses.find(s => s.client_id === selectedId)

  async function handleConnect() {
    if (!selectedId) return
    setConnecting(true)
    const res = await fetch('/api/gmb/connect', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: selectedId }),
    })
    const json = await res.json() as { ok: boolean; authUrl?: string; error?: string }
    if (json.ok && json.authUrl) {
      window.location.href = json.authUrl
    } else {
      setBanner({ type: 'error', msg: json.error ?? 'Failed to start connection' })
      setConnecting(false)
    }
  }

  async function handleShareLink() {
    if (!selectedId) return
    setShareLinking(true)
    const res = await fetch('/api/gmb/invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: selectedId }),
    })
    const json = await res.json() as { ok: boolean; url?: string; error?: string }
    if (json.ok && json.url) {
      setShareLinkUrl(json.url)
    } else {
      setBanner({ type: 'error', msg: json.error ?? 'Failed to generate link' })
    }
    setShareLinking(false)
  }

  async function handleDisconnect() {
    if (!selectedId || !confirm('Disconnect this client from Google Business Profile?')) return
    setDisconnecting(true)
    const res = await fetch('/api/gmb/connect', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: selectedId }),
    })
    const json = await res.json() as { ok: boolean }
    if (json.ok) {
      setStatuses(prev => prev.map(s => s.client_id === selectedId
        ? { ...s, is_connected: false, google_email: null, location_title: null }
        : s))
      router.refresh()
    }
    setDisconnecting(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {shareLinkUrl && (
        <ShareLinkModal url={shareLinkUrl} onClose={() => setShareLinkUrl(null)} />
      )}

      <Header title="GMB Connect" subtitle="Manage Google Business Profiles for your clients" />

      {banner && (
        <div className={cn(
          'mx-5 mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm border',
          banner.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800',
        )}>
          {banner.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span className="flex-1">{banner.msg}</span>
          <button onClick={() => setBanner(null)} className="text-current opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Client list sidebar */}
        <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Clients</p>
          </div>
          <div className="py-1">
            {initialClients.map(client => {
              const status = statuses.find(s => s.client_id === client.id)
              const connected = status?.is_connected ?? false
              const active = selectedId === client.id
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedId(client.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    active ? 'bg-blue-50' : 'hover:bg-gray-50',
                  )}
                >
                  <ClientAvatar client={client} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-semibold truncate', active ? 'text-blue-700' : 'text-gray-900')}>
                      {client.business_name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{client.area ?? client.city}</p>
                  </div>
                  <span className={cn('h-2 w-2 rounded-full shrink-0', connected ? 'bg-green-500' : 'bg-gray-300')} />
                </button>
              )
            })}
            {initialClients.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">No clients yet.</p>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-5">
          {!selectedClient ? (
            <div className="text-center py-20 text-gray-400">
              <Wifi className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Select a client to manage their GMB profile</p>
            </div>
          ) : (
            <div className="max-w-3xl space-y-5">
              {/* Client header + connection status */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <ClientAvatar client={selectedClient} size="2xl" className="rounded-xl" />
                    <div>
                      <h2 className="text-base font-bold text-gray-900">{selectedClient.business_name}</h2>
                      <p className="text-sm text-gray-400">{selectedClient.area ? `${selectedClient.area}, ` : ''}{selectedClient.city}</p>
                    </div>
                  </div>

                  {selectedStatus?.is_connected ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs font-semibold text-green-700">Connected</span>
                        </div>
                        {selectedStatus.google_email && (
                          <p className="text-[11px] text-gray-400">{selectedStatus.google_email}</p>
                        )}
                        {selectedStatus.location_title && (
                          <p className="text-[11px] text-gray-500 font-medium">{selectedStatus.location_title}</p>
                        )}
                      </div>
                      <button onClick={handleDisconnect} disabled={disconnecting}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                        <WifiOff className="h-3.5 w-3.5" />
                        {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-gray-300" />
                      <span className="text-xs text-gray-500">Not connected</span>
                    </div>
                  )}
                </div>

                {!selectedStatus?.is_connected && (
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Option A — Send link to client */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-800">Share link with client</span>
                      </div>
                      <p className="text-[11.5px] text-blue-700 mb-3 leading-relaxed">
                        Generate a secure link and send it to your client — they connect their own Google account in one click.
                      </p>
                      <button
                        onClick={handleShareLink}
                        disabled={shareLinking}
                        className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        {shareLinking ? 'Generating…' : 'Generate Link'}
                      </button>
                    </div>

                    {/* Option B — Agency connects directly */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Wifi className="h-4 w-4 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">Agency connects directly</span>
                      </div>
                      <p className="text-[11.5px] text-gray-500 mb-3 leading-relaxed">
                        Use agency credentials or a Google account with access to this listing.
                      </p>
                      <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        <Wifi className="h-3.5 w-3.5" />
                        {connecting ? 'Redirecting…' : 'Connect directly'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs — only shown when connected */}
              {selectedStatus?.is_connected && (
                <>
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    {TABS.map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'flex-1 h-8 rounded-lg text-xs font-medium transition-colors',
                          activeTab === tab.id
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700',
                        )}>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'reviews' && (
                    <ReviewsTab clientId={selectedId!} syncedAt={selectedStatus.reviews_synced_at} />
                  )}
                  {activeTab === 'posts' && (
                    <PostsTab clientId={selectedId!} syncedAt={selectedStatus.posts_synced_at} />
                  )}
                  {activeTab === 'insights' && (
                    <InsightsTab clientId={selectedId!} syncedAt={selectedStatus.insights_synced_at} />
                  )}
                  {activeTab === 'info' && (
                    <BusinessInfoTab clientId={selectedId!} syncedAt={selectedStatus.info_synced_at} />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
