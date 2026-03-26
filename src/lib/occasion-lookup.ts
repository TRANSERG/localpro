import { promises as fs } from 'fs'
import path from 'path'
import type { CalendarOccasion, OccasionCategory } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalendarificHoliday {
  name: string
  description: string
  date: { iso: string }
  type: string[]
  primary_type: string
}

interface CachedHoliday {
  name: string
  date: string        // YYYY-MM-DD
  description: string
  category: OccasionCategory
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

// ── Description enrichment ────────────────────────────────────────────────────

const HOLIDAY_DESCRIPTIONS: Record<string, string> = {
  "New Year's Day":     'New Year celebrations — fresh starts, new goals, resolutions, countdowns',
  'Makar Sankranti':    'Makar Sankranti / Pongal / Lohri — harvest festival, kites, sesame sweets, new beginnings',
  'Republic Day':       "India's Republic Day — patriotism, national pride, freedom, constitutional celebration",
  'Holi':               'Festival of colors — joy, togetherness, vibrant energy, letting loose, colorful celebration',
  'Good Friday':        'Good Friday — Easter weekend ahead, reflection, family gatherings',
  'Easter Sunday':      'Easter — renewal, spring celebrations, family gatherings',
  'Eid ul-Fitr':        'Eid al-Fitr — celebration, feasting, family bonding, gifting, community spirit',
  'Ramzan Id/Eid-ul-Fitr': 'Eid al-Fitr — celebration, feasting, family bonding, gifting, community spirit',
  'Independence Day':   "India's Independence Day — patriotism, pride, freedom, national celebration",
  'Gandhi Jayanti':     'Gandhi Jayanti — simplicity, truth, non-violence, peace, national pride',
  'Mahatma Gandhi Jayanti': 'Gandhi Jayanti — simplicity, truth, non-violence, peace, national pride',
  'Dussehra':           'Dussehra / Vijayadashami — victory of good over evil, festive energy',
  'Diwali':             'Festival of lights — prosperity, celebration, family bonding, sweets, gifting, diyas',
  'Deepavali':          'Festival of lights — prosperity, celebration, family bonding, sweets, gifting, diyas',
  'Eid ul-Adha':        'Eid al-Adha (Bakrid) — sacrifice, community, feasting, togetherness',
  'Bakrid/Eid ul-Adha': 'Eid al-Adha (Bakrid) — sacrifice, community, feasting, togetherness',
  'Christmas Day':      'Christmas — celebration, gifting, warmth, festive spirit, family gatherings',
  'Christmas':          'Christmas — celebration, gifting, warmth, festive spirit, family gatherings',
  'Guru Nanak Jayanti': 'Guru Nanak Jayanti — service, equality, spirituality, community celebration',
  "Guru Nanak's Birthday": 'Guru Nanak Jayanti — service, equality, spirituality, community celebration',
  'Navratri':           'Navratri — nine nights of dance, devotion, garba, colorful celebration',
  'Baisakhi':           'Baisakhi / Vishu — harvest festival, Punjabi and South Indian new year celebrations',
  'Vaisakhi':           'Vaisakhi / Baisakhi — harvest festival, Punjabi new year celebrations',
  'Buddha Purnima':     'Buddha Purnima — mindfulness, peace, enlightenment, cultural significance',
  'Gudi Padwa':         'Maharashtrian New Year — new beginnings, prosperity, traditional celebrations, sweet dishes',
  'Ram Navami':         'Ram Navami — devotion, celebration, prasad, community gatherings',
  'Rama Navami':        'Ram Navami — devotion, celebration, prasad, community gatherings',
  'Janmashtami':        "Janmashtami — devotion, celebration of Lord Krishna, cultural performances, dahi handi",
  'Onam':               'Onam — Kerala harvest festival, sadhya feast, floral designs, cultural richness',
  'Chhath Puja':        'Chhath Puja — sun worship, devotion, purity, sunrise and sunset rituals',
  'Chhat Puja':         'Chhath Puja — sun worship, devotion, purity, sunrise and sunset rituals',
  'Maha Shivaratri':    'Maha Shivratri — devotion, fasting, night vigil, spiritual celebration',
  'Maha Shivratri':     'Maha Shivratri — devotion, fasting, night vigil, spiritual celebration',
  'Ganesh Chaturthi':   'Ganesh Chaturthi — festivity, modak sweets, community celebrations, processions',
  'Pongal':             'Pongal — Tamil harvest festival, gratitude, traditional kolam, sweet pongal',
  'Ugadi':              'Ugadi — Telugu/Kannada New Year, new beginnings, neem-jaggery tradition',
  'Raksha Bandhan':     'Raksha Bandhan — sibling bond, gifting, love, family celebration',
  'Durga Puja':         'Durga Puja — divine feminine power, pandal art, community celebration, cultural vibrancy',
  'Muharram':           'Muharram — Islamic New Year, reflection, community, spiritual significance',
  'Milad un-Nabi':      'Milad un-Nabi — Prophet Muhammad birthday, spiritual reflection, community gathering',
  'Vasant Panchami':    'Vasant Panchami — spring arrival, Saraswati worship, yellow attire, cultural celebration',
  'Mahavir Jayanti':    'Mahavir Jayanti — Jain celebration, non-violence, peace, spiritual teaching',
  'Ambedkar Jayanti':   'Ambedkar Jayanti — equality, social justice, constitutional values, awareness',
  'Holika Dahana':      'Holika Dahan — bonfire night before Holi, triumph of good over evil',
  'Rath Yatra':         'Rath Yatra — grand chariot procession, Lord Jagannath, community devotion',
  'Karaka Chaturthi':   'Karva Chauth — love, devotion, fasting, couple bond celebration',
  'Govardhan Puja':     'Govardhan Puja — gratitude, nature worship, festive spirit after Diwali',
  'Bhai Duj':           'Bhai Dooj — sibling bond celebration, love, gifting',
}

function enrichDescription(name: string, apiDescription: string): string {
  // Exact match
  if (HOLIDAY_DESCRIPTIONS[name]) return HOLIDAY_DESCRIPTIONS[name]
  // Partial match
  for (const [key, val] of Object.entries(HOLIDAY_DESCRIPTIONS)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
      return val
    }
  }
  // Fallback to API description, or generic
  if (apiDescription && apiDescription !== 'Optional holiday' && !apiDescription.endsWith('in India')) {
    return apiDescription
  }
  return `${name} — special occasion, great time for themed, festive content`
}

