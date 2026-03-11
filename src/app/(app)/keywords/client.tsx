'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Client, Keyword, KEYWORD_TYPES } from '@/types'
import { cn, getStatusClasses } from '@/lib/utils'
import { ClientAvatar } from '@/components/ui/client-avatar'
import { Plus, Check, X as XIcon } from 'lucide-react'

function RankBadge({ rank }: { rank: number | null }) {
  if (!rank) return <span className="text-gray-400 text-xs">—</span>
  const color = rank <= 3 ? 'text-green-600 bg-green-50 border-green-200' : rank <= 10 ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : 'text-red-600 bg-red-50 border-red-200'
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold border', color)}>#{rank}</span>
}

export default function KeywordsPage({
  initialKeywords,
  initialClients,
}: {
  initialKeywords: Keyword[]
  initialClients: Client[]
}) {
  const [clientFilter, setClientFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')

  const filtered = initialKeywords.filter(k => {
    const matchClient = clientFilter === 'All' || k.client_id === clientFilter
    const matchType = typeFilter === 'All' || k.keyword_type === typeFilter
    return matchClient && matchType
  })

  const getClient = (id: string) => initialClients.find(c => c.id === id)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Keyword Tracker"
        subtitle={`${initialKeywords.length} keywords tracked across ${initialClients.length} clients`}
        actions={
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> Add Keyword
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex gap-3 flex-wrap">
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">All Clients</option>
            {initialClients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="All">All Types</option>
            {KEYWORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="ml-auto text-xs text-gray-500 self-center">{filtered.length} keywords</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              {initialKeywords.length === 0 ? 'No keywords tracked yet. Add your first keyword!' : 'No keywords match your filters.'}
            </div>
          ) : (
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {['Client', 'Keyword', 'Type', 'Volume/mo', 'Competition', 'Priority', 'In GBP', 'On Website', 'Current', 'Target', 'Updated'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(kw => {
                  const client = getClient(kw.client_id)
                  return (
                    <tr key={kw.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        {client && (
                          <div className="flex items-center gap-2">
                            <ClientAvatar client={client} size="sm" />
                            <span className="text-xs text-gray-600 hidden xl:block truncate max-w-24">{client.business_name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{kw.keyword}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{kw.keyword_type}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{kw.monthly_search_volume?.toLocaleString('en-IN') ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border', getStatusClasses(kw.competition ?? 'Medium'))}>
                          {kw.competition}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border', getStatusClasses(kw.priority ?? 'Medium'))}>
                          {kw.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">{kw.used_in_gbp ? <Check className="h-4 w-4 text-green-500" /> : <XIcon className="h-4 w-4 text-gray-300" />}</td>
                      <td className="px-4 py-3">{kw.used_on_website ? <Check className="h-4 w-4 text-green-500" /> : <XIcon className="h-4 w-4 text-gray-300" />}</td>
                      <td className="px-4 py-3"><RankBadge rank={kw.current_ranking} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">#{kw.target_ranking ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{kw.last_updated ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
