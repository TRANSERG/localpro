'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ReviewGenerateResponse } from '@/types'

// ── Types ────────────────────────────────────────────────────────────────────

interface PublicClientInfo {
  id: string
  business_name: string
  business_type: string | null
  area: string | null
  city: string | null
  color_tag: string | null
  google_review_url: string | null
  language_preference: string | null
}

type Step = 'rating' | 'loading' | 'suggestions' | 'not_found' | 'no_review_url'

// ── Star SVG ─────────────────────────────────────────────────────────────────

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(filled ? 'text-yellow-400' : 'text-gray-200', className)}
      fill="currentColor"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

// ── Google icon ──────────────────────────────────────────────────────────────

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

// ── Info screens ─────────────────────────────────────────────────────────────

function InfoScreen({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 via-white to-white px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{body}</p>
      </div>
    </div>
  )
}

// ── Branded header ───────────────────────────────────────────────────────────

function BrandedHeader({ client }: { client: PublicClientInfo }) {
  const initials = client.business_name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
  const location = [client.area, client.city].filter(Boolean).join(', ')

  return (
    <div className="mb-5 flex flex-col items-center text-center">
      <div
        className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
        style={{ backgroundColor: client.color_tag ?? '#3b82f6' }}
      >
        {initials}
      </div>
      <h2 className="text-xl font-bold text-gray-900">{client.business_name}</h2>
      {location && <p className="mt-0.5 text-sm text-gray-500">{location}</p>}
      {client.business_type && (
        <p className="mt-0.5 text-xs text-gray-400">{client.business_type}</p>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function ReviewClient({ client }: { client: PublicClientInfo | null }) {
  const [step, setStep] = useState<Step>(
    !client ? 'not_found' : !client.google_review_url ? 'no_review_url' : 'rating',
  )
  const [stars, setStars] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [reviews, setReviews] = useState<string[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [editedText, setEditedText] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Not-found / no-URL screens ────────────────────────────────────────
  if (step === 'not_found') {
    return (
      <InfoScreen
        title="Business not found"
        body="This review link may be invalid or the business is no longer active."
      />
    )
  }
  if (step === 'no_review_url') {
    return (
      <InfoScreen
        title="Review link not available"
        body="This business hasn't set up their Google review link yet. Please contact them directly."
      />
    )
  }

  // ── Star selection → AI generation ────────────────────────────────────
  async function handleStarSelect(rating: number) {
    setStars(rating)
    setStep('loading')
    setError(null)

    try {
      const res = await fetch('/api/review/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client!.id,
          stars: rating,
          language: client!.language_preference ?? 'English',
        }),
      })

      const data: ReviewGenerateResponse = await res.json()
      if (!data.ok || !data.reviews?.length) {
        throw new Error(data.error || 'Failed to generate reviews')
      }

      setReviews(data.reviews)
      setSelectedIdx(null)
      setEditedText('')
      setCopied(false)
      setStep('suggestions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('rating')
    }
  }

  // ── Select a review ───────────────────────────────────────────────────
  function handleSelect(idx: number) {
    setSelectedIdx(idx)
    setEditedText(reviews[idx])
    setCopied(false)
  }

  // ── Copy & redirect ───────────────────────────────────────────────────
  async function handleCopyAndRedirect() {
    const text = editedText || reviews[selectedIdx ?? 0]

    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }

    setCopied(true)
    setTimeout(() => {
      window.location.href = client!.google_review_url!
    }, 600)
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 via-white to-white px-4 py-12">
      <div className="w-full max-w-lg">
        <BrandedHeader client={client!} />

        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-lg ring-1 ring-gray-100">
          {/* ── Rating step ─────────────────────────────────────────── */}
          {step === 'rating' && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                How was your experience?
              </h3>
              <p className="text-sm text-gray-500 mb-6">Tap a star to rate</p>
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onMouseEnter={() => setHoveredStar(i)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => handleStarSelect(i)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <StarIcon
                      filled={i <= (hoveredStar || stars)}
                      className="h-10 w-10 sm:h-12 sm:w-12"
                    />
                  </button>
                ))}
              </div>
              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-4">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* ── Loading step ────────────────────────────────────────── */}
          {step === 'loading' && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm text-gray-500">
                Generating personalized review suggestions...
              </p>
            </div>
          )}

          {/* ── Suggestions step ────────────────────────────────────── */}
          {step === 'suggestions' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800">
                  Pick a review
                </h3>
                <button
                  onClick={() => {
                    setStep('rating')
                    setStars(0)
                    setSelectedIdx(null)
                    setEditedText('')
                    setCopied(false)
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Change rating
                </button>
              </div>

              {/* Star display */}
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <StarIcon key={i} filled={i <= stars} className="h-5 w-5" />
                ))}
              </div>

              {/* Review suggestions */}
              <div className="flex gap-3 mb-5 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
                {reviews.map((review, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={cn(
                      'flex-none w-72 text-left p-3 rounded-xl border text-sm leading-relaxed transition-all snap-start',
                      selectedIdx === idx
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    {review}
                  </button>
                ))}
              </div>

              {/* Edit & submit area */}
              {selectedIdx !== null && (
                <>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Edit your review (optional)
                  </label>
                  <textarea
                    value={editedText}
                    onChange={e => {
                      setEditedText(e.target.value)
                      setCopied(false)
                    }}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                  />

                  <button
                    onClick={handleCopyAndRedirect}
                    disabled={!editedText.trim()}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold transition active:scale-[0.98]',
                      !editedText.trim()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : copied
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700',
                    )}
                  >
                    <GoogleIcon className="h-4.5 w-4.5" />
                    {copied ? 'Copied! Opening Google...' : 'Copy & Review on Google'}
                  </button>

                  <p className="mt-3 text-center text-[11px] text-gray-400">
                    Your review will be copied to clipboard. Paste it on the Google review page that opens.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          Powered by VyapaarGrow
        </p>
      </div>
    </div>
  )
}
