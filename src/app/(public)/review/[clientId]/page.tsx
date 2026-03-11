import { getMockClient } from '@/lib/mock-data'
import { ReviewClient } from './review-client'

interface PublicClientInfo {
  id: string
  business_name: string
  business_type: string | null
  area: string | null
  city: string | null
  color_tag: string | null
  google_review_url: string | null
  language_preference: string | null
  branding_logo_url?: string | null
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params

  // Try mock data first (dev mode)
  const mockClient = getMockClient(clientId)
  if (mockClient) {
    const info: PublicClientInfo = {
      id: mockClient.id,
      business_name: mockClient.business_name,
      business_type: mockClient.business_type,
      area: mockClient.area,
      city: mockClient.city,
      color_tag: mockClient.color_tag,
      google_review_url: mockClient.google_review_url,
      language_preference: mockClient.language_preference,
      branding_logo_url: mockClient.branding_logo_url,
    }
    return <ReviewClient client={info} />
  }

  // Fetch from Supabase (anon client)
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data: raw } = await supabase
      .from('clients')
      .select('id, business_name, business_type, area, city, color_tag, google_review_url, language_preference, branding_profiles(logo_url)')
      .eq('id', clientId)
      .eq('is_active', true)
      .single()

    if (raw) {
      const bp = Array.isArray(raw.branding_profiles) ? raw.branding_profiles[0] : (raw.branding_profiles ?? null)
      const client: PublicClientInfo = {
        ...raw,
        branding_logo_url: (bp as { logo_url?: string | null } | null)?.logo_url ?? null,
      }
      return <ReviewClient client={client} />
    }
  } catch {
    // Supabase not configured — fall through to not-found
  }

  return <ReviewClient client={null} />
}
