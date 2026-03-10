import { Header } from '@/components/layout/header'
import { ComingSoon } from '@/components/ui/coming-soon'
import { TrendingUp } from 'lucide-react'

export default function PerformancePage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Performance" subtitle="Detailed GBP performance analytics" />
      <ComingSoon icon={TrendingUp} title="Performance Analytics" description="Deep-dive into GBP views, clicks, calls, and direction requests. Compare across clients and time periods." />
    </div>
  )
}
