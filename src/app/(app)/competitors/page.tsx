import { getClients, getCompetitors } from '@/lib/db'
import CompetitorsPage from './client'

export default async function Page() {
  const [competitors, clients] = await Promise.all([getCompetitors(), getClients()])
  return <CompetitorsPage initialCompetitors={competitors} initialClients={clients} />
}
