// ============================================================
// Gem Config Loader — Read per-client gem instructions from local files
// Fallback chain: local file → gem-instructions.ts → null
// ============================================================

import { promises as fs } from 'fs'
import path from 'path'
import { getGemConfig } from './gem-instructions'

const GEM_CONFIG_DIR = path.join(process.cwd(), 'data', 'gem-configs')

// ── Text Overlay Config Types ────────────────────────────────

export interface TextOverlayZoneConfig {
  /** Static text for address bar; empty string = resolved at generation time for dish/tagline */
  text?: string
  /** TTF filename in public/fonts/ e.g. "NotoSansDevanagari.ttf" */
  fontFile: string
  /** Font size in px */
  fontSize: number
  /** Hex color e.g. "#FFFFFF" */
  color: string
  /** Whether to anchor the zone to the top or bottom of the image */
  position: 'top' | 'bottom'
  /** Padding from the anchor edge in px */
  paddingPx: number
  /** Optional absolute Y pixel position — overrides position anchor calculation */
  zoneY?: number
  /** Optional background fill color for the zone strip */
  backgroundFill?: string
  /** Background opacity 0.0–1.0 */
  backgroundOpacity?: number
  /** Text alignment within the zone */
  textAlign?: 'left' | 'center' | 'right'
}

export interface TextOverlayConfig {
  enabled: boolean
  /** Language identifier e.g. "Marathi" | "Hindi" */
  language: string
  /** English dish title → Devanagari display name */
  dishNameMap?: Record<string, string>
  /** Category key → Marathi tagline (overrides built-in ANNABRAHMA_PHRASES) */
  taglineMap?: Record<string, string>
  /** Fallback tagline when no category matches */
  defaultTagline?: string
  zones: {
    dishName: TextOverlayZoneConfig
    tagline?: TextOverlayZoneConfig | null
    addressBar: TextOverlayZoneConfig
  }
}

interface LocalGemConfig {
  clientId: string
  instructions: string
  updatedAt: string
  textOverlay?: TextOverlayConfig
  /** Per-client image generation model override e.g. "gemini-3-pro-image-preview" */
  imageModel?: string
  [key: string]: unknown
}

export interface GemConfigResult {
  instructions: string
  source: 'local' | 'hardcoded' | 'empty'
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '')
}

/**
 * Load gem instructions from local file for a given clientId.
 * Returns null if no local file exists.
 */
export async function loadLocalGemInstructions(clientId: string): Promise<string | null> {
  const safeId = sanitizeId(clientId)
  if (!safeId) return null
  const filePath = path.join(GEM_CONFIG_DIR, `${safeId}.json`)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const config: LocalGemConfig = JSON.parse(raw)
    return config.instructions || null
  } catch {
    return null
  }
}

/**
 * Load the textOverlay config for a client, or null if not configured.
 */
export async function loadTextOverlayConfig(clientId: string): Promise<TextOverlayConfig | null> {
  const safeId = sanitizeId(clientId)
  if (!safeId) return null
  const filePath = path.join(GEM_CONFIG_DIR, `${safeId}.json`)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const config: LocalGemConfig = JSON.parse(raw)
    return config.textOverlay ?? null
  } catch {
    return null
  }
}

/**
 * Load per-client image model override.
 * Returns null if no config or no imageModel field — caller should use default model.
 */
export async function loadImageModel(clientId: string): Promise<string | null> {
  const safeId = sanitizeId(clientId)
  if (!safeId) return null
  const filePath = path.join(GEM_CONFIG_DIR, `${safeId}.json`)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const config = JSON.parse(raw) as LocalGemConfig
    return typeof config.imageModel === 'string' ? config.imageModel : null
  } catch {
    return null
  }
}

/**
 * Save gem instructions to a local file.
 * Reads existing file first and merges — preserves textOverlay and any extra fields.
 */
export async function saveLocalGemInstructions(clientId: string, instructions: string): Promise<void> {
  const safeId = sanitizeId(clientId)
  if (!safeId) throw new Error('Invalid clientId')
  await fs.mkdir(GEM_CONFIG_DIR, { recursive: true })
  const filePath = path.join(GEM_CONFIG_DIR, `${safeId}.json`)

  // Read existing config to preserve extra fields (e.g. textOverlay)
  let existing: LocalGemConfig = { clientId, instructions: '', updatedAt: '' }
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    existing = JSON.parse(raw) as LocalGemConfig
  } catch {
    // No existing file — start fresh
  }

  const updated: LocalGemConfig = {
    ...existing,
    clientId,
    instructions,
    updatedAt: new Date().toISOString(),
  }
  await fs.writeFile(filePath, JSON.stringify(updated, null, 2), 'utf-8')
}

/**
 * Resolve gem instructions with full fallback chain:
 * 1. Local file (data/gem-configs/{clientId}.json)
 * 2. gem-instructions.ts (hardcoded, matched by businessName)
 * 3. Empty
 */
export async function resolveGemInstructions(
  clientId: string,
  businessName?: string,
): Promise<GemConfigResult> {
  // 1. Local file
  const local = await loadLocalGemInstructions(clientId)
  if (local) {
    return { instructions: local, source: 'local' }
  }

  // 2. Hardcoded gem-instructions.ts (needs businessName to match)
  if (businessName) {
    const gemConfig = getGemConfig(businessName)
    if (gemConfig) {
      return { instructions: gemConfig.gemInstructions, source: 'hardcoded' }
    }
  }

  // 3. Empty
  return { instructions: '', source: 'empty' }
}
