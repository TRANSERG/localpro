'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMobileNav } from '@/lib/mobile-nav-context'
import {
  LayoutDashboard, Users, MapPin, Search, Star,
  Users2, CalendarDays, Palette, Settings, BarChart3,
  BookOpen, Building2, ChevronLeft, ChevronRight, X, Store, PenSquare,
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'GBP Audit', href: '/gbp-audit', icon: MapPin },
  { label: 'Keywords', href: '/keywords', icon: Search },
  { label: 'Tasks', href: '/tasks', icon: CalendarDays },
  { label: 'Reviews', href: '/reviews', icon: Star },
  { label: 'Competitors', href: '/competitors', icon: Users2 },
  { label: 'Monthly Report', href: '/reports', icon: BarChart3 },
  { label: 'Branding', href: '/branding', icon: Palette },
  { label: 'Content Studio', href: '/content', icon: PenSquare },
  { label: 'GBP Settings', href: '/gbp-settings', icon: Settings },
  { label: 'GMB Connect',  href: '/gmb',           icon: Store },
  { label: 'SOPs',         href: '/sops',           icon: BookOpen },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { isOpen, close } = useMobileNav()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          'flex flex-col bg-gray-950 text-white shrink-0',
          // Mobile: fixed overlay, slides in from left
          'fixed inset-y-0 left-0 z-50 w-[240px]',
          'transform transition-all duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static in-flow, collapsible
          'lg:static lg:translate-x-0 lg:z-auto',
          collapsed ? 'lg:w-[60px]' : 'lg:w-[220px]',
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex h-14 items-center gap-2.5 border-b border-white/10 px-4',
          collapsed && 'lg:justify-center lg:px-0',
        )}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className={cn('leading-none flex-1', collapsed && 'lg:hidden')}>
            <span className="text-sm font-bold text-white">VyapaarGrow</span>
            <span className="text-sm font-bold text-blue-400"> Pro</span>
          </div>
          {/* Mobile close button */}
          <button
            onClick={close}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                  collapsed && 'lg:justify-center lg:px-0 lg:h-9 lg:w-9 lg:mx-auto',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 z-10 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-gray-700"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Footer */}
        <div className={cn('border-t border-white/10 px-4 py-3', collapsed && 'lg:hidden')}>
          <p className="text-[10px] text-gray-600 leading-relaxed">VyapaarGrow v1.0</p>
          <p className="text-[10px] text-gray-700">Pune, India · Phase 1</p>
        </div>
      </aside>
    </>
  )
}
