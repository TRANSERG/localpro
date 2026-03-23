// Server-only — uses Node.js fs/path. Do NOT import in client components.
import { promises as fs } from 'fs'
import path from 'path'
import type { SectorData } from './client-sector-utils'

export type { SectorType, SectorData, MenuItem, ServiceItem, TreatmentItem, OfferingItem } from './client-sector-utils'
export { detectSectorType, buildSectorPromptContext } from './client-sector-utils'

const DATA_DIR = path.join(process.cwd(), 'data', 'client-data')

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '')
}

export async function readSectorData(clientId: string): Promise<SectorData | null> {
  const safeId = sanitizeId(clientId)
  if (!safeId) return null
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${safeId}.json`), 'utf-8')
    return JSON.parse(raw) as SectorData
  } catch {
    return null
  }
}

export async function writeSectorData(data: SectorData): Promise<void> {
  const safeId = sanitizeId(data.clientId)
  if (!safeId) return
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(
    path.join(DATA_DIR, `${safeId}.json`),
    JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2),
    'utf-8',
  )
}
