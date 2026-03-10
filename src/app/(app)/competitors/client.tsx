'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Client, Competitor } from '@/types'
import { cn, getInitials } from '@/lib/utils'
import { Plus, Star, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function CompetitorsPage({
  initialCompetitors,
  initialClients,
}: {
  initialCompetitors: Competitor[]
  initialClients: Client[]
}) {
  const [clientFilter, setClientFilter] = useState('All')
  const filtered = initialCompetitors.filter(c => clientFilter === 'All' || c.client_id === clientFilter)
  const getClient = (id: string) => initialClients.find(c => c.id === id)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Competitor Tracker"
        subtitle="Track top 3 competitors per client"
        actions={
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Add Competitor
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex gap-3">
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">All Clients</option>
            {initialClients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          {filtered.map(comp => {
            const client = getClient(comp.client_id)
            const vsRank = comp.our_client_ranking && comp.ranking_position ? comp.our_client_ranking - comp.ranking_position : null
            return (
              <div key={comp.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {client && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-6 w-6 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: client.color_tag ?? '#3b82f6' }}>
                          {getInitials(client.business_name)}
                        </div>
                        <span className="text-xs font-semibold text-gray-500">{client.business_name}</span>
                      </div>
                    )}
                    <h3 className="text-base font-bold text-gray-900">{comp.competitor_name}</h3>
                    {comp.gbp_link && (
                      <a href={comp.gbp_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                        <ExternalLink className="h-3 w-3" /> View GBP
                      </a>
                    )}
                  </div>
                  <div className="flex gap-6 text-center shrink-0">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{comp.review_count ?? '—'}</p>
                      <p className="text-[10px] text-gray-500">Reviews</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-0.5 justify-center">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-lg font-bold text-gray-900">{comp.average_rating ?? '—'}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">Avg Rating</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">#{comp.ranking_position ?? '—'}</p>
                      <p className="text-[10px] text-gray-500">Their Rank</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">#{comp.our_client_ranking ?? '—'}</p>
                      <p className="text-[10px] text-gray-500">Our Rank</p>
                    </div>
                    {vsRank !== null && (
                      <div>
                        <div className={cn('flex items-center gap-1 justify-center text-lg font-bold', vsRank < 0 ? 'text-green-600' : vsRank > 0 ? 'text-red-600' : 'text-gray-400')}>
                          {vsRank < 0 ? <TrendingUp className="h-4 w-4" /> : vsRank > 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                          {Math.abs(vsRank)}
                        </div>
                        <p className="text-[10px] text-gray-500">vs Us</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {comp.strengths && (
                    <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                      <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider mb-1">Their Strengths</p>
                      <p className="text-xs text-gray-700">{comp.strengths}</p>
                    </div>
                  )}
                  {comp.weaknesses && (
                    <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2">
                      <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1">Their Weaknesses</p>
                      <p className="text-xs text-gray-700">{comp.weaknesses}</p>
                    </div>
                  )}
                </div>
                {comp.last_checked_date && (
                  <p className="text-[10px] text-gray-400 mt-3">Last checked: {comp.last_checked_date}</p>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
              {initialCompetitors.length === 0 ? 'No competitors tracked yet. Add your first competitor!' : 'No competitors for selected client.'}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
