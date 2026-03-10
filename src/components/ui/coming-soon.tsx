import { LucideIcon } from 'lucide-react'

interface ComingSoonProps {
  icon: LucideIcon
  title: string
  description: string
  phase?: string
}

export function ComingSoon({ icon: Icon, title, description, phase = 'Phase 1' }: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 mb-4">
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">{description}</p>
      <span className="mt-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
        {phase} — Coming Soon
      </span>
    </div>
  )
}
