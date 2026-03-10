import { getClients, getGBPSettingsAll } from '@/lib/db'
import GBPSettingsPage from './client'

export default async function Page() {
  const [settings, clients] = await Promise.all([getGBPSettingsAll(), getClients()])
  return <GBPSettingsPage initialSettings={settings} initialClients={clients} />
}
