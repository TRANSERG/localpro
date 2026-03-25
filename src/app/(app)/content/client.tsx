'use client'
import { useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { ClientAvatar } from '@/components/ui/client-avatar'
import type { Client, BrandingProfile, ContentIdea, ContentCalendarEntry, SOP, ContentPlatform } from '@/types'
import { cn, currentMonthYear } from '@/lib/utils'
import { Calendar, Sparkles, History } from 'lucide-react'
import { CalendarTab } from '@/components/content/calendar-tab'
import { GenerateTab } from '@/components/content/generate-tab'
import { HistoryTab } from '@/components/content/history-tab'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO,
} from 'date-fns'

type Tab = 'calendar' | 'generate' | 'history'

const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: 'calendar', label: 'Content Calendar', icon: Calendar },
  { key: 'generate', label: 'Generate & Preview', icon: Sparkles },
  { key: 'history', label: 'Generation History', icon: History },
]

interface ContentStudioPageProps {
  initialClients: Client[]
  initialBrandings: BrandingProfile[]
  initialIdeas: ContentIdea[]
  initialCalendar: ContentCalendarEntry[]
  initialSOPs: SOP[]
}

/** Returns all dates in the given month */
function getMonthPostDays(monthYear: string): string[] {
  const monthStart = startOfMonth(parseISO(monthYear + '-01'))
  const monthEnd = endOfMonth(monthStart)
  return eachDayOfInterval({ start: monthStart, end: monthEnd })
    .map(d => format(d, 'yyyy-MM-dd'))
}

