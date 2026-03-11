/**
 * Gemini API key pool with round-robin rotation.
 *
 * Add keys to .env.local as:
 *   GOOGLE_GEMINI_API_KEY_1=...
 *   GOOGLE_GEMINI_API_KEY_2=...
 *   GOOGLE_GEMINI_API_KEY_3=...
 *
 * Falls back to GOOGLE_GEMINI_API_KEY if no numbered keys are found.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

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

export function getGeminiClient(): GoogleGenerativeAI {
  if (API_KEYS.length === 0) {
    throw new Error('No Gemini API key configured. Add GOOGLE_GEMINI_API_KEY_1 (or GOOGLE_GEMINI_API_KEY) to .env.local')
  }

  const key = API_KEYS[_counter % API_KEYS.length]
  _counter = (_counter + 1) % API_KEYS.length

  return new GoogleGenerativeAI(key)
}

export function hasGeminiKeys(): boolean {
  return API_KEYS.length > 0
}

export function geminiKeyCount(): number {
  return API_KEYS.length
}
