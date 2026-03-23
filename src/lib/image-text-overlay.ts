// ============================================================
// Image Text Overlay — programmatic Devanagari text over AI-generated images
// Uses Sharp + SVG compositing with embedded TTF fonts.
// SERVER-ONLY — never import this in client components.
// ============================================================

import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import type { TextOverlayConfig, TextOverlayZoneConfig } from './gem-config-loader'

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts')

// Cache font base64 in memory across requests (warm Lambda)
const fontCache = new Map<string, string>()

async function loadFontBase64(fontFile: string): Promise<string | null> {
  if (fontCache.has(fontFile)) return fontCache.get(fontFile)!
  try {
    const buf = await fs.readFile(path.join(FONTS_DIR, fontFile))
    const b64 = buf.toString('base64')
    fontCache.set(fontFile, b64)
    return b64
  } catch {
    console.warn(`[Overlay] Font not found: ${fontFile}`)
    return null
  }
}

/**
 * Escape special XML characters in text for safe SVG embedding.
 */
function xmlEscape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Wrap long text into multiple lines based on estimated character width.
 * Devanagari glyphs average ~0.6em wide at the given font size.
 */
function wrapText(text: string, maxWidthPx: number, fontSizePx: number): string[] {
  const avgCharWidthPx = fontSizePx * 0.65
  const charsPerLine = Math.floor(maxWidthPx / avgCharWidthPx)
  if (text.length <= charsPerLine) return [text]

  const lines: string[] = []
  let remaining = text
  while (remaining.length > 0) {
    if (remaining.length <= charsPerLine) {
      lines.push(remaining)
      break
    }
    // Try to break at a space
    let cut = charsPerLine
    const spaceIdx = remaining.lastIndexOf(' ', charsPerLine)
    if (spaceIdx > charsPerLine * 0.5) cut = spaceIdx
    lines.push(remaining.slice(0, cut).trim())
    remaining = remaining.slice(cut).trim()
  }
  return lines
}

/**
 * Build an SVG overlay layer for a single text zone.
 * The SVG is full image size with a transparent background.
 * Only the zone band has a background fill; text is rendered on top.
 */
