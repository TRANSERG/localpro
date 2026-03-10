import { getClients } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import GmbPage from './client'
import type { GmbConnectionStatus } from '@/types'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; tab?: string; gmb_connected?: string; gmb_error?: string }>
}) {
  const sp = await searchParams
  const [clients, tokenRows] = await Promise.all([
    getClients(),
    (async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('gmb_tokens')
        .select('client_id, google_email, location_title, reviews_synced_at, posts_synced_at, insights_synced_at, info_synced_at')
      return data ?? []
    })(),
  ])

  // Build a lookup of connection statuses
  const tokenMap = new Map(tokenRows.map(r => [r.client_id, r]))
  const connectionStatuses: GmbConnectionStatus[] = clients.map(c => {
    const t = tokenMap.get(c.id)
    return {
      client_id:          c.id,
      is_connected:       !!t,
      google_email:       t?.google_email ?? null,
      location_title:     t?.location_title ?? null,
      reviews_synced_at:  t?.reviews_synced_at ?? null,
      posts_synced_at:    t?.posts_synced_at ?? null,
      insights_synced_at: t?.insights_synced_at ?? null,
      info_synced_at:     t?.info_synced_at ?? null,
    }
  })

  return (
    <GmbPage
      initialClients={clients}
      initialStatuses={connectionStatuses}
      initialClientId={sp.client ?? null}
      initialTab={sp.tab ?? 'reviews'}
      justConnected={sp.gmb_connected === '1'}
      connectError={sp.gmb_error ?? null}
    />
  )
}
