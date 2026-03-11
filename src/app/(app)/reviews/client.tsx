'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Client, ReviewTracker } from '@/types'
import { cn, formatMonthYear } from '@/lib/utils'
import { ClientAvatar } from '@/components/ui/client-avatar'
import { Plus, Star, Check, X as XIcon } from 'lucide-react'

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-400 text-xs">—</span>
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => <Star key={i} className={cn('h-3 w-3', i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200')} />)}
      <span className="text-xs font-semibold text-gray-700 ml-1">{rating}</span>
    </div>
  )
}

export default function ReviewsPage({
  initialReviews,
  initialClients,
}: {
  initialReviews: ReviewTracker[]
  initialClients: Client[]
}) {
  const [clientFilter, setClientFilter] = useState('All')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const filtered = initialReviews.filter(r => {
    const matchClient = clientFilter === 'All' || r.client_id === clientFilter
    const matchMonth = !month || r.month_year === month
    return matchClient && matchMonth
  })

  const getClient = (id: string) => initialClients.find(c => c.id === id)
  const totalNew = filtered.reduce((s, r) => s + r.new_reviews, 0)
  const needsResponse = filtered.filter(r => !r.all_responded).length

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Review Tracker"
        subtitle={`${totalNew} new reviews · ${needsResponse} client${needsResponse !== 1 ? 's' : ''} need response`}
        actions={
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Add Entry
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex gap-3 flex-wrap">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">All Clients</option>
            {initialClients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {['Client', 'Month', 'Start', 'New', 'Total', 'Avg Rating', 'Target', 'All Responded?', 'Request Sent', 'Negative', 'Action Taken'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => {
                const client = getClient(r.client_id)
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      {client && (
                        <div className="flex items-center gap-2">
                          <ClientAvatar client={client} size="md" />
                          <span className="text-xs font-semibold text-gray-900 truncate max-w-28">{client.business_name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatMonthYear(r.month_year)}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{r.reviews_start}</td>
                    <td className="px-4 py-3">
                      <span className={cn('font-bold', r.new_reviews >= 5 ? 'text-green-600' : 'text-yellow-600')}>+{r.new_reviews}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">{r.total_reviews}</td>
                    <td className="px-4 py-3"><Stars rating={r.average_rating} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.target_rating ? `⭐ ${r.target_rating}` : '—'}</td>
                    <td className="px-4 py-3">
                      {r.all_responded
                        ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><Check className="h-3.5 w-3.5" /> Yes</span>
                        : <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><XIcon className="h-3.5 w-3.5" /> No</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.review_request_sent_date ?? '—'}</td>
                    <td className="px-4 py-3">
                      {r.negative_reviews_count > 0
                        ? <span className="text-red-600 font-semibold text-xs">{r.negative_reviews_count}</span>
                        : <span className="text-green-600 text-xs">0</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate">{r.action_on_negatives ?? '—'}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-gray-400 text-sm">
                    {initialReviews.length === 0 ? 'No review entries yet. Add your first entry!' : 'No data for selected filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
