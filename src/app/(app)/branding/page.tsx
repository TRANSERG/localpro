import { getClients, getBrandingProfiles } from '@/lib/db'
import BrandingPage from './client'

export default async function Page() {
  const [brandings, clients] = await Promise.all([getBrandingProfiles(), getClients()])
  return <BrandingPage initialBrandings={brandings} initialClients={clients} />
}
