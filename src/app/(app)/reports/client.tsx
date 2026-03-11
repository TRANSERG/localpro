'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Client, MonthlyReport } from '@/types'
import { cn, formatMonthYear, calcMoM } from '@/lib/utils'
import { ClientAvatar } from '@/components/ui/client-avatar'
import { Plus, TrendingUp, TrendingDown, Phone, Globe, Eye, Navigation, Check } from 'lucide-react'

function MoM({ current, prev }: { current: number | null; prev: number | null }) {
  const pct = calcMoM(current, prev)
  if (pct === null) return <span className="text-gray-400 text-xs">—</span>
  const isPos = pct > 0
  return (
    <div className={cn('flex items-center gap-0.5 text-xs font-medium', isPos ? 'text-green-600' : 'text-red-600')}>
      {isPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPos ? '+' : ''}{pct}%
    </div>
  )
}

export default function ReportsPage({
  initialReports,
  initialClients,
}: {
  initialReports: MonthlyReport[]
  initialClients: Client[]
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [clientFilter, setClientFilter] = useState('All')

  const filtered = initialReports.filter(r =>
    (clientFilter === 'All' || r.client_id === clientFilter) &&
    r.month_year === month
  )
  const getClient = (id: string) => initialClients.find(c => c.id === id)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Monthly Report"
        subtitle="GBP performance metrics per client per month"
        actions={
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Add Report
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

        <div className="space-y-5">
          {filtered.map(report => {
            const client = getClient(report.client_id)
            const score = report.overall_performance_score ?? 0
            const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
            const scoreBg = score >= 75 ? 'bg-green-50' : score >= 50 ? 'bg-yellow-50' : 'bg-red-50'
            return (
              <div key={report.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  {client && (
                    <div className="flex items-center gap-3">
                      <ClientAvatar client={client} size="xl" className="rounded-xl" />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{client.business_name}</p>
                        <p className="text-xs text-gray-500">{formatMonthYear(report.month_year)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className={cn('text-center rounded-xl px-4 py-2', scoreBg)}>
                      <p className={cn('text-xl font-bold', scoreColor)}>{score}%</p>
                      <p className="text-[10px] text-gray-500">Performance</p>
                    </div>
                    {report.report_sent
                      ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1"><Check className="h-3 w-3" /> Report Sent</span>
                      : <span className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-full px-2.5 py-1">Not Sent</span>
                    }
                  </div>
                </div>
                {/* Metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-gray-100 border-b border-gray-100">
                  {[
                    { label: 'Profile Views', val: report.profile_views, prev: report.prev_profile_views, icon: Eye },
                    { label: 'Search Views', val: report.search_views, prev: null, icon: Eye },
                    { label: 'Map Views', val: report.map_views, prev: null, icon: Navigation },
                    { label: 'Total Calls', val: report.total_calls, prev: report.prev_total_calls, icon: Phone },
                    { label: 'Directions', val: report.direction_requests, prev: null, icon: Navigation },
                    { label: 'Website Clicks', val: report.website_clicks, prev: report.prev_website_clicks, icon: Globe },
                  ].map(m => (
                    <div key={m.label} className="p-4 text-center">
                      <p className="text-[10px] text-gray-500 mb-1">{m.label}</p>
                      <p className="text-lg font-bold text-gray-900">{m.val?.toLocaleString('en-IN') ?? '—'}</p>
                      <MoM current={m.val ?? null} prev={m.prev ?? null} />
                    </div>
                  ))}
                </div>
                {/* Reviews + Keyword */}
                <div className="px-6 py-4 flex flex-wrap gap-6 text-sm">
                  <div><p className="text-xs text-gray-500">Total Reviews</p><p className="font-bold text-gray-900">{report.total_reviews ?? '—'}</p></div>
                  <div><p className="text-xs text-gray-500">New Reviews</p><p className="font-bold text-green-600">+{report.new_reviews ?? 0}</p></div>
                  <div><p className="text-xs text-gray-500">Avg Rating</p><p className="font-bold text-gray-900">⭐ {report.average_rating ?? '—'}</p></div>
                  {report.top_keyword && (
                    <div><p className="text-xs text-gray-500">Top Keyword</p><p className="font-medium text-gray-800">{report.top_keyword} <span className="text-blue-600">#{report.top_keyword_ranking}</span></p></div>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
              {initialReports.length === 0 ? 'No reports yet. Add your first monthly report!' : 'No reports for selected period.'}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
