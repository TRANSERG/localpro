'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Client, BrandingProfile, POST_TYPES, BrandTone } from '@/types'
import { cn, getInitials } from '@/lib/utils'

const BRAND_TONES: BrandTone[] = ['Formal', 'Friendly', 'Bold', 'Playful', 'Professional']

export default function BrandingPage({
  initialBrandings,
  initialClients,
}: {
  initialBrandings: BrandingProfile[]
  initialClients: Client[]
}) {
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id ?? '')
  const branding = initialBrandings.find(b => b.client_id === selectedClientId) ?? null
  const client = initialClients.find(c => c.id === selectedClientId)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Branding & Content" subtitle="Client brand profiles and content guidelines" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* Client list */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 lg:w-52 lg:shrink-0">
            {initialClients.map(c => (
              <button key={c.id} onClick={() => setSelectedClientId(c.id)}
                className={cn('shrink-0 text-left rounded-xl p-3 border transition-colors min-w-[150px] lg:min-w-0 lg:w-full', selectedClientId === c.id ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200')}>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: c.color_tag ?? '#3b82f6' }}>
                    {getInitials(c.business_name)}
                  </div>
                  <p className="text-xs font-semibold text-gray-900 truncate">{c.business_name}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Branding content */}
          <div className="flex-1 space-y-4 min-w-0">
            {branding && client ? (
              <>
                {/* Colors & Tone */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Brand Identity</p>
                  <div className="flex flex-wrap gap-6 items-start">
                    <div>
                      <p className="text-[11px] text-gray-500 mb-2">Primary Color</p>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: branding.primary_color ?? '#3b82f6' }} />
                        <span className="text-xs font-mono text-gray-700">{branding.primary_color ?? '—'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 mb-2">Secondary Color</p>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg border border-gray-200 shadow-sm" style={{ backgroundColor: branding.secondary_color ?? '#93c5fd' }} />
                        <span className="text-xs font-mono text-gray-700">{branding.secondary_color ?? '—'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 mb-2">Brand Tone</p>
                      <div className="flex gap-2 flex-wrap">
                        {BRAND_TONES.map(t => (
                          <span key={t} className={cn('rounded-full px-2.5 py-1 text-[11px] font-medium border', t === branding.brand_tone ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-200')}>{t}</span>
                        ))}
                      </div>
                    </div>
                    {branding.posting_frequency && (
                      <div>
                        <p className="text-[11px] text-gray-500 mb-2">Posting Frequency</p>
                        <p className="text-sm font-bold text-gray-900">{branding.posting_frequency}x / week</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content pillars */}
                {branding.content_pillars?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Content Pillars</p>
                    <div className="flex flex-wrap gap-2">
                      {branding.content_pillars.map((p, i) => (
                        <span key={i} style={{ backgroundColor: `${client.color_tag}15`, color: client.color_tag ?? '#3b82f6', borderColor: `${client.color_tag}30` }}
                          className="rounded-full px-3 py-1 text-xs font-medium border">
                          {i + 1}. {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved post types */}
                {branding.approved_post_types?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Approved Post Types</p>
                    <div className="flex flex-wrap gap-2">
                      {(POST_TYPES as readonly string[]).map(t => (
                        <span key={t} className={cn('rounded-full px-3 py-1 text-xs font-medium border', branding.approved_post_types.includes(t) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200')}>
                          {branding.approved_post_types.includes(t) ? '✓ ' : ''}{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(branding.content_dos || branding.content_donts) && (
                  <div className="grid grid-cols-2 gap-4">
                    {branding.content_dos && (
                      <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">✅ Content Do's</p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{branding.content_dos}</p>
                      </div>
                    )}
                    {branding.content_donts && (
                      <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">❌ Content Don'ts</p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{branding.content_donts}</p>
                      </div>
                    )}
                  </div>
                )}

                {branding.hashtag_bank && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3"># Hashtag Bank</p>
                    <p className="text-sm text-blue-600 font-mono leading-relaxed">{branding.hashtag_bank}</p>
                  </div>
                )}

                {branding.caption_templates && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Caption Templates</p>
                    <pre className="text-sm text-gray-700 font-sans whitespace-pre-line leading-relaxed">{branding.caption_templates}</pre>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
                {initialClients.length === 0
                  ? 'No clients yet. Add clients first.'
                  : 'No branding profile found for this client. Create one to get started.'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
