'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Copy, Check, Download, QrCode, ExternalLink } from 'lucide-react'
import type { Client } from '@/types'

interface ReviewQRModalProps {
  client: Client
  onClose: () => void
}

// Brand colours (VyapaarGrow)
const BRAND_PRIMARY   = '#1d4ed8'   // blue-700
const BRAND_SECONDARY = '#2563eb'   // blue-600
const BRAND_ACCENT    = '#3b82f6'   // blue-500
const BRAND_LIGHT     = '#eff6ff'   // blue-50
const BRAND_TEXT      = '#1e3a8a'   // blue-900

function getReviewUrl(clientId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/review/${clientId}`
  }
  return `/review/${clientId}`
}

export function ReviewQRModal({ client, onClose }: ReviewQRModalProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied]       = useState(false)
  const [qrReady, setQrReady]     = useState(false)
  const [reviewUrl, setReviewUrl] = useState('')

  useEffect(() => {
    setReviewUrl(getReviewUrl(client.id))
  }, [client.id])

  // ── Draw branded QR card onto canvas ──────────────────────────────────────
  const drawCard = useCallback(async (url: string) => {
    const canvas = canvasRef.current
    if (!canvas || !url) return

    // Dynamically import qrcode (client-only)
    const QRCode = (await import('qrcode')).default

    const W = 480
    const H = 580
    canvas.width  = W
    canvas.height = H

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)

    // ── Card background ────────────────────────────────────────────────────
    roundRect(ctx, 0, 0, W, H, 24, '#ffffff')

    // ── Gradient header ────────────────────────────────────────────────────
    const grad = ctx.createLinearGradient(0, 0, W, 120)
    grad.addColorStop(0, BRAND_PRIMARY)
    grad.addColorStop(1, BRAND_ACCENT)
    roundRect(ctx, 0, 0, W, 120, { tl: 24, tr: 24, bl: 0, br: 0 }, grad)

    // Stars row
    const starY = 32
    const starCx = W / 2
    const starCount = 5
    const starGap   = 32
    const starSize  = 14
    const startX    = starCx - ((starCount - 1) * starGap) / 2
    ctx.fillStyle = '#facc15'
    for (let i = 0; i < starCount; i++) {
      drawStar(ctx, startX + i * starGap, starY, starSize)
    }

    // Header text
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.font      = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText('Scan to Leave a Review', W / 2, 72)

    ctx.font      = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText('Your feedback helps us grow!', W / 2, 96)

    // ── Client name block ──────────────────────────────────────────────────
    ctx.fillStyle = BRAND_LIGHT
    roundRect(ctx, 32, 132, W - 64, 56, 12, BRAND_LIGHT)

    // Initials avatar
    const initials = client.business_name
      .split(' ').slice(0, 2)
      .map(w => w[0]).join('').toUpperCase()
    ctx.fillStyle = client.color_tag ?? BRAND_SECONDARY
    roundRect(ctx, 44, 140, 40, 40, 10, client.color_tag ?? BRAND_SECONDARY)
    ctx.fillStyle  = '#ffffff'
    ctx.font       = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign  = 'center'
    ctx.fillText(initials, 64, 166)

    ctx.textAlign  = 'left'
    ctx.fillStyle  = '#111827'
    ctx.font       = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(client.business_name, 96, 158)
    ctx.fillStyle  = '#6b7280'
    ctx.font       = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    const location = [client.area, client.city].filter(Boolean).join(', ')
    ctx.fillText(location, 96, 176)

    // ── QR Code ────────────────────────────────────────────────────────────
    const QR_SIZE   = 240
    const QR_X      = (W - QR_SIZE) / 2
    const QR_Y      = 204

    // QR border / shadow card
    roundRect(ctx, QR_X - 16, QR_Y - 16, QR_SIZE + 32, QR_SIZE + 32, 20, '#f9fafb')
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.roundRect(QR_X - 16, QR_Y - 16, QR_SIZE + 32, QR_SIZE + 32, 20)
    ctx.stroke()

    // Render QR to temp canvas then draw onto main canvas
    const qrCanvas = document.createElement('canvas')
    await QRCode.toCanvas(qrCanvas, url, {
      width: QR_SIZE,
      margin: 1,
      color: { dark: '#111827', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
    ctx.drawImage(qrCanvas, QR_X, QR_Y, QR_SIZE, QR_SIZE)

    // VyapaarGrow logo overlay on QR (centre)
    const logoSize = 44
    const logoX    = QR_X + (QR_SIZE - logoSize) / 2
    const logoY    = QR_Y + (QR_SIZE - logoSize) / 2
    // White circle background
    ctx.beginPath()
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    // Coloured "V" letter badge
    roundRect(ctx, logoX, logoY, logoSize, logoSize, 10, BRAND_SECONDARY)
    ctx.fillStyle  = '#ffffff'
    ctx.font       = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign  = 'center'
    ctx.fillText('V', logoX + logoSize / 2, logoY + logoSize / 2 + 7)

    // ── Instruction text ───────────────────────────────────────────────────
    ctx.textAlign  = 'center'
    ctx.fillStyle  = '#374151'
    ctx.font       = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText('Open your camera & scan the code above', W / 2, QR_Y + QR_SIZE + 40)

    // ── Footer ─────────────────────────────────────────────────────────────
    const footerY = H - 44
    ctx.strokeStyle = '#f3f4f6'
    ctx.lineWidth   = 1
    ctx.beginPath()
    ctx.moveTo(32, footerY - 8)
    ctx.lineTo(W - 32, footerY - 8)
    ctx.stroke()

    // VyapaarGrow badge
    roundRect(ctx, W / 2 - 80, footerY - 2, 160, 28, 20, BRAND_LIGHT)
    ctx.fillStyle  = BRAND_TEXT
    ctx.font       = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign  = 'center'
    ctx.fillText('⚡ VyapaarGrow', W / 2, footerY + 14)

    setQrReady(true)
  }, [client])

  useEffect(() => {
    if (reviewUrl) drawCard(reviewUrl)
  }, [reviewUrl, drawCard])

  // ── Copy URL ──────────────────────────────────────────────────────────────
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reviewUrl)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = reviewUrl
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // ── Download QR card ──────────────────────────────────────────────────────
  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${client.business_name.replace(/\s+/g, '-')}-review-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <QrCode className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Review QR Code</h2>
              <p className="text-[11px] text-gray-400">{client.business_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Review URL row */}
          <div>
            <p className="text-[11px] font-medium text-gray-500 mb-1.5">Review Page URL</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2">
              <span className="flex-1 text-xs text-gray-700 truncate font-mono">{reviewUrl}</span>
              <div className="flex items-center gap-1 shrink-0">
                <a href={reviewUrl} target="_blank" rel="noreferrer"
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ backgroundColor: copied ? '#dcfce7' : '#eff6ff', color: copied ? '#16a34a' : '#2563eb' }}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-400">
              Share this link via WhatsApp, SMS, or email to collect Google reviews.
            </p>
          </div>

          {/* QR Card preview */}
          <div>
            <p className="text-[11px] font-medium text-gray-500 mb-2">Branded QR Card</p>
            <div className="flex justify-center bg-gray-50 rounded-xl border border-gray-200 p-3">
              <canvas
                ref={canvasRef}
                className="rounded-xl shadow-sm max-w-full"
                style={{ maxHeight: 280, objectFit: 'contain', display: qrReady ? 'block' : 'none' }}
              />
              {!qrReady && (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                  <p className="text-xs text-gray-400">Generating QR code…</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={handleDownload} disabled={!qrReady}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Download className="h-4 w-4" />
              Download QR Card
            </button>
            <button onClick={handleCopy}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Canvas helpers ────────────────────────────────────────────────────────────

type Radii = number | { tl: number; tr: number; bl: number; br: number }

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: Radii,
  fill: string | CanvasGradient,
) {
  const tl = typeof r === 'number' ? r : r.tl
  const tr = typeof r === 'number' ? r : r.tr
  const br = typeof r === 'number' ? r : r.br
  const bl = typeof r === 'number' ? r : r.bl
  ctx.beginPath()
  ctx.moveTo(x + tl, y)
  ctx.lineTo(x + w - tr, y)
  ctx.arcTo(x + w, y, x + w, y + tr, tr)
  ctx.lineTo(x + w, y + h - br)
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br)
  ctx.lineTo(x + bl, y + h)
  ctx.arcTo(x, y + h, x, y + h - bl, bl)
  ctx.lineTo(x, y + tl)
  ctx.arcTo(x, y, x + tl, y, tl)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const spikes = 5
  const outer  = size
  const inner  = size * 0.45
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner
    const angle  = (i * Math.PI) / spikes - Math.PI / 2
    if (i === 0) ctx.moveTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle))
    else ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle))
  }
  ctx.closePath()
  ctx.fill()
}
