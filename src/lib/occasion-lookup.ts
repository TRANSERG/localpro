import { promises as fs } from 'fs'
import path from 'path'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NagerHoliday {
  date: string
  localName: string
  name: string
}

interface CachedHoliday {
  name: string
  date: string        // YYYY-MM-DD
  description: string
}

interface LocalOccasion {
  name: string
  date: string        // "MM-DD" for yearly, "YYYY-MM-DD" for specific year
  repeat: 'yearly' | 'none'
  category: string
  description: string
}

export interface OccasionContext {
  name: string
  displayDate: string
  description: string
  daysAway: number
  category: string
}

// ── Description enrichment for API holidays ───────────────────────────────────

const HOLIDAY_DESCRIPTIONS: Record<string, string> = {
  "New Year's Day":     'New Year celebrations — fresh starts, new goals, resolutions, countdowns',
  'Makar Sankranti':    'Makar Sankranti / Pongal / Lohri — harvest festival, kites, sesame sweets, new beginnings',
  'Republic Day':       "India's Republic Day — patriotism, national pride, freedom, constitutional celebration",
  'Holi':               'Festival of colors — joy, togetherness, vibrant energy, letting loose, colorful celebration',
  'Good Friday':        'Good Friday — Easter weekend ahead, reflection, family gatherings',
  'Easter Sunday':      'Easter — renewal, spring celebrations, family gatherings',
  'Eid ul-Fitr':        'Eid al-Fitr — celebration, feasting, family bonding, gifting, community spirit',
  'Independence Day':   "India's Independence Day — patriotism, pride, freedom, national celebration",
  'Gandhi Jayanti':     'Gandhi Jayanti — simplicity, truth, non-violence, peace, national pride',
  'Dussehra':           'Dussehra / Vijayadashami — victory of good over evil, festive energy',
  'Diwali':             'Festival of lights — prosperity, celebration, family bonding, sweets, gifting, diyas',
  'Eid ul-Adha':        'Eid al-Adha (Bakrid) — sacrifice, community, feasting, togetherness',
  'Christmas Day':      'Christmas — celebration, gifting, warmth, festive spirit, family gatherings',
  'Guru Nanak Jayanti': 'Guru Nanak Jayanti — service, equality, spirituality, community celebration',
  'Navratri':           'Navratri — nine nights of dance, devotion, garba, colorful celebration',
  'Baisakhi':           'Baisakhi / Vishu — harvest festival, Punjabi and South Indian new year celebrations',
  'Buddha Purnima':     'Buddha Purnima — mindfulness, peace, enlightenment, cultural significance',
  'Gudi Padwa':         'Maharashtrian New Year — new beginnings, prosperity, traditional celebrations, sweet dishes',
  'Ram Navami':         'Ram Navami — devotion, celebration, prasad, community gatherings',
  'Janmashtami':        "Janmashtami — devotion, celebration of Lord Krishna, cultural performances, dahi handi",
  'Onam':               'Onam — Kerala harvest festival, sadhya feast, floral designs, cultural richness',
  'Chhath Puja':        'Chhath Puja — sun worship, devotion, purity, sunrise and sunset rituals',
  'Maha Shivratri':     'Maha Shivratri — devotion, fasting, night vigil, spiritual celebration',
  'Ganesh Chaturthi':   'Ganesh Chaturthi — festivity, modak sweets, community celebrations, processions',
}

function enrichDescription(name: string, localName: string): string {
  const desc = HOLIDAY_DESCRIPTIONS[name] || HOLIDAY_DESCRIPTIONS[localName]
  if (desc) return desc
  for (const [key, val] of Object.entries(HOLIDAY_DESCRIPTIONS)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
      return val
    }
  }
  return `${name} — special occasion, great time for themed, festive content`
}

// ── API fetch with file cache ─────────────────────────────────────────────────

const OCCASIONS_DIR = path.join(process.cwd(), 'data', 'occasions')

async function getAPIHolidays(year: number): Promise<CachedHoliday[]> {
  const cacheFile = path.join(OCCASIONS_DIR, `cache-${year}.json`)

  // Try reading from cache first
  try {
    const cached = await fs.readFile(cacheFile, 'utf-8')
    return JSON.parse(cached) as CachedHoliday[]
  } catch { /* no cache yet — fetch */ }

  // Fetch from Nager.Date (free, no API key)
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const holidays: NagerHoliday[] = await res.json()
    const mapped: CachedHoliday[] = holidays.map(h => ({
      name: h.localName || h.name,
      date: h.date,
      description: enrichDescription(h.name, h.localName),
    }))
    // Save to cache
    await fs.mkdir(OCCASIONS_DIR, { recursive: true })
    await fs.writeFile(cacheFile, JSON.stringify(mapped, null, 2))
    return mapped
  } catch {
    return [] // API unavailable — graceful fallback
  }
}

async function getLocalOccasions(): Promise<LocalOccasion[]> {
  try {
    const raw = await fs.readFile(path.join(OCCASIONS_DIR, 'india.json'), 'utf-8')
    return JSON.parse(raw) as LocalOccasion[]
  } catch {
    return []
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getNearestOccasion(targetDate?: string): Promise<OccasionContext | null> {
  const base = targetDate ? new Date(targetDate) : new Date()
  base.setHours(0, 0, 0, 0)

  const year = base.getFullYear()
  const isYearEnd = base.getMonth() === 11 && base.getDate() >= 25

  // Fetch API holidays + local occasions in parallel
  const [apiHolidays, nextYearHolidays, localOccasions] = await Promise.all([
    getAPIHolidays(year),
    isYearEnd ? getAPIHolidays(year + 1) : Promise.resolve<CachedHoliday[]>([]),
    getLocalOccasions(),
  ])

  let nearest: OccasionContext | null = null

  // Helper to check and update nearest
  function check(name: string, date: Date, description: string, category: string) {
    date.setHours(0, 0, 0, 0)
    const diff = Math.round((date.getTime() - base.getTime()) / 86400000)
    if (diff >= 0 && diff <= 7) {
      if (!nearest || diff < nearest.daysAway) {
        nearest = {
          name,
          displayDate: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }),
          description,
          daysAway: diff,
          category,
        }
      }
    }
  }

  // Check API holidays (current + next year if near year end)
  for (const h of [...apiHolidays, ...nextYearHolidays]) {
    check(h.name, new Date(h.date), h.description, 'festival')
  }

  // Check local occasions (non-API: Valentine's, Mother's Day, IPL, industry days, etc.)
  for (const o of localOccasions) {
    let festDate: Date
    if (o.repeat === 'yearly') {
      const [mm, dd] = o.date.split('-').map(Number)
      festDate = new Date(base.getFullYear(), mm - 1, dd)
      if (festDate < base) festDate = new Date(base.getFullYear() + 1, mm - 1, dd)
    } else {
      festDate = new Date(o.date)
    }
    check(o.name, festDate, o.description, o.category)
  }

  return nearest
}
