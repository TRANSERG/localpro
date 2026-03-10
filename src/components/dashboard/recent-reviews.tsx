'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, ChevronRight } from 'lucide-react'
import { Review } from '@/types/database'
import { mockClients } from '@/lib/mock-data'
import { format } from 'date-fns'

interface RecentReviewsProps {
  reviews: Review[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  )
}

export function RecentReviews({ reviews }: RecentReviewsProps) {
  const getClientName = (clientId: string) =>
    mockClients.find((c) => c.id === clientId)?.business_name ?? 'Unknown'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Reviews</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">Latest across all clients</p>
        </div>
        <Link href="/reviews" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg border border-gray-100 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-gray-500">{getClientName(review.client_id)}</p>
                <p className="text-sm font-semibold text-gray-900">{review.reviewer_name}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StarRating rating={review.rating} />
                <span className="text-xs text-gray-400">
                  {format(new Date(review.review_date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
            {review.review_text && (
              <p className="text-xs text-gray-600 line-clamp-2">{review.review_text}</p>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={review.responded ? 'success' : 'danger'}>
                {review.responded ? 'Responded' : 'Needs Response'}
              </Badge>
              {review.sentiment && (
                <Badge
                  variant={
                    review.sentiment === 'positive'
                      ? 'success'
                      : review.sentiment === 'negative'
                      ? 'danger'
                      : 'muted'
                  }
                >
                  {review.sentiment}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
