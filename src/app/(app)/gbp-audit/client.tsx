'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Client, GBPAuditItem, GBPAuditResponse } from '@/types'
import { cn, getStatusClasses } from '@/lib/utils'
import { ClientAvatar } from '@/components/ui/client-avatar'
import { CheckCircle2, Circle, Clock, ChevronDown } from 'lucide-react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

type AuditStatus = 'Done' | 'In Progress' | 'Pending'

const STATUS_ICONS: Record<AuditStatus, React.ReactNode> = {
  Done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  'In Progress': <Clock className="h-4 w-4 text-blue-500" />,
  Pending: <Circle className="h-4 w-4 text-gray-300" />,
}

const STATUS_ORDER: AuditStatus[] = ['Pending', 'In Progress', 'Done']

// Build a lookup: clientId -> itemId -> status
type AuditMap = Record<string, Record<string, AuditStatus>>

function buildAuditMap(responses: GBPAuditResponse[]): AuditMap {
  const map: AuditMap = {}
  for (const r of responses) {
    if (!map[r.client_id]) map[r.client_id] = {}
    map[r.client_id][r.audit_item_id] = r.status as AuditStatus
  }
  return map
}

// Group audit items by section
function groupBySection(items: GBPAuditItem[]) {
  const groups: Record<string, GBPAuditItem[]> = {}
  for (const item of items) {
    if (!groups[item.section]) groups[item.section] = []
    groups[item.section].push(item)
  }
  return groups
}

export default function GBPAuditPage({
  initialClients,
  initialAuditItems,
  initialResponses,
}: {
  initialClients: Client[]
  initialAuditItems: GBPAuditItem[]
  initialResponses: GBPAuditResponse[]
}) {
  const [auditMap, setAuditMap] = useState<AuditMap>(() => buildAuditMap(initialResponses))
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id ?? '')
  const [expandedSection, setExpandedSection] = useState<string | null>(Object.keys(groupBySection(initialAuditItems))[0] ?? null)

  const client = initialClients.find(c => c.id === selectedClientId)
  const sections = groupBySection(initialAuditItems)
  const clientData = auditMap[selectedClientId] ?? {}

  async function cycleStatus(auditItemId: string) {
    const current = clientData[auditItemId] ?? 'Pending'
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]

    // Optimistic update
    setAuditMap(prev => ({
      ...prev,
      [selectedClientId]: { ...prev[selectedClientId], [auditItemId]: next },
    }))

    // Persist to Supabase (upsert gbp_audit_responses)
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('gbp_audit_responses')
      .upsert(
        {
          client_id: selectedClientId,
          audit_item_id: auditItemId,
          status: next,
          priority: 'Medium',
        },
        { onConflict: 'client_id,audit_item_id' }
      )

    if (error) {
      // Roll back on failure
      setAuditMap(prev => ({
        ...prev,
        [selectedClientId]: { ...prev[selectedClientId], [auditItemId]: current },
      }))
    }
  }

  function getScore(clientId: string) {
    const cd = auditMap[clientId] ?? {}
    const allItems = initialAuditItems
    const done = allItems.filter(i => cd[i.id] === 'Done').length
    return { done, total: allItems.length, pct: allItems.length ? Math.round((done / allItems.length) * 100) : 0 }
  }

  const { done, total, pct } = getScore(selectedClientId)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="GBP Audit Checklist" subtitle="Track Google Business Profile completeness per client" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* Client list */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 lg:w-52 lg:shrink-0 scrollbar-hide">
            {initialClients.map(c => {
              const { pct: pctC } = getScore(c.id)
              return (
                <button key={c.id} onClick={() => setSelectedClientId(c.id)}
                  className={cn('shrink-0 text-left rounded-xl p-3 border transition-colors min-w-[150px] lg:min-w-0 lg:w-full', selectedClientId === c.id ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200')}>
                  <div className="flex items-center gap-2">
                    <ClientAvatar client={c} size="md" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{c.business_name}</p>
                      <p className={cn('text-[10px] font-medium', pctC >= 75 ? 'text-green-600' : pctC >= 50 ? 'text-yellow-600' : 'text-red-600')}>{pctC}% complete</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Audit content */}
          {initialAuditItems.length === 0 ? (
            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
              No audit items found in database. Run the schema SQL to seed the 29 audit items.
            </div>
          ) : (
            <div className="flex-1 space-y-3 min-w-0">
              {/* Score header */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-gray-900">
                      {client && <span style={{ color: client.color_tag ?? '#3b82f6' }}>● </span>}
                      {client?.business_name ?? 'Select a client'}
                    </p>
                    <span className={cn('text-sm font-bold', pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600')}>{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-500')} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{done} of {total} tasks complete</p>
                </div>
                <div className="flex gap-4 text-center shrink-0">
                  {(['Done', 'In Progress', 'Pending'] as AuditStatus[]).map(s => {
                    const count = initialAuditItems.filter(i => (clientData[i.id] ?? 'Pending') === s).length
                    return (
                      <div key={s}>
                        <p className={cn('text-lg font-bold', s === 'Done' ? 'text-green-600' : s === 'In Progress' ? 'text-blue-600' : 'text-gray-400')}>{count}</p>
                        <p className="text-[10px] text-gray-500">{s}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Sections */}
              {Object.entries(sections).map(([sectionName, items]) => (
                <div key={sectionName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expandedSection === sectionName ? null : sectionName)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{sectionName}</span>
                      <span className="text-xs text-gray-400">
                        ({items.filter(i => (clientData[i.id] ?? 'Pending') === 'Done').length}/{items.length})
                      </span>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', expandedSection === sectionName && 'rotate-180')} />
                  </button>
                  {expandedSection === sectionName && (
                    <div className="divide-y divide-gray-50 border-t border-gray-100">
                      {items.map(item => {
                        const status = clientData[item.id] ?? 'Pending'
                        return (
                          <div key={item.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50">
                            <div className="flex items-center gap-3">
                              <button onClick={() => cycleStatus(item.id)} className="shrink-0">
                                {STATUS_ICONS[status]}
                              </button>
                              <span className={cn('text-sm', status === 'Done' ? 'text-gray-500 line-through' : 'text-gray-800')}>{item.task_name}</span>
                            </div>
                            <button onClick={() => cycleStatus(item.id)}
                              className={cn('text-[11px] font-medium rounded-full px-2.5 py-0.5 border shrink-0', getStatusClasses(status))}>
                              {status}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
