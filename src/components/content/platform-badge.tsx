'use client'
import { cn } from '@/lib/utils'
import type { ContentPlatform } from '@/types'

const PLATFORM_STYLES: Record<ContentPlatform, string> = {
  Instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  Facebook: 'bg-blue-600 text-white',
  GBP: 'bg-blue-500 text-white',
  WhatsApp: 'bg-green-500 text-white',
}

export function PlatformBadge({ platform, size = 'sm' }: { platform: ContentPlatform; size?: 'sm' | 'md' }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      PLATFORM_STYLES[platform] ?? 'bg-gray-200 text-gray-700',
    )}>
      {platform}
    </span>
  )
}

export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const styles: Record<string, string> = {
    idea: 'bg-gray-100 text-gray-600 border-gray-200',
    approved: 'bg-blue-50 text-blue-700 border-blue-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    generated: 'bg-amber-50 text-amber-700 border-amber-200',
    published: 'bg-green-50 text-green-700 border-green-200',
  }
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-medium capitalize',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      styles[status] ?? styles.idea,
    )}>
      {status}
    </span>
  )
}