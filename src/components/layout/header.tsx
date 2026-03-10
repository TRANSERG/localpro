'use client'

import { Bell, Search, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useMobileNav } from '@/lib/mobile-nav-context'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false)
  const router = useRouter()
  const { toggle } = useMobileNav()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-gray-900 truncate sm:text-base">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actions}

        {/* Search */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="h-8 w-48 rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>

          {showNotif && (
            <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
              </div>
              {[
                { msg: 'Overdue: Respond to negative review', time: '2h ago', dot: 'bg-red-500' },
                { msg: 'New 5-star review for Green Thumb', time: '4h ago', dot: 'bg-green-500' },
                { msg: 'Monthly report due in 3 days', time: '1d ago', dot: 'bg-yellow-500' },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                  <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full shrink-0', n.dot)} />
                  <div>
                    <p className="text-xs text-gray-700">{n.msg}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 hover:bg-gray-50 cursor-pointer">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
            OW
          </div>
          <span className="text-xs font-medium text-gray-700 hidden sm:block">Owner</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-red-500"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  )
}
