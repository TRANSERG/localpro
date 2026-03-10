import { getClients, getMonthlyReports } from '@/lib/db'
import ReportsPage from './client'

export default async function Page() {
  const [reports, clients] = await Promise.all([getMonthlyReports(), getClients()])
  return <ReportsPage initialReports={reports} initialClients={clients} />
}
