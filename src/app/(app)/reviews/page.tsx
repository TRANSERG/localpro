import { getClients, getReviews } from '@/lib/db'
import ReviewsPage from './client'

export default async function Page() {
  const [reviews, clients] = await Promise.all([getReviews(), getClients()])
  return <ReviewsPage initialReviews={reviews} initialClients={clients} />
}
