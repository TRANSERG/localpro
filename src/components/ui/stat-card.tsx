import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  className?: string
}

export function StatCard({ title, value, change, changeLabel, icon: Icon, iconColor = 'text-blue-600', iconBg = 'bg-blue-50', className }: StatCardProps) {
  const isPos = change !== undefined && change > 0
  const isNeg = change !== undefined && change < 0
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-5', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
          {change !== undefined && (
            <div className="mt-1.5 flex items-center gap-1">
              {isPos ? <TrendingUp className="h-3 w-3 text-green-500" /> : isNeg ? <TrendingDown className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3 text-gray-400" />}
              <span className={cn('text-[11px] font-medium', isPos ? 'text-green-600' : isNeg ? 'text-red-600' : 'text-gray-500')}>
                {isPos ? '+' : ''}{change}{changeLabel ?? ''}
              </span>
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-2 sm:p-2.5 ml-2 sm:ml-3 shrink-0', iconBg)}>
          <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconColor)} />
        </div>
      </div>
    </div>
  )
}
