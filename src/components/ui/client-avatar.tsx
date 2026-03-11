import { cn, getInitials } from '@/lib/utils'
import type { Client } from '@/types'

const SIZE_CLASSES = {
  xs:   'h-5 w-5 text-[9px]',
  sm:   'h-6 w-6 text-[10px]',
  md:   'h-7 w-7 text-[11px]',
  lg:   'h-8 w-8 text-xs',
  xl:   'h-9 w-9 text-sm',
  '2xl':'h-12 w-12 text-sm',
} as const

type AvatarSize = keyof typeof SIZE_CLASSES

export function ClientAvatar({
  client,
  size = 'md',
  className,
}: {
  client: Client
  size?: AvatarSize
  className?: string
}) {
  const sz = SIZE_CLASSES[size]

  if (client.branding_logo_url) {
    return (
      <div className={cn(sz, 'rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0', className)}>
        <img
          src={client.branding_logo_url}
          alt={client.business_name}
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(sz, 'rounded-lg flex items-center justify-center text-white font-bold shrink-0', className)}
      style={{ backgroundColor: client.color_tag ?? '#3b82f6' }}
    >
      {getInitials(client.business_name)}
    </div>
  )
}
