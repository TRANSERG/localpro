import { getClients, getBrandingProfiles } from '@/lib/db'
import { mockBrandingProfiles } from '@/lib/mock-data'
import BrandingPage from './client'

export default async function Page() {
  const [brandings, clients] = await Promise.all([getBrandingProfiles(), getClients()])
  // Fall back to mock data when Supabase is not yet connected
  const resolvedBrandings = brandings.length > 0 ? brandings : mockBrandingProfiles
  return <BrandingPage initialBrandings={resolvedBrandings} initialClients={clients} />
}
