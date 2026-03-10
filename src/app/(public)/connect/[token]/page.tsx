// Public page — no auth required.
// Client receives a magic link, lands here, and connects their Google Business Profile.
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { ConnectClient } from './connect-client'

/** Uses the anon Supabase client — no service role key needed.
 *  RLS policies allow anon to read valid invite tokens and basic client info. */
function getAnonSupabase() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export default async function ConnectPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ success?: string }>
}) {
  const { token } = await params
  const sp = await searchParams
  const isSuccess = sp.success === '1'

  // Thank-you screen doesn't need DB data
  if (isSuccess) {
    return <ConnectClient token={token} state="success" client={null} authUrl={null} />
  }

  const supabase = getAnonSupabase()

  // Validate invite (anon SELECT policy: used_at IS NULL AND expires_at > now())
  const { data: invite } = await supabase
    .from('gmb_connect_invites')
    .select('client_id, used_at, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!invite) {
    return <ConnectClient token={token} state="not_found" client={null} authUrl={null} />
  }
  if (invite.used_at) {
    return <ConnectClient token={token} state="used" client={null} authUrl={null} />
  }
  if (new Date(invite.expires_at) < new Date()) {
    return <ConnectClient token={token} state="expired" client={null} authUrl={null} />
  }

  // Fetch public-safe client info (anon SELECT policy for connect page)
  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name')
    .eq('id', invite.client_id)
    .single()

  if (!client) {
    return <ConnectClient token={token} state="not_found" client={null} authUrl={null} />
  }

  // Build the OAuth URL server-side to keep credentials off the browser
  let authUrl: string | null = null
  try {
    const { generateAuthUrl } = await import('@/lib/gmb')
    authUrl = await generateAuthUrl(invite.client_id, { magicToken: token })
  } catch {
    // Google credentials not yet configured — page still loads, button disabled
  }

  return (
    <ConnectClient
      token={token}
      state="ready"
      client={{ business_name: client.business_name, city: null, color_tag: null }}
      authUrl={authUrl}
    />
  )
}
