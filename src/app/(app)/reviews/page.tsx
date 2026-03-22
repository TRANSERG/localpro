import { getClients, getReviews } from '@/lib/db'
import { readAllAnalytics } from '@/lib/review-analytics'
import ReviewsPage from './client'

export default async function Page() {
  const [reviews, clients] = await Promise.all([getReviews(), getClients()])
  const analytics = await readAllAnalytics(clients.map(c => c.id))
  return <ReviewsPage initialReviews={reviews} initialClients={clients} initialAnalytics={analytics} />
}
