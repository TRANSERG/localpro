'use client'

import { cn } from '@/lib/utils'

// ── Colour mapping (matches client color tags) ────────────────────────────────

const COLOR_BG: Record<string, string> = {
  blue:   'bg-blue-600',   indigo:  'bg-indigo-600',
  violet: 'bg-violet-600', pink:    'bg-pink-600',
  rose:   'bg-rose-600',   orange:  'bg-orange-600',
  amber:  'bg-amber-600',  yellow:  'bg-yellow-500',
  lime:   'bg-lime-600',   green:   'bg-green-600',
  teal:   'bg-teal-600',   cyan:    'bg-cyan-600',
  sky:    'bg-sky-600',    slate:   'bg-slate-600',
}

function colorBg(tag: string | null) { return COLOR_BG[tag ?? 'blue'] ?? 'bg-blue-600' }

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

// ── Google "G" icon ───────────────────────────────────────────────────────────

function GoogleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ── Permission list item ───────────────────────────────────────────────────────

function PermissionItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path fillRule="evenodd" clipRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
        </svg>
      </span>
      <span className="text-[14px] text-gray-700">{children}</span>
    </li>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type PageState = 'ready' | 'success' | 'used' | 'expired' | 'not_found'

interface ClientInfo {
  business_name: string
  city: string | null
  color_tag: string | null
}

export function ConnectClient({
  token,
  state,
  client,
  authUrl,
}: {
  token: string
  state: PageState
  client: ClientInfo | null
  authUrl: string | null
}) {

  // ── Success / error screens ────────────────────────────────────────────────

  if (state === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-lg ring-1 ring-gray-100 text-center">
          {/* Animated checkmark */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-green-500" strokeWidth={2.5}>
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">You're all set! 🎉</h1>
          <p className="text-gray-500 text-[15px] leading-relaxed mb-6">
            Your Google Business Profile has been connected.<br />
            Your agency can now manage your reviews, posts, and more.
          </p>

          <div className="rounded-xl bg-gray-50 px-5 py-4 text-left text-[13px] text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">What happens next?</p>
            <p>✓ Your agency will be notified automatically</p>
            <p>✓ They'll start syncing your reviews and insights</p>
            <p>✓ You can close this window now</p>
          </div>

          <p className="mt-8 text-[12px] text-gray-400">
            Secured by VyapaarGrow · Google only shares access to your business listing
          </p>
        </div>
      </div>
    )
  }

  if (state === 'used') {
    return <InfoScreen icon="🔗" title="Link already used" body="This link has already been used to connect a Google Business Profile. If you need to reconnect, please ask your agency for a new link." />
  }

  if (state === 'expired') {
    return <InfoScreen icon="⏰" title="Link expired" body="This connect link has expired (links are valid for 7 days). Please ask your agency to send you a new one." />
  }

  if (state === 'not_found') {
    return <InfoScreen icon="🔍" title="Link not found" body="We couldn't find this connect link. It may have been deleted. Please ask your agency for a new one." />
  }

  // ── Ready state — main connect screen ─────────────────────────────────────

  if (!client || !authUrl) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 via-white to-white px-4 py-12">
      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">

        {/* LocalRank Pro branding (top) */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" stroke="white" strokeWidth={2.5} />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-gray-500">VyapaarGrow</span>
        </div>

        {/* Client avatar + name */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className={cn(
            'mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm',
            colorBg(client.color_tag),
          )}>
            {getInitials(client.business_name)}
          </div>
          <h2 className="text-[22px] font-bold text-gray-900">{client.business_name}</h2>
          {client.city && <p className="text-[13px] text-gray-500 mt-0.5">{client.city}</p>}
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h1 className="text-[17px] font-semibold text-gray-800 leading-snug">
            Connect your Google Business Profile
          </h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Your agency needs access to manage your listing on your behalf.
            <br />Takes less than 30 seconds.
          </p>
        </div>

        {/* Permissions list */}
        <div className="mb-7 rounded-xl bg-gray-50 px-5 py-4">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-gray-400">
            This will allow your agency to:
          </p>
          <ul className="space-y-2.5">
            <PermissionItem>View and respond to customer reviews</PermissionItem>
            <PermissionItem>Create and schedule Google posts</PermissionItem>
            <PermissionItem>View profile performance insights</PermissionItem>
            <PermissionItem>Keep your business info up-to-date</PermissionItem>
          </ul>
        </div>

        {/* Connect button */}
        {authUrl ? (
          <a
            href={authUrl}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3.5 text-[15px] font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
          >
            <GoogleIcon className="h-5 w-5" />
            Connect with Google
          </a>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-[13px] text-amber-700">
            Google connection is not yet configured. Please ask your agency to complete setup.
          </div>
        )}

        {/* Trust footer */}
        <p className="mt-5 text-center text-[11.5px] text-gray-400 leading-relaxed">
          We only request access to your Business Profile listing — not your personal Google account.
          <br />You can revoke access at any time from your Google account settings.
        </p>
      </div>

      <p className="mt-6 text-[11px] text-gray-400">Secured by VyapaarGrow</p>
    </div>
  )
}

// ── Simple info screen for error states ───────────────────────────────────────

function InfoScreen({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-10 shadow-lg ring-1 ring-gray-100 text-center">
        <div className="mb-4 text-5xl">{icon}</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-[14px] text-gray-500 leading-relaxed">{body}</p>
      </div>
    </div>
  )
}