function buildZoneSvg(
  zone: TextOverlayZoneConfig,
  text: string,
  fontBase64: string | null,
  imageWidth: number,
  imageHeight: number,
): string {
  const {
    fontSize,
    color,
    position,
    paddingPx,
    zoneY,
    backgroundFill,
    backgroundOpacity = 1,
    textAlign = 'center',
  } = zone

  const lineHeight = fontSize * 1.35
  const maxTextWidth = imageWidth * 0.92
  const lines = wrapText(text, maxTextWidth, fontSize)
  const totalTextHeight = lines.length * lineHeight
  const bandHeight = Math.round(totalTextHeight + paddingPx * 2)

  const bandY = zoneY !== undefined
    ? zoneY
    : position === 'top' ? 0 : imageHeight - bandHeight
  const textAnchor = textAlign === 'center' ? 'middle' : textAlign === 'right' ? 'end' : 'start'
  const textX =
    textAlign === 'center' ? imageWidth / 2 :
    textAlign === 'right'  ? imageWidth - paddingPx :
    paddingPx

  // First text line Y: top of band + padding + one line height
  const firstLineY = bandY + paddingPx + fontSize

  // Font face declaration — embed TTF as base64 if available, else fallback
  const fontFaceDecl = fontBase64
    ? `@font-face { font-family: 'OverlayFont'; src: url('data:font/truetype;base64,${fontBase64}'); }`
    : ''
  const fontFamily = fontBase64 ? "'OverlayFont', sans-serif" : 'sans-serif'

  const bgRect = backgroundFill
    ? `<rect x="0" y="${bandY}" width="${imageWidth}" height="${bandHeight}" fill="${backgroundFill}" opacity="${backgroundOpacity}"/>`
    : ''

  const tspans = lines
    .map((line, i) => {
      const y = firstLineY + i * lineHeight
      return `<text
        x="${textX}"
        y="${y}"
        text-anchor="${textAnchor}"
        font-family="${fontFamily}"
        font-size="${fontSize}"
        fill="${color}"
        dominant-baseline="auto"
      >${xmlEscape(line)}</text>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}">
  <defs><style>${fontFaceDecl}</style></defs>
  ${bgRect}
  ${tspans}
</svg>`
}

/**
 * Apply programmatic Devanagari text overlay to an AI-generated image.
 *
 * @param base64DataUri  Full data URI from Gemini e.g. "data:image/png;base64,..."
 * @param mimeType       e.g. "image/png"
 * @param config         Per-client TextOverlayConfig from gem-config JSON
 * @param dishNameText   Resolved Devanagari dish name for this request
 * @param taglineText    Resolved Marathi tagline for this request
 * @returns              New data URI with text overlaid
 */
export async function applyDevanagariOverlay(
  base64DataUri: string,
  mimeType: string,
  config: TextOverlayConfig,
  dishNameText: string,
  taglineText: string,
): Promise<string> {
  // Strip data URL prefix → raw base64 → Buffer
  const base64 = base64DataUri.replace(/^data:[^;]+;base64,/, '')
  const imageBuffer = Buffer.from(base64, 'base64')

  const { width, height } = await sharp(imageBuffer).metadata()
  if (!width || !height) throw new Error('[Overlay] Could not read image dimensions')

  const { zones } = config
  const composites: sharp.OverlayOptions[] = []

  // Load fonts (may be the same file for multiple zones)
  const fontFiles = new Set([
    zones.dishName.fontFile,
    zones.tagline?.fontFile,
    zones.addressBar.fontFile,
  ].filter(Boolean) as string[])

  const fontMap = new Map<string, string | null>()
  await Promise.all(
    Array.from(fontFiles).map(async (f) => {
      fontMap.set(f, await loadFontBase64(f))
    }),
  )

  // Zone 1: Dish name
  if (dishNameText) {
    const svg = buildZoneSvg(
      zones.dishName,
      dishNameText,
      fontMap.get(zones.dishName.fontFile) ?? null,
      width,
      height,
    )
    composites.push({ input: Buffer.from(svg), top: 0, left: 0 })
  }

  // Zone 2: Tagline (optional)
  if (zones.tagline && taglineText) {
    const svg = buildZoneSvg(
      zones.tagline,
      taglineText,
      fontMap.get(zones.tagline.fontFile) ?? null,
      width,
      height,
    )
    composites.push({ input: Buffer.from(svg), top: 0, left: 0 })
  }

  // Zone 3: Address bar (static text from config)
  const addressText = zones.addressBar.text ?? ''
  if (addressText) {
    const svg = buildZoneSvg(
      zones.addressBar,
      addressText,
      fontMap.get(zones.addressBar.fontFile) ?? null,
      width,
      height,
    )
    composites.push({ input: Buffer.from(svg), top: 0, left: 0 })
  }

  if (composites.length === 0) return base64DataUri

  const outputBuffer = await sharp(imageBuffer)
    .composite(composites)
    .png()
    .toBuffer()

  return `data:image/png;base64,${outputBuffer.toString('base64')}`
}

/**
 * Resolve the Devanagari dish name for display.
 * Uses config.dishNameMap first, falls back to the original English title.
 */
export function resolveDishName(ideaTitle: string, config: TextOverlayConfig): string {
  if (config.dishNameMap) {
    // Exact match first
    if (config.dishNameMap[ideaTitle]) return config.dishNameMap[ideaTitle]
    // Case-insensitive match
    const lower = ideaTitle.toLowerCase()
    const key = Object.keys(config.dishNameMap).find((k) => k.toLowerCase() === lower)
    if (key) return config.dishNameMap[key]
  }
  return ideaTitle
}

/**
 * Resolve the Marathi tagline for a given dish.
 * Uses config.taglineMap or falls back to the built-in ANNABRAHMA_PHRASES lookup.
 */
export function resolveTagline(
  ideaTitle: string,
  config: TextOverlayConfig,
  lookupFn: (dish: string, map: Record<string, string>, fallback: string) => string,
): string {
  const phraseMap = config.taglineMap ?? {}
  const fallback = config.defaultTagline ?? ''
  return lookupFn(ideaTitle, phraseMap, fallback)
}
