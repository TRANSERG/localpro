import { getClients, getGBPAuditItems, getGBPAuditResponses } from '@/lib/db'
import GBPAuditPage from './client'

export default async function Page() {
  const [clients, auditItems, responses] = await Promise.all([
    getClients(),
    getGBPAuditItems(),
    getGBPAuditResponses(),
  ])
  return (
    <GBPAuditPage
      initialClients={clients}
      initialAuditItems={auditItems}
      initialResponses={responses}
    />
  )
}
