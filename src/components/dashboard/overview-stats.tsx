'use client'

import { StatCard } from '@/components/ui/stat-card'
import { Users, Star, Search, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react'

interface OverviewStatsProps {
  totalClients: number
  activeClients: number
  avgRating: number
  totalKeywords: number
  tasksDue: number
  pendingReviews: number
}

export function OverviewStats({
  totalClients,
  activeClients,
  avgRating,
  totalKeywords,
  tasksDue,
  pendingReviews,
}: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Total Clients"
        value={totalClients}
        change={2}
        changeLabel=" this month"
        icon={Users}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      />
      <StatCard
        title="Active Clients"
        value={activeClients}
        icon={TrendingUp}
        iconColor="text-green-600"
        iconBg="bg-green-50"
      />
      <StatCard
        title="Avg. GBP Rating"
        value={avgRating.toFixed(1)}
        change={0.2}
        changeLabel=" pts"
        icon={Star}
        iconColor="text-yellow-500"
        iconBg="bg-yellow-50"
      />
      <StatCard
        title="Tracked Keywords"
        value={totalKeywords}
        change={5}
        changeLabel=" added"
        icon={Search}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
      />
      <StatCard
        title="Tasks Due"
        value={tasksDue}
        icon={CheckSquare}
        iconColor="text-orange-600"
        iconBg="bg-orange-50"
      />
      <StatCard
        title="Unanswered Reviews"
        value={pendingReviews}
        icon={AlertCircle}
        iconColor="text-red-600"
        iconBg="bg-red-50"
      />
    </div>
  )
}
