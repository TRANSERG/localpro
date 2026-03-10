import { Sidebar } from '@/components/layout/sidebar'
import { MobileNavProvider } from '@/lib/mobile-nav-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileNavProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {children}
        </div>
      </div>
    </MobileNavProvider>
  )
}
