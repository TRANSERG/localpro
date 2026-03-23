'use client'
import { useState, useMemo } from 'react'
import type { ContentCalendarEntry, ContentIdea, ContentPlatform } from '@/types'
import { PlatformBadge, StatusBadge } from './platform-badge'
import { ChevronLeft, ChevronRight, X, Sparkles, CalendarPlus, Loader2, RefreshCw, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, format,
  addMonths, subMonths, parseISO, isSameDay,
} from 'date-fns'

interface CalendarTabProps {
  clientId: string
  calendar: ContentCalendarEntry[]
  approvedIdeas: ContentIdea[]
  monthYear: string
  onMonthChange: (monthYear: string) => void
  onCalendarChange: (calendar: ContentCalendarEntry[]) => void
  onGenerateForEntry: (entry: ContentCalendarEntry) => void
  onGenerateMonthPlan: () => void
  onNewIdea: (idea: ContentIdea) => void
  generatingPlan: boolean
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border-l-gray-400',
  generated: 'bg-amber-50 text-amber-800 border-l-amber-500',
  approved: 'bg-blue-50 text-blue-800 border-l-blue-500',
  published: 'bg-green-50 text-green-800 border-l-green-500',
}

const STATUS_DOTS: Record<string, string> = {
  draft: 'bg-gray-400',
  generated: 'bg-amber-500',
  approved: 'bg-blue-500',
  published: 'bg-green-500',
}