export default function ContentStudioPage({
  initialClients,
  initialBrandings,
  initialIdeas,
  initialCalendar,
  initialSOPs,
}: ContentStudioPageProps) {
  const [selectedClientId, setSelectedClientId] = useState(initialClients[0]?.id ?? '')
  const [activeTab, setActiveTab] = useState<Tab>('calendar')
  const [allIdeas, setAllIdeas] = useState(initialIdeas)
  const [allCalendar, setAllCalendar] = useState(initialCalendar)
  const [monthYear, setMonthYear] = useState(currentMonthYear())

  // Cross-tab navigation state
  const [prefillEntry, setPrefillEntry] = useState<ContentCalendarEntry | null>(null)
  const [autoGenerate, setAutoGenerate] = useState(false)

  // Month plan generation loading state
  const [generatingPlan, setGeneratingPlan] = useState(false)

  // Derived data
  const branding = initialBrandings.find(b => b.client_id === selectedClientId) ?? null
  const clientIdeas = allIdeas.filter(i => i.client_id === selectedClientId)
  const clientCalendar = allCalendar.filter(e => e.client_id === selectedClientId && e.month_year === monthYear)

  const handleGenerateForEntry = useCallback((entry: ContentCalendarEntry) => {
    setPrefillEntry(entry)
    setAutoGenerate(true)
    setActiveTab('generate')
  }, [])

  async function handleGenerateMonthPlan() {
    setGeneratingPlan(true)
    try {
      const postDaysForCount = getMonthPostDays(monthYear)
      const res = await fetch('/api/content/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClientId, count: postDaysForCount.length }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)

      // Step 1: Batch save ideas to Supabase
      const ideaRows = (json.ideas as ContentIdea[]).map(idea => ({
        title: idea.title,
        description: idea.description ?? null,
        post_type: idea.post_type ?? 'Tips',
        content_pillar: idea.content_pillar ?? null,
        keywords_used: idea.keywords_used ?? [],
        platform: idea.platform ?? ['Instagram'],
        status: 'approved' as const,
        ai_generated: true,
        notes: idea.notes ?? null,
      }))

      const ideasRes = await fetch('/api/content/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: selectedClientId, ideas: ideaRows }),
      })
      const ideasJson = await ideasRes.json()

      // Step 2: Use real UUIDs if saved, else fallback to temp IDs
      let savedIdeas: ContentIdea[]
      if (ideasJson.ok && ideasJson.data) {
        savedIdeas = ideasJson.data
      } else {
        console.error('Ideas save failed, using temp IDs:', ideasJson.error)
        const ts = Date.now()
        savedIdeas = ideaRows.map((idea, i) => ({
          ...idea,
          id: `temp_idea_${ts}_${i}`,
          client_id: selectedClientId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })) as ContentIdea[]
      }

      setAllIdeas(prev => [
        ...prev.filter(i => i.client_id !== selectedClientId),
        ...savedIdeas,
      ])

      // Step 3: Build calendar entries with real idea IDs, then batch save
      const postDays = postDaysForCount
      const PLATFORM_DEFAULT_RATIO: Record<string, string> = {
        Instagram: '3:4', Facebook: '4:3', GBP: '1:1', WhatsApp: '9:16',
      }
      const entryRows = savedIdeas.slice(0, postDays.length).map((idea, i) => {
        const plat = (idea.platform?.[0] ?? 'Instagram') as ContentPlatform
        return {
          content_idea_id: idea.id,
          scheduled_date: postDays[i],
          month_year: monthYear,
          platform: plat,
          image_ratio: PLATFORM_DEFAULT_RATIO[plat] ?? '3:4',
          status: 'draft' as const,
        }
      })

      const calRes = await fetch('/api/content/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: selectedClientId, entries: entryRows }),
      })
      const calJson = await calRes.json()

      // Step 4: Use real UUIDs if saved, else fallback to temp IDs
      let savedEntries: ContentCalendarEntry[]
      if (calJson.ok && calJson.data) {
        savedEntries = calJson.data
      } else {
        console.error('Calendar save failed, using temp IDs:', calJson.error)
        const ts = Date.now()
        savedEntries = savedIdeas.slice(0, postDays.length).map((idea, i) => ({
          id: `temp_entry_${ts}_${i}`,
          client_id: selectedClientId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          content_idea_id: idea.id,
          scheduled_date: postDays[i],
          month_year: monthYear,
          platform: (idea.platform?.[0] ?? 'Instagram') as ContentPlatform,
          status: 'draft' as const,
          notes: null, caption: null, hashtags: null, image_url: null, image_prompt: null, image_ratio: PLATFORM_DEFAULT_RATIO[(idea.platform?.[0] ?? 'Instagram')] ?? '3:4',
          idea,
        }))
      }

      setAllCalendar(prev => [
        ...prev.filter(e => !(e.client_id === selectedClientId && e.month_year === monthYear)),
        ...savedEntries,
      ])
    } catch (err) {
      console.error('Generate month plan error:', err)
    } finally {
      setGeneratingPlan(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Content Studio"
        subtitle="Create, plan, and generate content for your clients"
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* Client list */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 lg:w-52 lg:shrink-0">
            {initialClients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClientId(c.id)}
                className={cn(
                  'shrink-0 text-left rounded-xl p-3 border transition-colors min-w-[150px] lg:min-w-0 lg:w-full',
                  selectedClientId === c.id
                    ? 'bg-white border-blue-200 shadow-sm'
                    : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200',
                )}
              >
                <div className="flex items-center gap-2">
                  <ClientAvatar client={c} size="md" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{c.business_name}</p>
                    <p className="text-[10px] text-gray-500">{allCalendar.filter(e => e.client_id === c.id && e.month_year === monthYear).length} scheduled</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Main content area */}
          <div className="flex-1 space-y-4 min-w-0">
            {/* Tab bar */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex-1 justify-center',
                    activeTab === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'calendar' && (
              <CalendarTab
                clientId={selectedClientId}
                calendar={clientCalendar}
                approvedIdeas={clientIdeas.filter(i => i.status === 'approved')}
                monthYear={monthYear}
                onMonthChange={setMonthYear}
                onCalendarChange={newCalendar => {
                  setAllCalendar(prev => [
                    ...newCalendar,
                    ...prev.filter(e => !(e.client_id === selectedClientId && e.month_year === monthYear)),
                  ])
                }}
                onGenerateForEntry={handleGenerateForEntry}
                onGenerateMonthPlan={handleGenerateMonthPlan}
                onNewIdea={idea => setAllIdeas(prev => [...prev, idea])}
                generatingPlan={generatingPlan}
              />
            )}

            {activeTab === 'generate' && (
              <GenerateTab
                clientId={selectedClientId}
                ideas={clientIdeas}
                calendar={clientCalendar}
                prefillEntry={prefillEntry}
                branding={branding}
                sops={initialSOPs}
                autoGenerate={autoGenerate}
                onAutoGenerateDone={() => setAutoGenerate(false)}
                onCalendarChange={newCalendar => {
                  setAllCalendar(prev => [
                    ...newCalendar,
                    ...prev.filter(e => !(e.client_id === selectedClientId && e.month_year === monthYear)),
                  ])
                }}
              />
            )}
            {activeTab === 'history' && (
              <HistoryTab
                clientId={selectedClientId}
                calendar={allCalendar.filter(e => e.client_id === selectedClientId)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
