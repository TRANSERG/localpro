'use client'
import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Client, Keyword, KEYWORD_TYPES } from '@/types'
import { cn, getStatusClasses } from '@/lib/utils'
import { ClientAvatar } from '@/components/ui/client-avatar'
import { Check, Plus, TrendingUp, Filter, Tag, Sparkles, X, Loader2, AlertCircle } from 'lucide-react'

// ── Sub-components ────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number | null }) {
  if (!rank) return <span className="text-gray-400 text-xs">—</span>
  const color =
    rank <= 3 ? 'text-green-600 bg-green-50 border-green-200' :
    rank <= 10 ? 'text-yellow-700 bg-yellow-50 border-yellow-200' :
    'text-red-600 bg-red-50 border-red-200'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold border', color)}>
      #{rank}
    </span>
  )
}

function VolumeBar({ volume, max }: { volume: number | null; max: number }) {
  if (!volume || !max) return <span className="text-gray-400 text-xs">—</span>
  const pct = Math.round((volume / max) * 100)
  const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-gray-400'
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
        <div className={cn('h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 tabular-nums whitespace-nowrap">
        {volume.toLocaleString('en-IN')}<span className="text-gray-400 font-normal">/mo</span>
      </span>
    </div>
  )
}

function SelectionToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={active ? 'Deselect keyword' : 'Select keyword'}
      className={cn(
        'h-5 w-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
        active ? 'bg-blue-600 border-blue-600 shadow-sm' : 'bg-white border-gray-300 hover:border-blue-400'
      )}
    >
      {active && <Check className="h-3 w-3 text-white stroke-[3]" />}
    </button>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Suggestion {
  keyword: string
  keyword_type: string
  monthly_search_volume: number
  competition: 'Low' | 'Medium' | 'High'
  priority: 'High' | 'Medium' | 'Low'
}

// ── Main component ────────────────────────────────────────────────────────────

export default function KeywordsPage({
  initialKeywords,
  initialClients,
}: {
  initialKeywords: Keyword[]
  initialClients: Client[]
}) {
  // Main keyword list (starts from server data, grows when suggestions are added)
  const [keywords, setKeywords] = useState<Keyword[]>(initialKeywords)

  // View state
  const [activeClientId, setActiveClientId] = useState<string>(initialClients[0]?.id ?? 'all')
  const [typeFilter, setTypeFilter] = useState('All')

  // Owner selections
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialKeywords.filter(k => k.is_selected).map(k => k.id))
  )

  // Suggest modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [suggestClientId, setSuggestClientId] = useState<string>(initialClients[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestError, setSuggestError] = useState('')
  const [checked, setChecked] = useState<Set<number>>(new Set())

  // ── Actions ───────────────────────────────────────────────────────────────

  const toggleKeyword = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const openModal = () => {
    // Pre-select the active client if one is selected
    if (activeClientId !== 'all') setSuggestClientId(activeClientId)
    setSuggestions([])
    setSuggestError('')
    setChecked(new Set())
    setModalOpen(true)
  }

  const generateSuggestions = async () => {
    if (!suggestClientId) return
    setLoading(true)
    setSuggestions([])
    setSuggestError('')
    setChecked(new Set())

    try {
      const res = await fetch('/api/keywords/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: suggestClientId }),
      })
      const data = await res.json()

      if (!data.ok) {
        setSuggestError(data.error ?? 'Failed to generate suggestions.')
      } else {
        setSuggestions(data.suggestions)
        // Pre-check all suggestions
        setChecked(new Set(data.suggestions.map((_: Suggestion, i: number) => i)))
      }
    } catch {
      setSuggestError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleChecked = (i: number) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const addSelected = () => {
    const toAdd = suggestions.filter((_, i) => checked.has(i))
    const existing = new Set(keywords.map(k => k.keyword.toLowerCase()))

    const newKeywords: Keyword[] = toAdd
      .filter(s => !existing.has(s.keyword.toLowerCase()))
      .map((s, i) => ({
        id: `ai-${Date.now()}-${i}`,
        client_id: suggestClientId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        keyword: s.keyword,
        keyword_type: s.keyword_type,
        monthly_search_volume: s.monthly_search_volume,
        competition: s.competition,
        priority: s.priority,
        used_in_gbp: false,
        used_on_website: false,
        current_ranking: null,
        target_ranking: null,
        last_updated: null,
        notes: null,
        is_selected: false,
      }))

    setKeywords(prev => [...prev, ...newKeywords])
    // Switch to that client's tab so they can see the new keywords
    setActiveClientId(suggestClientId)
    setModalOpen(false)
    setSuggestions([])
    setChecked(new Set())
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const clientKeywords = useMemo(() => {
    return keywords
      .filter(k => {
        const matchClient = activeClientId === 'all' || k.client_id === activeClientId
        const matchType = typeFilter === 'All' || k.keyword_type === typeFilter
        return matchClient && matchType
      })
      .sort((a, b) => (b.monthly_search_volume ?? 0) - (a.monthly_search_volume ?? 0))
  }, [keywords, activeClientId, typeFilter])

  const maxVolume = useMemo(
    () => Math.max(...clientKeywords.map(k => k.monthly_search_volume ?? 0), 1),
    [clientKeywords]
  )

  const selectedInView = clientKeywords.filter(k => selected.has(k.id))
  const totalSelectedVolume = selectedInView.reduce((sum, k) => sum + (k.monthly_search_volume ?? 0), 0)

  const getClient = (id: string) => initialClients.find(c => c.id === id)

  const countByClient = useMemo(() => {
    const map: Record<string, { total: number; selected: number }> = {}
    for (const k of keywords) {
      if (!map[k.client_id]) map[k.client_id] = { total: 0, selected: 0 }
      map[k.client_id].total++
      if (selected.has(k.id)) map[k.client_id].selected++
    }
    return map
  }, [keywords, selected])

  const suggestMaxVolume = useMemo(
    () => Math.max(...suggestions.map(s => s.monthly_search_volume ?? 0), 1),
    [suggestions]
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Keyword Planner"
        subtitle="Review traffic demand and select keywords to target per client"
        actions={
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            <Sparkles className="h-3.5 w-3.5" /> Suggest with AI
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Client Tabs */}
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setActiveClientId('all')}
            className={cn(
              'h-9 px-4 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap',
              activeClientId === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            All Clients
          </button>
          {initialClients.map(c => {
            const counts = countByClient[c.id] ?? { total: 0, selected: 0 }
            const isActive = activeClientId === c.id
            return (
              <button
                key={c.id}
                onClick={() => setActiveClientId(c.id)}
                className={cn(
                  'flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium border transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                <ClientAvatar client={c} size="sm" />
                <span className="hidden sm:block whitespace-nowrap">{c.business_name}</span>
                <span className={cn(
                  'text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center',
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                )}>
                  {counts.selected}/{counts.total}
                </span>
              </button>
            )
          })}
        </div>

        {/* Stats + Filter row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <Check className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">
              {selectedInView.length} of {clientKeywords.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-green-700">
              {totalSelectedVolume.toLocaleString('en-IN')}/mo selected traffic
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Types</option>
              {KEYWORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Keyword Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {clientKeywords.length === 0 ? (
            <div className="py-16 text-center">
              <Tag className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No keywords yet.</p>
              <button
                onClick={openModal}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Sparkles className="h-3.5 w-3.5" /> Suggest keywords with AI
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-10">
                      <span className="sr-only">Select</span>
                    </th>
                    {activeClientId === 'all' && (
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    )}
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Keyword</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Traffic Demand</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Competition</th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Ranking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clientKeywords.map(kw => {
                    const isSelected = selected.has(kw.id)
                    const client = getClient(kw.client_id)
                    return (
                      <tr
                        key={kw.id}
                        className={cn(
                          'transition-colors',
                          isSelected ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-gray-50/50'
                        )}
                      >
                        <td className="px-4 py-3">
                          <SelectionToggle active={isSelected} onClick={() => toggleKeyword(kw.id)} />
                        </td>
                        {activeClientId === 'all' && (
                          <td className="px-4 py-3">
                            {client && (
                              <div className="flex items-center gap-2">
                                <ClientAvatar client={client} size="sm" />
                                <span className="text-xs text-gray-600 hidden xl:block truncate max-w-[6rem]">
                                  {client.business_name}
                                </span>
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className={cn('font-medium', isSelected ? 'text-gray-900' : 'text-gray-600')}>
                            {kw.keyword}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 whitespace-nowrap">
                            {kw.keyword_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <VolumeBar volume={kw.monthly_search_volume} max={maxVolume} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                            getStatusClasses(kw.competition ?? 'Medium')
                          )}>
                            {kw.competition}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <RankBadge rank={kw.current_ranking} />
                            {kw.current_ranking && kw.target_ranking && (
                              <span className="text-[10px] text-gray-400">→ #{kw.target_ranking}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-gray-400 px-1">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-6 bg-green-500 rounded-full" />
            <span>High demand</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-6 bg-blue-500 rounded-full" />
            <span>Medium demand</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-6 bg-gray-400 rounded-full" />
            <span>Lower demand</span>
          </div>
          <span className="ml-auto">Sorted by monthly search volume ↓</span>
        </div>
      </main>

      {/* ── AI Suggest Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setModalOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">AI Keyword Suggestions</p>
                  <p className="text-xs text-gray-500">Powered by Gemini · Indian market data</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                disabled={loading}
                className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Client selector + Generate */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <select
                value={suggestClientId}
                onChange={e => { setSuggestClientId(e.target.value); setSuggestions([]); setSuggestError('') }}
                disabled={loading}
                className="flex-1 h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select a client…</option>
                {initialClients.map(c => (
                  <option key={c.id} value={c.id}>{c.business_name}</option>
                ))}
              </select>
              <button
                onClick={generateSuggestions}
                disabled={!suggestClientId || loading}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate</>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-500">Gemini is analysing the business and market…</p>
                </div>
              )}

              {/* Error */}
              {!loading && suggestError && (
                <div className="m-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{suggestError}</p>
                </div>
              )}

              {/* Empty state */}
              {!loading && !suggestError && suggestions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Sparkles className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">Select a client and click Generate to get AI-suggested keywords with traffic estimates.</p>
                </div>
              )}

              {/* Suggestions list */}
              {!loading && suggestions.length > 0 && (
                <>
                  <div className="px-6 py-3 flex items-center justify-between border-b border-gray-50">
                    <span className="text-xs text-gray-500">{suggestions.length} keywords suggested</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setChecked(new Set(suggestions.map((_, i) => i)))}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Select all
                      </button>
                      <button
                        onClick={() => setChecked(new Set())}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {suggestions.map((s, i) => {
                      const isChecked = checked.has(i)
                      return (
                        <div
                          key={i}
                          onClick={() => toggleChecked(i)}
                          className={cn(
                            'flex items-center gap-4 px-6 py-3 cursor-pointer transition-colors',
                            isChecked ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-gray-50/50'
                          )}
                        >
                          {/* Checkbox */}
                          <div className={cn(
                            'h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                            isChecked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                          )}>
                            {isChecked && <Check className="h-3 w-3 text-white stroke-[3]" />}
                          </div>

                          {/* Keyword */}
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium truncate', isChecked ? 'text-gray-900' : 'text-gray-600')}>
                              {s.keyword}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                                {s.keyword_type}
                              </span>
                              <span className={cn(
                                'text-[10px] rounded-full px-1.5 py-0.5 border font-medium',
                                getStatusClasses(s.competition)
                              )}>
                                {s.competition}
                              </span>
                              <span className={cn(
                                'text-[10px] rounded-full px-1.5 py-0.5 border font-medium',
                                getStatusClasses(s.priority)
                              )}>
                                {s.priority} priority
                              </span>
                            </div>
                          </div>

                          {/* Volume */}
                          <div className="flex-shrink-0">
                            <VolumeBar volume={s.monthly_search_volume} max={suggestMaxVolume} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {suggestions.length > 0 && !loading && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400">
                  {checked.size} of {suggestions.length} selected · Keywords will be added to the planner
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addSelected}
                    disabled={checked.size === 0}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    Add {checked.size} keyword{checked.size !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
