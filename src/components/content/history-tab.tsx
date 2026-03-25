'use client'
import { useState, useMemo } from 'react'
import type { ContentCalendarEntry, ContentPlatform } from '@/types'
import { PlatformBadge, StatusBadge } from './platform-badge'
import { History, LayoutGrid, List, X, Copy, Check, Download, ImageIcon, Eye, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const RATIO_CLASS: Record<string, string> = {
  '1:1':  'aspect-square',
  '3:4':  'aspect-[3/4]',
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-[16/9]',
  '4:3':  'aspect-[4/3]',
}

const STATUS_OPTIONS = ['all', 'generated', 'approved', 'published'] as const
const PLATFORM_OPTIONS = ['all', 'Instagram', 'Facebook', 'GBP', 'WhatsApp'] as const

interface HistoryTabProps {
  clientId: string
  calendar: ContentCalendarEntry[]
}

export function HistoryTab({ clientId, calendar }: HistoryTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [detailEntry, setDetailEntry] = useState<ContentCalendarEntry | null>(null)

  // Only show non-draft entries (things that have been generated)
  const allGenerated = useMemo(
    () => calendar.filter(e => e.status !== 'draft'),
    [calendar],
  )

  const filtered = useMemo(() => {
    return allGenerated
      .filter(e => statusFilter === 'all' || e.status === statusFilter)
      .filter(e => platformFilter === 'all' || e.platform === platformFilter)
      .filter(e => {
        if (!dateFrom && !dateTo) return true
        const d = e.scheduled_date
        if (dateFrom && d < dateFrom) return false
        if (dateTo && d > dateTo) return false
        return true
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [allGenerated, statusFilter, platformFilter, dateFrom, dateTo])

  // Stats
  const stats = useMemo(() => ({
    total: allGenerated.length,
    generated: allGenerated.filter(e => e.status === 'generated').length,
    approved: allGenerated.filter(e => e.status === 'approved').length,
    published: allGenerated.filter(e => e.status === 'published').length,
  }), [allGenerated])

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total', value: stats.total, color: 'bg-gray-50 text-gray-700 border-gray-200' },
          { label: 'Generated', value: stats.generated, color: 'bg-amber-50 text-amber-700 border-amber-200' },
          { label: 'Approved', value: stats.approved, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Published', value: stats.published, color: 'bg-green-50 text-green-700 border-green-200' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-xl border px-4 py-3', s.color)}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[11px] font-medium opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                statusFilter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300',
              )}
            >
              {s === 'all' ? `All (${allGenerated.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${allGenerated.filter(e => e.status === s).length})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-1.5', viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-1.5', viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Platform + Date filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {PLATFORM_OPTIONS.map(p => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-medium border transition-colors',
                platformFilter === p
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300',
              )}
            >
              {p === 'all' ? 'All Platforms' : p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo('') }}
              className="h-8 px-2 rounded-lg text-xs text-gray-500 hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <History className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No generated content yet</p>
          <p className="text-xs text-gray-400 mt-1">Generate content from the Calendar tab to see it here</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(entry => (
            <button
              key={entry.id}
              onClick={() => setDetailEntry(entry)}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all text-left"
            >
              {/* Image */}
              {entry.image_url ? (
                <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                  <img
                    src={entry.image_url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-gray-300" />
                </div>
              )}
              {/* Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-500 font-medium">{formatDate(entry.scheduled_date)}</span>
                  <div className="flex gap-1">
                    <PlatformBadge platform={entry.platform} />
                    <StatusBadge status={entry.status} />
                  </div>
                </div>
                {entry.caption && (
                  <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">{entry.caption}</p>
                )}
                {entry.hashtags && (
                  <p className="text-[10px] text-blue-600 font-mono line-clamp-1">{entry.hashtags}</p>
                )}
                <div className="flex items-center gap-1.5">
                  {entry.image_ratio && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{entry.image_ratio}</span>
                  )}
                  {entry.idea?.title && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600 truncate max-w-[140px]">{entry.idea.title}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500 font-medium">
                  <th className="px-3 py-2.5 w-12"></th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Platform</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Caption</th>
                  <th className="px-3 py-2.5">Ratio</th>
                  <th className="px-3 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(entry => (
                  <tr
                    key={entry.id}
                    onClick={() => setDetailEntry(entry)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2">
                      {entry.image_url ? (
                        <img src={entry.image_url} alt="" loading="lazy" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{formatDate(entry.scheduled_date)}</td>
                    <td className="px-3 py-2"><PlatformBadge platform={entry.platform} /></td>
                    <td className="px-3 py-2"><StatusBadge status={entry.status} /></td>
                    <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">{entry.caption ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{entry.image_ratio ?? '—'}</td>
                    <td className="px-3 py-2">
                      <Eye className="h-3.5 w-3.5 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailEntry && (
        <HistoryDetailModal
          entry={detailEntry}
          onClose={() => setDetailEntry(null)}
        />
      )}
    </div>
  )
}

/* ─── Detail Modal ─── */
function HistoryDetailModal({ entry, onClose }: { entry: ContentCalendarEntry; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null)

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  const ratio = entry.image_ratio ?? '3:4'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Content Detail</h2>
            <PlatformBadge platform={entry.platform} size="md" />
            <StatusBadge status={entry.status} size="md" />
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Left — Image */}
          <div>
            {entry.image_url ? (
              <div className={cn(RATIO_CLASS[ratio] ?? 'aspect-square', 'rounded-xl overflow-hidden border border-gray-200 bg-gray-50')}>
                <img src={entry.image_url} alt="Generated" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={cn(RATIO_CLASS[ratio] ?? 'aspect-square', 'rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50')}>
                <ImageIcon className="h-12 w-12 text-gray-300" />
              </div>
            )}
            {entry.image_url && (
              <div className="flex gap-2 mt-3">
                <a
                  href={entry.image_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-3 w-3" /> Download
                </a>
              </div>
            )}
          </div>

          {/* Right — Content */}
          <div className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-[10px] font-medium text-gray-500 uppercase">Date</p>
                <p className="text-sm text-gray-900 font-medium">{formatDate(entry.scheduled_date)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-[10px] font-medium text-gray-500 uppercase">Ratio</p>
                <p className="text-sm text-gray-900 font-medium">{ratio}</p>
              </div>
            </div>

            {/* Idea */}
            {entry.idea && (
              <div className="rounded-lg bg-purple-50 px-3 py-2">
                <p className="text-[10px] font-medium text-purple-500 uppercase">Idea</p>
                <p className="text-sm text-purple-900 font-semibold">{entry.idea.title}</p>
                {entry.idea.description && (
                  <p className="text-xs text-purple-700 mt-0.5">{entry.idea.description}</p>
                )}
              </div>
            )}

            {/* Caption */}
            {entry.caption && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Caption</p>
                  <button
                    onClick={() => handleCopy(entry.caption!, 'caption')}
                    className="flex items-center gap-1 h-6 px-2 rounded text-[10px] font-medium text-gray-500 hover:bg-gray-100"
                  >
                    {copied === 'caption' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    {copied === 'caption' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                  {entry.caption}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {entry.hashtags && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hashtags</p>
                  <button
                    onClick={() => handleCopy(entry.hashtags!, 'hashtags')}
                    className="flex items-center gap-1 h-6 px-2 rounded text-[10px] font-medium text-gray-500 hover:bg-gray-100"
                  >
                    {copied === 'hashtags' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    {copied === 'hashtags' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-blue-600 font-mono">{entry.hashtags}</p>
              </div>
            )}

            {/* Copy All */}
            {entry.caption && (
              <button
                onClick={() => handleCopy(`${entry.caption}\n\n${entry.hashtags ?? ''}`, 'all')}
                className={cn(
                  'w-full h-9 rounded-lg border text-sm font-semibold transition-colors',
                  copied === 'all'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
                )}
              >
                {copied === 'all' ? 'Copied caption + hashtags!' : 'Copy All'}
              </button>
            )}

            {/* Image Prompt */}
            {entry.image_prompt && (
              <details>
                <summary className="cursor-pointer text-[11px] font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <ChevronDown className="h-3 w-3" /> View image prompt
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-[10px] text-gray-600 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {entry.image_prompt}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
