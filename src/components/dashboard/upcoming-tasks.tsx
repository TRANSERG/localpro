'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Task } from '@/types/database'
import { mockClients } from '@/lib/mock-data'
import { format } from 'date-fns'
import { ChevronRight, Clock, AlertTriangle, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpcomingTasksProps {
  tasks: Task[]
}

const statusConfig = {
  pending: { icon: Circle, color: 'text-gray-400', badge: 'muted' as const },
  in_progress: { icon: Clock, color: 'text-blue-500', badge: 'info' as const },
  completed: { icon: CheckCircle2, color: 'text-green-500', badge: 'success' as const },
  overdue: { icon: AlertTriangle, color: 'text-red-500', badge: 'danger' as const },
}

const priorityConfig = {
  high: 'danger' as const,
  medium: 'warning' as const,
  low: 'success' as const,
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const getClientName = (clientId: string | null) =>
    clientId ? (mockClients.find((c) => c.id === clientId)?.business_name ?? 'Unknown') : 'Agency'

  const sorted = [...tasks].sort((a, b) => {
    const order = { overdue: 0, high: 1, in_progress: 2, pending: 3, completed: 4 }
    return (order[a.status as keyof typeof order] ?? 9) - (order[b.status as keyof typeof order] ?? 9)
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Upcoming Tasks</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">Priority tasks across all clients</p>
        </div>
        <Link href="/tasks" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          View calendar <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {sorted.map((task) => {
          const { icon: StatusIcon, color, badge } = statusConfig[task.status as keyof typeof statusConfig] ?? statusConfig.pending
          return (
            <div
              key={task.id}
              className={cn(
                'flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50',
                task.status === 'overdue' && 'bg-red-50/50 border border-red-100'
              )}
            >
              <StatusIcon className={cn('h-4 w-4 mt-0.5 shrink-0', color)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-500">{getClientName(task.client_id)}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-500">
                    Due {format(new Date(task.due_date), 'MMM d')}
                  </span>
                  {task.category && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{task.category}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={priorityConfig[task.priority as keyof typeof priorityConfig]}>
                  {task.priority}
                </Badge>
                <Badge variant={badge}>{task.status.replace('_', ' ')}</Badge>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
