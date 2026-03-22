import { getClients, getBrandingProfiles, getContentIdeas, getContentCalendar, getSOPs } from '@/lib/db'
import { mockClients, mockBrandingProfiles, mockContentIdeas, mockContentCalendar, mockSOPs } from '@/lib/mock-data'
import { getGemConfig } from '@/lib/gem-instructions'
import ContentStudioPage from './client'

export default async function Page() {
  const [clients, brandings, ideas, calendar, sops] = await Promise.all([
    getClients(),
    getBrandingProfiles(),
    getContentIdeas(),
    getContentCalendar(),
    getSOPs(),
  ])

  const resolvedClients = clients.length > 0 ? clients : mockClients
  const resolvedBrandings = brandings.length > 0 ? brandings : mockBrandingProfiles
  const resolvedIdeas = ideas.length > 0 ? ideas : mockContentIdeas
  const rawCalendar = calendar.length > 0 ? calendar : mockContentCalendar
  const resolvedSOPs = sops.length > 0 ? sops : mockSOPs

  // Join ideas into calendar entries (mock data doesn't have joined `idea` like Supabase does)
  const resolvedCalendar = rawCalendar.map(entry => {
    if (entry.idea) return entry
    if (!entry.content_idea_id) return entry
    const idea = resolvedIdeas.find(i => i.id === entry.content_idea_id)
    return idea ? { ...entry, idea } : entry
  })

  // Merge gem_instructions from gem-instructions.ts into brandings (fallback for clients without Supabase gem_instructions)
  const mergedBrandings = resolvedBrandings.map(b => {
    if (b.gem_instructions) return b
    const client = resolvedClients.find(c => c.id === b.client_id)
    if (!client) return b
    const gemConfig = getGemConfig(client.business_name)
    if (gemConfig) {
      return {
        ...b,
        gem_instructions: gemConfig.gemInstructions,
        logo_url: b.logo_url || gemConfig.logoUrl || null,
      }
    }
    return b
  })

  return (
    <ContentStudioPage
      initialClients={resolvedClients}
      initialBrandings={mergedBrandings}
      initialIdeas={resolvedIdeas}
      initialCalendar={resolvedCalendar}
      initialSOPs={resolvedSOPs}
    />
  )
}
