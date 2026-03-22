import { promises as fs } from 'fs'
import path from 'path'

const ANALYTICS_DIR = path.join(process.cwd(), 'data', 'review-analytics')

export interface ReviewAnalytics {
  clientId: string
  visits: number
  completions: number
  ratings: Record<string, number> // "1" through "5"
  lastVisit: string | null
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '')
}

const DEFAULT_RATINGS = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }

export async function readAnalytics(clientId: string): Promise<ReviewAnalytics> {
  const safeId = sanitizeId(clientId)
  const defaults: ReviewAnalytics = { clientId, visits: 0, completions: 0, ratings: { ...DEFAULT_RATINGS }, lastVisit: null }
  if (!safeId) return defaults
  try {
    const raw = await fs.readFile(path.join(ANALYTICS_DIR, `${safeId}.json`), 'utf-8')
    const parsed = JSON.parse(raw)
    return { ...defaults, ...parsed, ratings: { ...DEFAULT_RATINGS, ...(parsed.ratings ?? {}) } }
  } catch {
    return defaults
  }
}

export async function writeAnalytics(data: ReviewAnalytics): Promise<void> {
  const safeId = sanitizeId(data.clientId)
  if (!safeId) return
  await fs.mkdir(ANALYTICS_DIR, { recursive: true })
  await fs.writeFile(path.join(ANALYTICS_DIR, `${safeId}.json`), JSON.stringify(data, null, 2), 'utf-8')
}

export async function readAllAnalytics(clientIds: string[]): Promise<ReviewAnalytics[]> {
  return Promise.all(clientIds.map(readAnalytics))
}

export async function recordEvent(
  clientId: string,
  event: 'visit' | 'rating' | 'complete',
  rating?: number,
): Promise<void> {
  const data = await readAnalytics(clientId)
  if (event === 'visit') {
    data.visits += 1
    data.lastVisit = new Date().toISOString()
  }
  if (event === 'rating' && rating && rating >= 1 && rating <= 5) {
    data.ratings[String(rating)] = (data.ratings[String(rating)] ?? 0) + 1
  }
  if (event === 'complete') {
    data.completions += 1
  }
  await writeAnalytics(data)
}