// ── Category mapping ──────────────────────────────────────────────────────────

function mapCalendarificCategory(types: string[], primaryType: string): OccasionCategory {
  const joined = [...types, primaryType].join(' ').toLowerCase()
  if (joined.includes('national holiday') || joined.includes('gazetted')) return 'occasion'
  if (joined.includes('hinduism') || joined.includes('muslim') || joined.includes('islam')
    || joined.includes('christian') || joined.includes('sikh') || joined.includes('jain')
    || joined.includes('buddhist') || joined.includes('religious')) return 'festival'
  if (joined.includes('observance') || joined.includes('optional') || joined.includes('restricted')) return 'occasion'
  return 'occasion'
}

// ── API fetch with file cache ─────────────────────────────────────────────────

const OCCASIONS_DIR = path.join(process.cwd(), 'data', 'occasions')

async function fetchCalendarificHolidays(year: number): Promise<CachedHoliday[]> {
  const cacheFile = path.join(OCCASIONS_DIR, `calendarific-cache-${year}.json`)

  // Try reading from cache first
  try {
    const cached = await fs.readFile(cacheFile, 'utf-8')
    return JSON.parse(cached) as CachedHoliday[]
  } catch { /* no cache yet — fetch */ }

  const apiKey = process.env.CALENDARIFIC_API_KEY
  if (!apiKey) {
    console.warn('[Occasions] CALENDARIFIC_API_KEY not set — using local data only')
    return []
  }

  try {
    const res = await fetch(
      `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=IN&year=${year}`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) {
      console.error(`[Occasions] Calendarific API returned ${res.status}`)
      return []
    }
    const json = await res.json()
    const holidays: CalendarificHoliday[] = json?.response?.holidays ?? []

    const mapped: CachedHoliday[] = holidays.map(h => ({
      name: h.name,
      date: h.date.iso.split('T')[0],  // ensure YYYY-MM-DD
      description: enrichDescription(h.name, h.description),
      category: mapCalendarificCategory(h.type, h.primary_type),
    }))

    // Save to cache
    await fs.mkdir(OCCASIONS_DIR, { recursive: true })
    await fs.writeFile(cacheFile, JSON.stringify(mapped, null, 2))
    console.log(`[Occasions] Cached ${mapped.length} holidays for ${year}`)
    return mapped
  } catch (err) {
    console.error('[Occasions] Calendarific fetch failed:', err)
    return []
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

// ── Month occasions (for calendar UI) ─────────────────────────────────────────

export async function getOccasionsForMonth(year: number, month: number): Promise<CalendarOccasion[]> {
  const [apiHolidays, localOccasions] = await Promise.all([
    fetchCalendarificHolidays(year),
    getLocalOccasions(),
  ])

  const pad = (n: number) => String(n).padStart(2, '0')
  const monthPrefix = `${year}-${pad(month)}`

  // Filter API holidays to this month
  const apiForMonth: CalendarOccasion[] = apiHolidays
    .filter(h => h.date.startsWith(monthPrefix))
    .map(h => ({ name: h.name, date: h.date, description: h.description, category: h.category }))

  // Filter local occasions to this month
  const localForMonth: CalendarOccasion[] = []
  for (const o of localOccasions) {
    let occDate: string
    if (o.repeat === 'yearly') {
      const [mm, dd] = o.date.split('-').map(Number)
      if (mm !== month) continue
      occDate = `${year}-${pad(mm)}-${pad(dd)}`
    } else {
      if (!o.date.startsWith(monthPrefix)) continue
      occDate = o.date
    }
    localForMonth.push({
      name: o.name,
      date: occDate,
      description: o.description,
      category: (o.category as OccasionCategory) || 'occasion',
    })
  }

  // Merge + deduplicate (API holidays take priority, local adds industry/sports)
  const seen = new Set(apiForMonth.map(o => `${o.name.toLowerCase()}|${o.date}`))
  const merged = [...apiForMonth]
  for (const loc of localForMonth) {
    const key = `${loc.name.toLowerCase()}|${loc.date}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(loc)
    }
  }

  // Sort by date
  return merged.sort((a, b) => a.date.localeCompare(b.date))
}

// ── Nearest occasion (for idea generation) ────────────────────────────────────

export async function getNearestOccasion(targetDate?: string): Promise<OccasionContext | null> {
  const base = targetDate ? new Date(targetDate) : new Date()
  base.setHours(0, 0, 0, 0)

  const year = base.getFullYear()
  const isYearEnd = base.getMonth() === 11 && base.getDate() >= 25

  const [apiHolidays, nextYearHolidays, localOccasions] = await Promise.all([
    fetchCalendarificHolidays(year),
    isYearEnd ? fetchCalendarificHolidays(year + 1) : Promise.resolve<CachedHoliday[]>([]),
    getLocalOccasions(),
  ])

  let nearest: OccasionContext | null = null

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

  for (const h of [...apiHolidays, ...nextYearHolidays]) {
    check(h.name, new Date(h.date), h.description, h.category)
  }

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
