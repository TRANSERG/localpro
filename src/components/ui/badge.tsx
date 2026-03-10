import { cn } from '@/lib/utils'

const variantStyles: Record<string, string> = {
  default: 'border-gray-200 bg-gray-50 text-gray-700',
  success: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  error: 'border-red-200 bg-red-50 text-red-700',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variantStyles
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border', variantStyles[variant], className)}>
      {children}
    </span>
  )
}
