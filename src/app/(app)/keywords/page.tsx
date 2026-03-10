import { getClients, getKeywords } from '@/lib/db'
import KeywordsPage from './client'

export default async function Page() {
  const [keywords, clients] = await Promise.all([getKeywords(), getClients()])
  return <KeywordsPage initialKeywords={keywords} initialClients={clients} />
}
