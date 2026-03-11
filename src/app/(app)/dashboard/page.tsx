import { Header } from '@/components/layout/header'
import { StatCard } from '@/components/ui/stat-card'
import { getClients, getProfiles, getTasks, getReviews, getKeywords, getPerformanceChartData } from '@/lib/db'
import { mockPerformanceData } from '@/lib/mock-data'
import { formatINR, getStatusClasses, formatDate, cn } from '@/lib/utils'
import { Users, Star, Search, CalendarDays, IndianRupee, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PerformanceChart } from '@/components/dashboard/performance-chart'
import { ClientAvatar } from '@/components/ui/client-avatar'
import Link from 'next/link'

function MoMBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null
  return (
    <div className={cn('flex items-center gap-0.5 text-xs font-medium', pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-600' : 'text-gray-400')}>
      {pct > 0 ? <TrendingUp className="h-3 w-3" /> : pct < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {pct > 0 ? '+' : ''}{pct}%
    </div>
  )
}

export default async function DashboardPage() {
  const [clients, profiles, tasks, reviews, keywords, chartDataFromDB] = await Promise.all([
    getClients(),
    getProfiles(),
    getTasks(),
    getReviews(),
    getKeywords(),
    getPerformanceChartData(),
  ])

  // Fall back to mock chart data if no real data exists yet
  const chartData = chartDataFromDB ?? mockPerformanceData

  const activeClients = clients.filter(c => c.is_active)
  const totalMRR = activeClients.reduce((s, c) => s + (c.monthly_fee ?? 0), 0)
  const overdueClients = activeClients.filter(c => c.payment_status === 'Overdue')
  const overdueTasks = tasks.filter(t => t.status === 'Overdue')
  const totalKeywords = keywords.length
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.average_rating ?? 0), 0) / reviews.length).toFixed(1)
    : '—'
  const unansweredReviews = reviews.filter(r => !r.all_responded).length

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Agency Dashboard" subtitle={dateStr} />

      <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
        {/* Alert banner */}
        {(overdueClients.length > 0 || overdueTasks.length > 0) && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">
              <span className="font-semibold">{overdueClients.length} overdue payment{overdueClients.length !== 1 ? 's' : ''}</span>
              {overdueClients.length > 0 && ': ' + overdueClients.map(c => c.business_name).join(', ')}
              {overdueTasks.length > 0 && <span className="ml-2">· <span className="font-semibold">{overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}</span></span>}
            </p>
          </div>
        )}

        {/* KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard title="Active Clients" value={activeClients.length} change={2} changeLabel=" this month" icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" />
          <StatCard title="Monthly MRR" value={formatINR(totalMRR)} icon={IndianRupee} iconColor="text-green-600" iconBg="bg-green-50" />
          <StatCard title="Avg GBP Rating" value={avgRating} change={0.2} changeLabel=" pts" icon={Star} iconColor="text-yellow-500" iconBg="bg-yellow-50" />
          <StatCard title="Tracked Keywords" value={totalKeywords} change={3} changeLabel=" added" icon={Search} iconColor="text-purple-600" iconBg="bg-purple-50" />
          <StatCard title="Overdue Tasks" value={overdueTasks.length} icon={CalendarDays} iconColor={overdueTasks.length > 0 ? 'text-red-600' : 'text-gray-500'} iconBg={overdueTasks.length > 0 ? 'bg-red-50' : 'bg-gray-50'} />
          <StatCard title="Needs Response" value={unansweredReviews} icon={AlertCircle} iconColor={unansweredReviews > 0 ? 'text-orange-600' : 'text-gray-500'} iconBg={unansweredReviews > 0 ? 'bg-orange-50' : 'bg-gray-50'} />
        </div>

        {/* Chart */}
        <PerformanceChart data={chartData} />

        {/* Clients table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-900">Client Overview</p>
              <p className="text-xs text-gray-500 mt-0.5">All active clients at a glance</p>
            </div>
            <Link href="/clients" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
          </div>

          {clients.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No clients yet.{' '}
              <Link href="/clients" className="text-blue-600 hover:underline">Add your first client →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/60">
                    {['Client', 'Package', 'Monthly Fee', 'Payment', 'Assigned', 'Follow-up', 'Score'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clients.map(client => {
                    const assignee = profiles.find(p => p.id === client.assigned_to)
                    const score = client.performance_score ?? 0
                    const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
                    return (
                      <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <ClientAvatar client={client} size="lg" className="rounded-xl" />
                            <div>
                              <p className="font-semibold text-gray-900">{client.business_name}</p>
                              <p className="text-[11px] text-gray-400">{client.area}, {client.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border', getStatusClasses(client.package_type ?? 'Starter'))}>
                            {client.package_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">{formatINR(client.monthly_fee)}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border', getStatusClasses(client.payment_status ?? 'Pending'))}>
                            {client.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{assignee?.full_name?.split(' ')[0] ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(client.next_followup_date)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                              <div className={cn('h-full rounded-full', score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-500')} style={{ width: `${score}%` }} />
                            </div>
                            <span className={cn('text-xs font-bold', scoreColor)}>{score}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Overdue tasks */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Urgent Tasks</p>
              <Link href="/tasks" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
            </div>
            <div className="p-4 space-y-2">
              {tasks.filter(t => t.status === 'Overdue' || t.status === 'In Progress').map(task => {
                const client = clients.find(c => c.id === task.client_id)
                return (
                  <div key={task.id} className={cn('rounded-lg p-3 border', task.status === 'Overdue' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100')}>
                    <p className="text-xs font-semibold text-gray-900">{task.task_name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-gray-500">{client?.business_name ?? 'Agency'}</p>
                      <span className={cn('text-[11px] font-medium rounded-full px-2 py-0.5 border', getStatusClasses(task.status))}>{task.status}</span>
                    </div>
                  </div>
                )
              })}
              {tasks.filter(t => t.status === 'Overdue' || t.status === 'In Progress').length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">All tasks on track ✓</p>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Review Status</p>
              <Link href="/reviews" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
            </div>
            <div className="p-4 space-y-3">
              {reviews.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No review data yet.</p>
              )}
              {reviews.slice(0, 5).map(r => {
                const client = clients.find(c => c.id === r.client_id)
                return (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {client && <ClientAvatar client={client} size="sm" className="rounded" />}
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{client?.business_name}</p>
                        <p className="text-[11px] text-gray-500">⭐ {r.average_rating} · +{r.new_reviews} new</p>
                      </div>
                    </div>
                    <span className={cn('text-[11px] font-medium rounded-full px-2 py-0.5 border', r.all_responded ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
                      {r.all_responded ? '✓ Responded' : '⚠ Pending'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Keyword Rankings</p>
              <Link href="/keywords" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
            </div>
            <div className="p-4 space-y-2">
              {keywords.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No keywords tracked yet.</p>
              )}
              {keywords.slice(0, 5).map(kw => {
                const client = clients.find(c => c.id === kw.client_id)
                const rank = kw.current_ranking
                const rankColor = rank && rank <= 3 ? 'text-green-600 bg-green-50' : rank && rank <= 10 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'
                return (
                  <div key={kw.id} className="flex items-center gap-2">
                    {client && <ClientAvatar client={client} size="xs" className="rounded" />}
                    <p className="text-xs text-gray-700 flex-1 truncate">{kw.keyword}</p>
                    <span className={cn('text-[11px] font-bold rounded px-1.5 py-0.5', rankColor)}>#{rank ?? '—'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
