// Pure utilities — no Node.js imports, safe for browser + server

export type SectorType = 'restaurant' | 'salon' | 'clinic' | 'fitness' | 'retail' | 'generic'

export interface MenuItem { name: string; category: string; price?: string }
export interface ServiceItem { name: string; category: string; price?: string }
export interface TreatmentItem { name: string; description?: string }
export interface OfferingItem { name: string; description?: string }

export interface SectorData {
  clientId: string
  sectorType: SectorType
  updatedAt: string
  restaurant?: {
    menuItems: MenuItem[]
    features: string[]
  }
  salon?: {
    services: ServiceItem[]
    bookingType: string
  }
  clinic?: {
    specializations: string[]
    treatments: TreatmentItem[]
    consultationType: string
  }
  fitness?: {
    programs: OfferingItem[]
    facilities: string[]
  }
  retail?: {
    productCategories: string[]
    brands: string[]
    priceRange: string
  }
  generic?: {
    offerings: OfferingItem[]
  }
}

export function detectSectorType(businessType: string): SectorType {
  const bt = businessType.toLowerCase()
  if (/restaurant|cafe|food|bakery|dhaba|biryani|pizza|burger|kitchen|tiffin|canteen|hotel|bar|pub|mess/.test(bt)) return 'restaurant'
  if (/salon|beauty|spa|parlour|parlor|makeup|nail|hair|barber|grooming/.test(bt)) return 'salon'
  if (/clinic|hospital|doctor|dental|dentist|health|medical|physio|ayurved|homeo|optic/.test(bt)) return 'clinic'
  if (/gym|fitness|yoga|pilates|zumba|crossfit|training|wellness/.test(bt)) return 'fitness'
  if (/retail|shop|store|boutique|mart|cloth|apparel|jewel|electronic|mobile/.test(bt)) return 'retail'
  return 'generic'
}

export function buildSectorPromptContext(data: SectorData): string {
  const lines: string[] = []

  if (data.restaurant?.menuItems && data.restaurant.menuItems.length > 0) {
    lines.push('MENU ITEMS (use these for content ideas — mention real dish names):')
    const grouped: Record<string, MenuItem[]> = {}
    for (const item of data.restaurant.menuItems) {
      ;(grouped[item.category] ??= []).push(item)
    }
    for (const [cat, items] of Object.entries(grouped)) {
      lines.push(`  ${cat}: ${items.map(i => `${i.name}${i.price ? ` (₹${i.price})` : ''}`).join(', ')}`)
    }
    if (data.restaurant.features?.length) {
      lines.push(`FEATURES: ${data.restaurant.features.join(', ')}`)
    }
  }

  if (data.salon?.services && data.salon.services.length > 0) {
    lines.push('SERVICES OFFERED:')
    const grouped: Record<string, ServiceItem[]> = {}
    for (const svc of data.salon.services) {
      ;(grouped[svc.category] ??= []).push(svc)
    }
    for (const [cat, items] of Object.entries(grouped)) {
      lines.push(`  ${cat}: ${items.map(i => `${i.name}${i.price ? ` (₹${i.price})` : ''}`).join(', ')}`)
    }
    if (data.salon.bookingType) lines.push(`BOOKING: ${data.salon.bookingType}`)
  }

  if (data.clinic) {
    if (data.clinic.specializations?.length) {
      lines.push(`SPECIALIZATIONS: ${data.clinic.specializations.join(', ')}`)
    }
    if (data.clinic.treatments?.length) {
      lines.push(`TREATMENTS: ${data.clinic.treatments.map(t => t.name).join(', ')}`)
    }
    if (data.clinic.consultationType) lines.push(`CONSULTATION: ${data.clinic.consultationType}`)
  }

  if (data.fitness) {
    if (data.fitness.programs?.length) {
      lines.push(`PROGRAMS: ${data.fitness.programs.map(p => p.name).join(', ')}`)
    }
    if (data.fitness.facilities?.length) {
      lines.push(`FACILITIES: ${data.fitness.facilities.join(', ')}`)
    }
  }

  if (data.retail) {
    if (data.retail.productCategories?.length) {
      lines.push(`PRODUCT CATEGORIES: ${data.retail.productCategories.join(', ')}`)
    }
    if (data.retail.brands?.length) lines.push(`BRANDS: ${data.retail.brands.join(', ')}`)
    if (data.retail.priceRange) lines.push(`PRICE RANGE: ${data.retail.priceRange}`)
  }

  if (data.generic?.offerings?.length) {
    lines.push(`SERVICES/OFFERINGS: ${data.generic.offerings.map(o => o.name).join(', ')}`)
  }

  return lines.join('\n')
}
