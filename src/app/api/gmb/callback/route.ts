import { NextRequest, NextResponse } from 'next/server'
import { handleOAuthCallback } from '@/lib/gmb'

// GET ?code=...&state=... — Google redirects here after user authorizes
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    // User denied access or other OAuth error
    return NextResponse.redirect(new URL(`/gmb?gmb_error=${encodeURIComponent(error)}`, req.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/gmb?gmb_error=missing_params', req.url))
  }

  try {
    const { clientId, magicToken } = await handleOAuthCallback(code, state)

    // If the flow started from a client-facing magic link → show the thank-you page
    if (magicToken) {
      return NextResponse.redirect(new URL(`/connect/${magicToken}?success=1`, req.url))
    }

    // Otherwise → redirect back to the agency GMB dashboard with success indicator
    return NextResponse.redirect(
      new URL(`/gmb?client=${clientId}&tab=reviews&gmb_connected=1`, req.url),
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'callback_failed'
    console.error('[GMB callback error]', msg)
    return NextResponse.redirect(
      new URL(`/gmb?gmb_error=${encodeURIComponent(msg)}`, req.url),
    )
  }
}
