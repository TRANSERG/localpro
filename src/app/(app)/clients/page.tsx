import { getClients, getProfiles } from '@/lib/db'
import ClientsPage from './client'

export default async function Page() {
  const [clients, profiles] = await Promise.all([getClients(), getProfiles()])
  return <ClientsPage initialClients={clients} initialProfiles={profiles} />
}
