'use client'
import { useState } from 'react'
import type { ContentIdea, Client, BrandingProfile } from '@/types'
import { PlatformBadge, StatusBadge } from './platform-badge'
import { Sparkles, Check, X as XIcon, CalendarPlus, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IdeasTabProps {
  clientId: string
  client: Client | undefined
  branding: BrandingProfile | null
  ideas: ContentIdea[]
  onIdeasChange: (ideas: ContentIdea[]) => void
  onScheduleIdea: (idea: ContentIdea) => void
  onGenerateCaption: (idea: ContentIdea) => void
}

export function IdeasTab({
  clientId,
  client,
  branding,
  ideas,
  onIdeasChange,
  onScheduleIdea,
  onGenerateCaption,
}: IdeasTabProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'idea' | 'approved' | 'rejected'>('all')
  const [trendingContext, setTrendingContext] = useState('')

  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.status === filter)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/content/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          count: 8,
          targetDate: new Date().toISOString().slice(0, 10),
          trendingContext: trendingContext.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)

      // Save to DB
      const saveRes = await fetch('/api/content/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          ideas: json.ideas.map((idea: Record<string, unknown>) => ({
            ...idea,
            status: 'idea',
            ai_generated: true,
          })),
        }),
      })
      const saveJson = await saveRes.json()
      if (saveJson.ok && saveJson.data) {
        onIdeasChange([...saveJson.data, ...ideas])
      } else {
        // If DB save fails (e.g. mock mode), add as temp ideas
        const tempIdeas: ContentIdea[] = json.ideas.map((idea: Record<string, unknown>, i: number) => ({
          id: `temp_${Date.now()}_${i}`,
          client_id: clientId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'idea' as const,
          ai_generated: true,
          notes: null,
          ...idea,
        }))
        onIdeasChange([...tempIdeas, ...ideas])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ideas')
    } finally {
      setGenerating(false)
    }
  }

  async function handleStatusChange(id: string, status: 'approved' | 'rejected') {
    try {
      await fetch('/api/content/ideas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
    } catch { /* ignore in mock mode */ }
    onIdeasChange(ideas.map(i => i.id === id ? { ...i, status } : i))
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/content/ideas?id=${id}`, { method: 'DELETE' })
    } catch { /* ignore */ }
    onIdeasChange(ideas.filter(i => i.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(['all', 'idea', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300',
              )}
            >
              {f === 'all' ? `All (${ideas.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${ideas.filter(i => i.status === f).length})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={trendingContext}
            onChange={e => setTrendingContext(e.target.value)}
            placeholder="Trending now? e.g. IPL Finals, Valentine's Week..."
            className="h-9 flex-1 sm:w-56 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !client}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? 'Generating...' : 'Generate Ideas with AI'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Ideas grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">No ideas yet for {client?.business_name ?? 'this client'}</p>
          <p className="text-xs text-gray-400">Click "Generate Ideas with AI" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(idea => (
            <div key={idea.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 leading-snug">{idea.title}</h3>
                <StatusBadge status={idea.status} />
              </div>
              {idea.description && (
                <p className="text-xs text-gray-500 leading-relaxed">{idea.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{idea.post_type}</span>
                {idea.content_pillar && (
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600">{idea.content_pillar}</span>
                )}
                {(idea.platform ?? []).map(p => (
                  <PlatformBadge key={p} platform={p} />
                ))}
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
                {idea.status === 'idea' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(idea.id, 'approved')}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-medium hover:bg-green-100"
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(idea.id, 'rejected')}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-medium hover:bg-red-100"
                    >
                      <XIcon className="h-3 w-3" /> Reject
                    </button>
                  </>
                )}
                {idea.status === 'approved' && (
                  <>
                    <button
                      onClick={() => onScheduleIdea(idea)}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-medium hover:bg-blue-100"
                    >
                      <CalendarPlus className="h-3 w-3" /> Schedule
                    </button>
                    <button
                      onClick={() => onGenerateCaption(idea)}
                      className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-medium hover:bg-amber-100"
                    >
                      <Sparkles className="h-3 w-3" /> Generate
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(idea.id)}
                  className="flex items-center gap-1 h-7 px-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 text-[11px] ml-auto"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}