'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { SOP } from '@/types'
import { cn } from '@/lib/utils'
import { BookOpen, ChevronDown } from 'lucide-react'

const CATEGORIES = ['All', 'GBP', 'SEO', 'Reviews', 'Reporting', 'Onboarding', 'Content']
const CAT_COLORS: Record<string, string> = {
  GBP: 'bg-blue-50 text-blue-700',
  SEO: 'bg-purple-50 text-purple-700',
  Reviews: 'bg-yellow-50 text-yellow-700',
  Reporting: 'bg-green-50 text-green-700',
  Onboarding: 'bg-orange-50 text-orange-700',
  Content: 'bg-pink-50 text-pink-700',
}

// Fallback hardcoded SOPs used when DB is empty
const FALLBACK_SOPS: SOP[] = [
  { id: '1', created_at: '', updated_at: '', sort_order: 1, title: 'GBP Optimization Process', category: 'GBP', content: `1. Claim & verify the GBP listing\n2. Fill 100% of business info (name, category, hours, phone, address, website)\n3. Write a keyword-rich 750-char description\n4. Add secondary categories (up to 9)\n5. Upload minimum 10 photos (logo, cover, interior, exterior, team, products)\n6. Enable messaging & set auto-reply\n7. Add all services with descriptions\n8. Fill Q&A section with 5+ common questions\n9. Set up short name/URL\n10. Create first GBP post` },
  { id: '2', created_at: '', updated_at: '', sort_order: 2, title: 'Keyword Research Steps', category: 'SEO', content: `1. Open Google Maps — search "business type in Pune" — note autocomplete suggestions\n2. Open Google Search — note People Also Ask and related searches\n3. Use Google Keyword Planner — enter seed keywords — export volume data\n4. Use Ubersuggest — check competition level\n5. Categorize keywords: Service+Location, Near Me, Best/Top, Affordable, etc.\n6. Prioritize: High volume + Low competition first\n7. Add to keyword tracker and mark which are used in GBP and website` },
  { id: '3', created_at: '', updated_at: '', sort_order: 3, title: 'Review Request Script (WhatsApp)', category: 'Reviews', content: `Hi [Client Name] 😊\n\nThank you for choosing [Business Name]! We hope you had a great experience.\n\nWe would be really grateful if you could take 2 minutes to leave us a Google review — it helps us a lot!\n\n👉 [Review Link]\n\nThank you so much! 🙏` },
  { id: '4', created_at: '', updated_at: '', sort_order: 4, title: 'Monthly Reporting Process', category: 'Reporting', content: `1. Log into GBP dashboard — note views, calls, clicks, direction requests\n2. Compare with previous month — calculate % change\n3. Check review count and avg rating\n4. Pull keyword rankings from tracker\n5. Fill monthly report tab in VyapaarGrow\n6. Calculate performance score\n7. Prepare PDF/screenshot summary\n8. Send to client via WhatsApp or email\n9. Mark "Report Sent" in tracker` },
  { id: '5', created_at: '', updated_at: '', sort_order: 5, title: 'Client Onboarding — First 7 Days', category: 'Onboarding', content: `Day 1: Collect all login credentials (GBP, website, social)\nDay 1: Add client to VyapaarGrow — fill full profile\nDay 2: Access GBP — do initial audit checklist\nDay 2: Note current review count and avg rating (baseline)\nDay 3: Keyword research — add 15–20 keywords to tracker\nDay 4: Set up tracking — UTM links, GA, Search Console\nDay 5: Fix all high-priority audit gaps\nDay 6: Upload optimized photos (logo, cover, team, services)\nDay 7: Publish first GBP post + send review request to 5 past customers` },
  { id: '6', created_at: '', updated_at: '', sort_order: 6, title: 'Posting Best Practices', category: 'Content', content: `✅ Post 2–3 times per week\n✅ Use real photos (not stock)\n✅ Include keywords naturally in caption\n✅ Add a clear CTA (Call Now / Book Now / Visit Us)\n✅ Use the Offer post type for promotions\n✅ Post behind-the-scenes content for trust\n✅ Respond to all reviews within 24 hours\n\n❌ Do not post blurry or low-quality images\n❌ Do not use ALL CAPS\n❌ Do not ignore negative reviews` },
  { id: '7', created_at: '', updated_at: '', sort_order: 7, title: 'Handling Negative Reviews', category: 'Reviews', content: `1. Respond within 24 hours — always\n2. Stay calm and professional — never argue\n3. Acknowledge the experience: "We're sorry to hear..."\n4. Offer to resolve: "Please contact us at [phone]"\n5. Take the conversation offline (DM or call)\n6. If resolved, politely ask if they would update the review\n7. If fake — report to Google using "Flag as inappropriate"\n8. Log in Review Tracker under "Action Taken"` },
  { id: '8', created_at: '', updated_at: '', sort_order: 8, title: 'Citation Building Steps', category: 'SEO', content: `Submit to these directories for Pune local businesses:\n1. Justdial — justdial.com (most important for India)\n2. Sulekha — sulekha.com\n3. IndiaMart — indiamart.com\n4. Bing Places — bingplaces.com\n5. Apple Maps — mapsconnect.apple.com\n6. Facebook Business Page\n7. Yelp India — yelp.com\n8. Yellow Pages India\n\nEnsure NAP (Name, Address, Phone) is IDENTICAL across all listings.` },
]

export default function SOPsPage({ initialSops }: { initialSops: SOP[] }) {
  // Use DB data if available, otherwise fall back to hardcoded SOPs
  const sops = initialSops.length > 0 ? initialSops : FALLBACK_SOPS
  const [cat, setCat] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(sops[0]?.id ?? null)

  // Build dynamic category list from actual data
  const categories = ['All', ...Array.from(new Set(sops.map(s => s.category).filter(Boolean) as string[]))]
  const displayCategories = CATEGORIES.filter(c => c === 'All' || categories.includes(c))

  const filtered = sops.filter(s => cat === 'All' || s.category === cat)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="SOPs & Reference" subtitle="Internal knowledge base for the team" />
      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {displayCategories.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={cn('h-8 px-3 rounded-lg text-xs font-medium border transition-colors', cat === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}>
              {c}
            </button>
          ))}
        </div>

        {/* SOP list */}
        <div className="space-y-2">
          {filtered.map(sop => (
            <div key={sop.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === sop.id ? null : sop.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50"
              >
                <BookOpen className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="flex-1 text-sm font-semibold text-gray-900">{sop.title}</span>
                {sop.category && (
                  <span className={cn('text-[11px] font-medium rounded-full px-2 py-0.5', CAT_COLORS[sop.category] ?? 'bg-gray-100 text-gray-600')}>{sop.category}</span>
                )}
                <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform shrink-0', expanded === sop.id && 'rotate-180')} />
              </button>
              {expanded === sop.id && sop.content && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <pre className="text-sm text-gray-700 font-sans whitespace-pre-wrap leading-relaxed">{sop.content}</pre>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
              No SOPs in this category.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
