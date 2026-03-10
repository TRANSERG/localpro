'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClientStat {
  clientId: string
  clientName: string
  avgRating: number
  reviewCount: number
  keywordCount: number
  tasksDue: number
  auditScore: number
}

interface ClientSummaryTableProps {
  clients: ClientStat[]
}

function AuditScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-600">{score}%</span>
    </div>
  )
}

export function ClientSummaryTable({ clients }: ClientSummaryTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Client Overview</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">All clients at a glance</p>
        </div>
        <Link
          href="/clients"
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reviews</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Keywords</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">GBP Audit</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks Due</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map((client) => (
                <tr key={client.clientId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold shrink-0">
                        {client.clientName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{client.clientName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-gray-700 font-medium">{client.avgRating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{client.reviewCount}</td>
                  <td className="px-4 py-4 text-gray-600">{client.keywordCount}</td>
                  <td className="px-4 py-4">
                    <AuditScoreBar score={client.auditScore} />
                  </td>
                  <td className="px-4 py-4">
                    {client.tasksDue > 0 ? (
                      <Badge variant="warning">{client.tasksDue} due</Badge>
                    ) : (
                      <Badge variant="success">All clear</Badge>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/clients/${client.clientId}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
