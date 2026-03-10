'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Keyword } from '@/types/database'
import { mockClients } from '@/lib/mock-data'
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KeywordHighlightsProps {
  keywords: Keyword[]
}

export function KeywordHighlights({ keywords }: KeywordHighlightsProps) {
  const getClientName = (clientId: string) =>
    mockClients.find((c) => c.id === clientId)?.business_name ?? 'Unknown'

  const withChange = keywords.map((k) => ({
    ...k,
    change: k.previous_rank !== null && k.current_rank !== null ? k.previous_rank - k.current_rank : 0,
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Keyword Rankings</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">Top tracked keywords</p>
        </div>
        <Link href="/keywords" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {withChange.map((kw) => (
          <div key={kw.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors">
            {/* Rank */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700 shrink-0">
              #{kw.current_rank ?? '—'}
            </div>

            {/* Keyword + client */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{kw.keyword}</p>
              <p className="text-xs text-gray-400 truncate">{getClientName(kw.client_id)}</p>
            </div>

            {/* Change */}
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              kw.change > 0 ? 'text-green-600' : kw.change < 0 ? 'text-red-600' : 'text-gray-400'
            )}>
              {kw.change > 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : kw.change < 0 ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              <span>{kw.change !== 0 ? Math.abs(kw.change) : '—'}</span>
            </div>

            {/* Volume */}
            {kw.search_volume !== null && (
              <div className="text-xs text-gray-400 hidden sm:block w-16 text-right">
                {kw.search_volume.toLocaleString()}/mo
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
