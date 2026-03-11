'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Client, GBPSettings } from '@/types'
import { cn, formatDate } from '@/lib/utils'
import { ClientAvatar } from '@/components/ui/client-avatar'
import { CheckCircle2, XCircle } from 'lucide-react'

const SETTINGS_FIELDS: { key: keyof GBPSettings; label: string; urlKey?: keyof GBPSettings; detailKey?: keyof GBPSettings }[] = [
  { key: 'utm_tracking', label: 'UTM Tracking Links Set Up' },
  { key: 'google_ads_connected', label: 'Google Ads Connected' },
  { key: 'booking_link_added', label: 'Booking/Appointment Link Added', urlKey: 'booking_url' },
  { key: 'products_section_filled', label: 'Products Section Filled' },
  { key: 'messaging_enabled', label: 'Messaging Enabled' },
  { key: 'messaging_autoreply', label: 'Messaging Auto-Reply Set Up' },
  { key: 'website_linked_verified', label: 'Website Linked & Verified' },
  { key: 'analytics_connected', label: 'Google Analytics Connected' },
  { key: 'search_console_connected', label: 'Google Search Console Connected' },
  { key: 'service_area_defined', label: 'Service Area Defined', detailKey: 'service_area_details' },
  { key: 'attributes_filled', label: 'Attributes Filled (WiFi, parking, etc.)' },
  { key: 'photos_minimum_10', label: 'Photos — Minimum 10 Uploaded' },
  { key: 'category_optimized', label: 'GBP Category Optimized', detailKey: 'gbp_category' },
  { key: 'qa_populated', label: 'Q&A Section Populated' },
  { key: 'short_name_set', label: 'Short Name / GBP URL Customized', urlKey: 'gbp_short_url' },
]

export default function GBPSettingsPage({
  initialSettings,
  initialClients,
}: {
  initialSettings: GBPSettings[]
  initialClients: Client[]
}) {
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id ?? '')
  const settings = initialSettings.find(s => s.client_id === selectedClientId) ?? null
  const client = initialClients.find(c => c.id === selectedClientId)

  const completed = settings ? SETTINGS_FIELDS.filter(f => settings[f.key]).length : 0
  const pct = settings ? Math.round((completed / SETTINGS_FIELDS.length) * 100) : 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Advanced GBP Settings" subtitle="Configuration checklist per client" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* Client list */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 lg:w-52 lg:shrink-0">
            {initialClients.map(c => {
              const s = initialSettings.find(x => x.client_id === c.id)
              const p = s ? Math.round((SETTINGS_FIELDS.filter(f => s[f.key]).length / SETTINGS_FIELDS.length) * 100) : 0
              return (
                <button key={c.id} onClick={() => setSelectedClientId(c.id)}
                  className={cn('shrink-0 text-left rounded-xl p-3 border transition-colors min-w-[150px] lg:min-w-0 lg:w-full', selectedClientId === c.id ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200')}>
                  <div className="flex items-center gap-2">
                    <ClientAvatar client={c} size="md" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{c.business_name}</p>
                      <p className={cn('text-[10px] font-medium', p >= 75 ? 'text-green-600' : p >= 50 ? 'text-yellow-600' : 'text-red-600')}>{p}% configured</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Settings */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* Score */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900">{client?.business_name ?? 'Select a client'} — GBP Settings</p>
                <span className={cn('text-sm font-bold', pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600')}>{pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className={cn('h-full rounded-full', pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-500')} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{completed} of {SETTINGS_FIELDS.length} settings configured</p>
              {settings?.last_settings_review && (
                <p className="text-xs text-gray-400 mt-1">Last reviewed: {formatDate(settings.last_settings_review)}</p>
              )}
            </div>

            {settings ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {SETTINGS_FIELDS.map(field => {
                    const val = settings[field.key]
                    const detail = field.detailKey ? settings[field.detailKey] : null
                    const url = field.urlKey ? settings[field.urlKey] : null
                    return (
                      <div key={field.key} className={cn('flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50', val ? '' : 'opacity-70')}>
                        {val ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-gray-300 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{field.label}</p>
                          {detail && typeof detail === 'string' && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
                          {url && typeof url === 'string' && <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-0.5 block truncate">{url}</a>}
                        </div>
                        <span className={cn('text-[11px] font-medium rounded-full px-2.5 py-0.5 border shrink-0', val ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200')}>
                          {val ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                {initialClients.length === 0 ? 'No clients yet.' : 'No GBP settings record for this client yet.'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