export function CalendarTab({
  clientId,
  calendar,
  approvedIdeas,
  monthYear,
  onMonthChange,
  onCalendarChange,
  onGenerateForEntry,
  onGenerateMonthPlan,
  onNewIdea,
  generatingPlan,
}: CalendarTabProps) {
  const [entryModal, setEntryModal] = useState<{
    open: boolean
    date?: string
    entry?: ContentCalendarEntry
  }>({ open: false })

  const currentDate = useMemo(() => parseISO(monthYear + '-01'), [monthYear])
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDayOfWeek = getDay(monthStart)

  const padStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

  function navigateMonth(direction: 'prev' | 'next') {
    const newDate = direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1)
    onMonthChange(format(newDate, 'yyyy-MM'))
  }

  function getEntriesForDay(date: Date): ContentCalendarEntry[] {
    const dateStr = format(date, 'yyyy-MM-dd')
    return calendar.filter(e => e.scheduled_date === dateStr)
  }

  async function handleSaveEntry(data: {
    content_idea_id: string | null
    scheduled_date: string
    platform: ContentPlatform
    notes: string
    customIdea?: { title: string; description: string }
  }) {
    const month_year = data.scheduled_date.substring(0, 7)
    const ts = Date.now()

    // If a custom/suggested idea was provided, create a temp idea and register it
    let linkedIdea: ContentIdea | undefined = data.content_idea_id
      ? approvedIdeas.find(i => i.id === data.content_idea_id)
      : undefined

    if (data.customIdea && !linkedIdea) {
      const tempIdea: ContentIdea = {
        id: `temp_idea_modal_${ts}`,
        client_id: clientId,
        title: data.customIdea.title,
        description: data.customIdea.description,
        post_type: 'Custom',
        content_pillar: '',
        keywords_used: [],
        platform: [data.platform],
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ai_generated: true,
        notes: null,
      }
      linkedIdea = tempIdea
      data = { ...data, content_idea_id: tempIdea.id }
      onNewIdea(tempIdea)
    }

    if (entryModal.entry) {
      let saved = false
      try {
        const res = await fetch('/api/content/calendar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: entryModal.entry.id, ...data, month_year }),
        })
        const json = await res.json()
        if (json.ok && json.data) {
          const updated = linkedIdea ? { ...json.data, idea: linkedIdea } : json.data
          onCalendarChange(calendar.map(e => e.id === entryModal.entry!.id ? updated : e))
          saved = true
        }
      } catch { /* Supabase unavailable */ }
      if (!saved) {
        onCalendarChange(calendar.map(e =>
          e.id === entryModal.entry!.id
            ? { ...e, ...data, month_year, ...(linkedIdea ? { idea: linkedIdea } : {}) }
            : e,
        ))
      }
    } else {
      let saved = false
      try {
        const res = await fetch('/api/content/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, ...data, month_year, status: 'draft' }),
        })
        const json = await res.json()
        if (json.ok && json.data) {
          const created = linkedIdea ? { ...json.data, idea: linkedIdea } : json.data
          onCalendarChange([...calendar, created])
          saved = true
        }
      } catch { /* Supabase unavailable */ }
      if (!saved) {
        const tempEntry: ContentCalendarEntry = {
          id: `temp_${ts}`,
          client_id: clientId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'draft',
          caption: null, hashtags: null, image_url: null, image_prompt: null, image_ratio: null,
          ...data,
          month_year,
          ...(linkedIdea ? { idea: linkedIdea } : {}),
        }
        onCalendarChange([...calendar, tempEntry])
      }
    }
    setEntryModal({ open: false })
  }

  async function handleDeleteEntry(id: string) {
    try {
      await fetch(`/api/content/calendar?id=${id}`, { method: 'DELETE' })
    } catch { /* ignore */ }
    onCalendarChange(calendar.filter(e => e.id !== id))
  }

  const totalEntries = calendar.length

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => navigateMonth('prev')} className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <h3 className="text-sm font-bold text-gray-900">{format(currentDate, 'MMMM yyyy')}</h3>
          {totalEntries > 0 && (
            <p className="text-[10px] text-gray-500 mt-0.5">
              {totalEntries} post{totalEntries !== 1 ? 's' : ''} scheduled
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onGenerateMonthPlan}
            disabled={generatingPlan}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {generatingPlan
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating plan…</>
              : <><Sparkles className="h-3.5 w-3.5" /> Generate Month Plan</>
            }
          </button>
          <button onClick={() => navigateMonth('next')} className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1">
        {Object.entries(STATUS_DOTS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn('h-2 w-2 rounded-full', color)} />
            <span className="text-[10px] text-gray-500 capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="px-2 py-2.5 text-[11px] font-semibold text-gray-500 text-center">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: padStart }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[96px] border-b border-r border-gray-100 bg-gray-50/50" />
          ))}

          {days.map(day => {
            const entries = getEntriesForDay(day)
            const isToday = isSameDay(day, new Date())
            const hasEntries = entries.length > 0
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[96px] border-b border-r border-gray-100 p-1.5 cursor-pointer hover:bg-blue-50/40 transition-colors relative',
                  isToday && 'bg-blue-50/60',
                  hasEntries && !isToday && 'bg-white',
                )}
                onClick={() => setEntryModal({ open: true, date: format(day, 'yyyy-MM-dd') })}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={cn(
                    'text-[11px] font-medium px-1.5 py-0.5 rounded-md',
                    isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-500',
                  )}>
                    {format(day, 'd')}
                  </div>
                  {hasEntries && (
                    <div className="flex gap-0.5">
                      {entries.map(entry => (
                        <div key={entry.id} className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOTS[entry.status] ?? STATUS_DOTS.draft)} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  {entries.map(entry => (
                    <div
                      key={entry.id}
                      onClick={e => { e.stopPropagation(); setEntryModal({ open: true, entry }) }}
                      className={cn(
                        'rounded-md px-1.5 py-1 text-[10px] font-medium truncate cursor-pointer border-l-2 transition-colors hover:opacity-80',
                        STATUS_COLORS[entry.status] ?? STATUS_COLORS.draft,
                      )}
                      title={entry.idea?.title ?? entry.notes ?? entry.platform}
                    >
                      <span className="font-semibold">{entry.platform.slice(0, 2)}</span>
                      {' '}
                      {entry.idea?.title ?? entry.notes ?? 'Untitled post'}
                    </div>
                  ))}
                </div>

                {!hasEntries && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <CalendarPlus className="h-4 w-4 text-gray-300" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {totalEntries === 0 && (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <CalendarPlus className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">No posts scheduled this month</p>
          <p className="text-xs text-gray-400 mt-1">Click on any date to schedule a post</p>
        </div>
      )}

      {entryModal.open && (
        <CalendarEntryModal
          entry={entryModal.entry}
          prefillDate={entryModal.date}
          clientId={clientId}
          approvedIdeas={approvedIdeas}
          onSave={handleSaveEntry}
          onDelete={entryModal.entry ? () => handleDeleteEntry(entryModal.entry!.id) : undefined}
          onGenerate={entryModal.entry ? () => { onGenerateForEntry(entryModal.entry!); setEntryModal({ open: false }) } : undefined}
          onClose={() => setEntryModal({ open: false })}
        />
      )}
    </div>
  )
}

// ─── Calendar Entry Modal ──────────────────────────────────────────────────

type IdeaMode = 'bank' | 'suggestions' | 'custom'

interface SuggestedIdea { title: string; description: string }

function CalendarEntryModal({
  entry,
  prefillDate,
  clientId,
  approvedIdeas,
  onSave,
  onDelete,
  onGenerate,
  onClose,
}: {
  entry?: ContentCalendarEntry
  prefillDate?: string
  clientId: string
  approvedIdeas: ContentIdea[]
  onSave: (data: { content_idea_id: string | null; scheduled_date: string; platform: ContentPlatform; image_ratio: string; notes: string; customIdea?: { title: string; description: string } }) => void
  onDelete?: () => void
  onGenerate?: () => void
  onClose: () => void
}) {
  const RATIOS = [
    { value: '1:1',  label: '1:1',  hint: 'Square' },
    { value: '3:4',  label: '4:5',  hint: 'Portrait' },
    { value: '9:16', label: '9:16', hint: 'Story' },
    { value: '16:9', label: '16:9', hint: 'Landscape' },
    { value: '4:3',  label: '4:3',  hint: 'Wide' },
  ] as const
  const PLATFORM_DEFAULT_RATIO: Record<string, string> = {
    Instagram: '3:4', Facebook: '4:3', GBP: '1:1', WhatsApp: '9:16',
  }

  const [ideaMode, setIdeaMode] = useState<IdeaMode>('bank')
  const [ideaId, setIdeaId] = useState(entry?.content_idea_id ?? '')
  const [date, setDate] = useState(entry?.scheduled_date ?? prefillDate ?? '')
  const [platform, setPlatform] = useState<ContentPlatform>(entry?.platform ?? 'Instagram')
  const [imageRatio, setImageRatio] = useState(entry?.image_ratio ?? PLATFORM_DEFAULT_RATIO[entry?.platform ?? 'Instagram'] ?? '3:4')
  const [notes, setNotes] = useState(entry?.notes ?? '')

  // AI suggestions state
  const [suggestions, setSuggestions] = useState<SuggestedIdea[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestedIdea | null>(null)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)

  // Custom prompt state
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')

  const platforms: ContentPlatform[] = ['Instagram', 'Facebook', 'GBP', 'WhatsApp']
  const selectedIdea = approvedIdeas.find(i => i.id === ideaId)

  async function fetchSuggestions() {
    setLoadingSuggestions(true)
    setSuggestions([])
    setSelectedSuggestion(null)
    setSuggestionError(null)
    try {
      const res = await fetch('/api/content/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, count: 5 }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setSuggestions((json.ideas as Array<{ title: string; description: string }>).map(i => ({
        title: i.title,
        description: i.description ?? '',
      })))
    } catch (err) {
      setSuggestionError(err instanceof Error ? err.message : 'Failed to fetch suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  function handleSave() {
    if (ideaMode === 'bank') {
      onSave({ content_idea_id: ideaId || null, scheduled_date: date, platform, image_ratio: imageRatio, notes })
    } else if (ideaMode === 'suggestions' && selectedSuggestion) {
      onSave({ content_idea_id: null, scheduled_date: date, platform, image_ratio: imageRatio, notes, customIdea: selectedSuggestion })
    } else if (ideaMode === 'custom' && customTitle.trim()) {
      onSave({ content_idea_id: null, scheduled_date: date, platform, image_ratio: imageRatio, notes, customIdea: { title: customTitle.trim(), description: customDescription.trim() } })
    }
  }

  const canSave = date && (
    ideaMode === 'bank' ||
    (ideaMode === 'suggestions' && !!selectedSuggestion) ||
    (ideaMode === 'custom' && !!customTitle.trim())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-sm font-bold text-gray-900">{entry ? 'Edit Calendar Entry' : 'Schedule Post'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">

          {/* Idea source tabs */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-2">Post Idea Source</label>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {([
                { key: 'bank', label: 'Idea Bank', icon: null },
                { key: 'suggestions', label: 'AI Suggest', icon: <Sparkles className="h-3 w-3" /> },
                { key: 'custom', label: 'Custom', icon: <PenLine className="h-3 w-3" /> },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setIdeaMode(tab.key)}
                  className={cn(
                    'flex items-center gap-1 flex-1 justify-center py-1.5 rounded-md text-[11px] font-semibold transition-colors',
                    ideaMode === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Idea Bank mode */}
          {ideaMode === 'bank' && (
            <div>
              <select
                value={ideaId}
                onChange={e => setIdeaId(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Choose from idea bank —</option>
                {approvedIdeas.map(idea => (
                  <option key={idea.id} value={idea.id}>{idea.title}</option>
                ))}
              </select>
              {selectedIdea?.description && (
                <p className="mt-2 text-[10px] text-gray-500 bg-gray-50 rounded-md px-2 py-1.5 leading-relaxed">
                  {selectedIdea.description}
                </p>
              )}
            </div>
          )}

          {/* AI Suggestions mode */}
          {ideaMode === 'suggestions' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={fetchSuggestions}
                disabled={loadingSuggestions}
                className="flex items-center gap-2 h-8 px-3 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60 transition-colors"
              >
                {loadingSuggestions
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Getting ideas…</>
                  : <><RefreshCw className="h-3.5 w-3.5" /> {suggestions.length ? 'Regenerate Ideas' : 'Get AI Suggestions'}</>
                }
              </button>

              {suggestionError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{suggestionError}</p>
              )}

              {suggestions.length > 0 && (
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedSuggestion(selectedSuggestion?.title === s.title ? null : s)}
                      className={cn(
                        'rounded-xl border p-3 cursor-pointer transition-all',
                        selectedSuggestion?.title === s.title
                          ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                      )}
                    >
                      <p className="text-xs font-semibold text-gray-900 mb-0.5">{s.title}</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{s.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {!loadingSuggestions && suggestions.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Click "Get AI Suggestions" to see innovative post ideas</p>
              )}
            </div>
          )}

          {/* Custom mode */}
          {ideaMode === 'custom' && (
            <div className="space-y-2">
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="Post title / idea (e.g., Diwali special offer, New product launch…)"
                className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
                placeholder="Optional: Add your own caption draft or key message…"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Platform selector */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Platform</label>
            <div className="flex gap-2 flex-wrap">
              {platforms.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPlatform(p); if (!entry?.image_ratio) setImageRatio(PLATFORM_DEFAULT_RATIO[p] ?? '3:4') }}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                    platform === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Image Ratio */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Image Ratio</label>
            <div className="flex gap-2 flex-wrap">
              {RATIOS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setImageRatio(r.value)}
                  className={cn(
                    'flex flex-col items-center px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors',
                    imageRatio === r.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300',
                  )}
                >
                  {r.label}
                  <span className={cn('text-[9px] font-normal mt-0.5', imageRatio === r.value ? 'text-blue-200' : 'text-gray-400')}>{r.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {entry && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <StatusBadge status={entry.status} size="md" />
              <PlatformBadge platform={entry.platform} size="sm" />
              {entry.caption && <span className="text-[10px] text-green-600 font-medium">Caption ready</span>}
              {entry.image_url && <span className="text-[10px] text-green-600 font-medium">Image ready</span>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          {onDelete && (
            <button onClick={onDelete} className="h-8 px-3 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50">
              Delete
            </button>
          )}
          {onGenerate && entry?.content_idea_id && (
            <button onClick={onGenerate} className="flex items-center gap-1 h-8 px-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700 hover:bg-amber-100">
              <Sparkles className="h-3 w-3" /> Generate
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="h-8 px-3 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="h-8 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {entry ? 'Update' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}
