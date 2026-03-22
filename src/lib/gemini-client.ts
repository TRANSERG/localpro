/**
 * Gemini API key pool with round-robin rotation and automatic retry.
 *
 * Uses the new @google/genai SDK (replaces legacy @google/generative-ai).
 *
 * Add keys to .env.local as:
 *   GOOGLE_GEMINI_API_KEY_1=...
 *   GOOGLE_GEMINI_API_KEY_2=...
 *   GOOGLE_GEMINI_API_KEY_3=...
 *
 * Falls back to GOOGLE_GEMINI_API_KEY if no numbered keys are found.
 */

import { GoogleGenAI } from '@google/genai'

function loadApiKeys(): string[] {
  const keys: string[] = []

  // Collect numbered keys: GOOGLE_GEMINI_API_KEY_1, _2, _3, ...
  for (let i = 1; i <= 20; i++) {
    const key = process.env[`GOOGLE_GEMINI_API_KEY_${i}`]
    if (key) keys.push(key)
  }

  // Fall back to the single legacy key
  if (keys.length === 0 && process.env.GOOGLE_GEMINI_API_KEY) {
    keys.push(process.env.GOOGLE_GEMINI_API_KEY)
  }

  return keys
}

const API_KEYS = loadApiKeys()

// Module-level atomic counter — persists across requests within a single
// Node.js process (dev server / self-hosted). In serverless environments
// each cold-start picks a random key instead (still distributes load).
let _counter = Math.floor(Math.random() * Math.max(API_KEYS.length, 1))

/**
 * Try a Gemini API call with automatic key rotation on 429/quota errors.
 * Tries each available key once before giving up.
 */
export async function withKeyRetry<T>(
  fn: (client: GoogleGenAI) => Promise<T>,
): Promise<T> {
  if (API_KEYS.length === 0) {
    throw new Error('No Gemini API key configured. Add GOOGLE_GEMINI_API_KEY_1 (or GOOGLE_GEMINI_API_KEY) to .env.local')
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const keyIndex = (_counter + attempt) % API_KEYS.length
    const key = API_KEYS[keyIndex]
    const keyLabel = `#${keyIndex + 1} (ending ...${key.slice(-6)})`

    try {
      console.log(`[Gemini] Attempt ${attempt + 1}/${API_KEYS.length} — key ${keyLabel}`)
      const client = new GoogleGenAI({ apiKey: key })
      const result = await fn(client)
      // Success — advance counter past this key for next request
      _counter = (keyIndex + 1) % API_KEYS.length
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const isQuota = message.includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate limit')
      console.warn(`[Gemini] Key ${keyLabel} failed: ${message.slice(0, 150)}${isQuota ? ' (QUOTA — trying next key)' : ''}`)

      lastError = err instanceof Error ? err : new Error(message)

      if (!isQuota) {
        // Non-quota error (e.g. invalid key, model not found) — don't retry
        throw lastError
      }
    }
  }

  // All keys exhausted
  console.error(`[Gemini] All ${API_KEYS.length} keys returned quota errors`)
  throw lastError ?? new Error('All API keys exhausted')
}

export function hasGeminiKeys(): boolean {
  return API_KEYS.length > 0
}

export function geminiKeyCount(): number {
  return API_KEYS.length
}