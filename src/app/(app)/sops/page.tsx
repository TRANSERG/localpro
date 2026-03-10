import { getSOPs } from '@/lib/db'
import SOPsPage from './client'

export default async function Page() {
  const sops = await getSOPs()
  return <SOPsPage initialSops={sops} />
}
