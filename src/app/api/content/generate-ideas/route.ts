import { NextRequest, NextResponse } from 'next/server'
import { withKeyRetry, hasGeminiKeys } from '@/lib/gemini-client'

export const maxDuration = 30 // Vercel: allow up to 30s for idea generation
import { getGemConfig } from '@/lib/gem-instructions'
import { loadLocalGemInstructions } from '@/lib/gem-config-loader'
import { getNearestOccasion } from '@/lib/occasion-lookup'
import { readSectorData, buildSectorPromptContext } from '@/lib/client-sector-data'
import type { OccasionContext } from '@/lib/occasion-lookup'

// Extract menu items from gem_instructions if an "OFFICIAL MENU" section exists
export function extractMenuFromGemInstructions(gemInstructions: string): string {
  const menuIdx = gemInstructions.search(/OFFICIAL MENU/)
  if (menuIdx < 0) return ''
  const strictIdx = gemInstructions.search(/STRICT RESTRICTIONS/)
  const end = strictIdx > menuIdx ? strictIdx : undefined
  return gemInstructions.slice(menuIdx, end).trim()
}

export function buildIdeaPrompt(input: {
  businessName: string
  businessType: string
  city: string
  area: string
  brandTone: string
  contentPillars: string[]
  approvedPostTypes: string[]
  keywords: string[]
  count: number
  menuContext?: string
  gemInstructions?: string
  occasionContext?: string | null
  sectorContext?: string | null
}): string {
  const { businessName, businessType, city, area, brandTone, contentPillars, approvedPostTypes, keywords, count, menuContext, gemInstructions, occasionContext, sectorContext } = input
  const location = [area, city].filter(Boolean).join(', ')

  // Food business with a fixed menu — generate dish-focused ideas only
  if (menuContext) {
    // Detect language from gem_instructions — only use Marathi if explicitly specified
    const usesMarathi = gemInstructions ? /marathi|devanagari|मराठी/i.test(gemInstructions) : false
    const descriptionRule = usesMarathi
      ? `description = a short Marathi (Devanagari script) tagline/quote (10-20 words) that describes the taste/mood of that dish — e.g. "खुसखुशीत मोमोज, तिखट चटणीसोबत गरमागरम!"`
      : `description = a short, catchy English tagline/quote (10-20 words) that describes the taste/mood of that dish — e.g. "Crispy golden perfection, loaded with cheesy goodness!"`
    const descriptionExample = usesMarathi
      ? `"मराठी टॅगलाइन — 10-20 शब्द"`
      : `"Catchy English tagline — 10-20 words"`

    const occasionBlockFood = occasionContext
      ? `\nUPCOMING OCCASION (${occasionContext}) — include 1 idea that creatively ties this occasion to a specific dish or menu item. Remaining ideas = regular dish-focused posts.\n`
      : ''

    return `You are a social media content planner for ${businessName}, a ${businessType} restaurant in ${location}, India.
Generate exactly ${count} post ideas. Each idea must be about ONE specific dish from the official menu below.

BRAND TONE: ${brandTone}
APPROVED POST TYPES: ${approvedPostTypes.join(', ')}
${occasionBlockFood}
${menuContext}

RULES:
1. Each idea title = the exact dish name (English, as written in menu above)
2. ${descriptionRule}
3. Pick a variety of dishes from different menu categories
4. post_type = "Photos" always (these are food image posts)
5. platform = ["Instagram", "Facebook"] always

RETURN a raw JSON array. No markdown, no backticks, just valid JSON:
[
  {
    "title": "Exact Dish Name From Menu",
    "description": ${descriptionExample},
    "post_type": "Photos",
    "content_pillar": "Menu Highlight",
    "keywords_used": [],
    "platform": ["Instagram", "Facebook"]
  }
]`
  }

  // Default — generic content ideas for non-food or unstructured businesses
  const brandContext = gemInstructions
    ? `\nBRAND CONFIGURATION (use for business understanding — products, services, restrictions, tone — ignore any visual/image rules):
${gemInstructions}
`
    : ''

  const occasionBlock = occasionContext
    ? `\nUPCOMING OCCASION (${occasionContext})\n— Include 1-2 ideas that naturally connect this occasion to the business. Keep them authentic, not forced. Remaining ideas = regular service/product content.\n`
    : ''

  const sectorBlock = sectorContext
    ? `\nBUSINESS OFFERINGS (use these to generate specific, relevant ideas — mention real services/products):\n${sectorContext}\n`
    : ''

  return `You are a social media content strategist for a local Indian business.
Generate exactly ${count} unique content post ideas for this business.

BUSINESS:
- Name: ${businessName}
- Type: ${businessType}
- Location: ${location}
- Brand Tone: ${brandTone}
- Content Pillars: ${contentPillars.join(', ')}
- Approved Post Types: ${approvedPostTypes.join(', ')}
- Target Keywords (weave naturally): ${keywords.join(', ')}
${brandContext}${occasionBlock}${sectorBlock}
RULES:
1. Each idea must directly relate to a content pillar or the company's core services
2. Spread ideas across the approved post types
3. Keep ideas focused on the product/service — NOT generic lifestyle content
4. Ideas should serve SEO by naturally mentioning keywords
5. Mix educational tips, client success stats, feature showcases, and CTAs
6. Keep titles short and catchy (under 60 chars)
7. Consider current tech trends: AI adoption, mobile-first, SaaS growth, startup ecosystem — use them when relevant, otherwise use timeless service messaging
${gemInstructions ? '8. Follow any content restrictions or brand rules mentioned in BRAND CONFIGURATION\n' : ''}
CRITICAL — THE "description" FIELD:
The "description" must be a short, punchy hook or tagline (10-25 words) — like a catchy opening line or quote for the post.
- NOT a full caption or long paragraph
- Think: first line that stops the scroll
- On-brand, specific to the idea title
- Can be a question, stat, bold statement, or catchy phrase

RETURN a raw JSON array. No markdown, no backticks, just valid JSON:
[
  {
    "title": "...",
    "description": "Short punchy hook or tagline (10-25 words)",
    "post_type": "Tips|Photos|Case Studies|Behind the Scenes|Feature Showcase",
    "content_pillar": "...",
    "keywords_used": ["keyword1"],
    "platform": ["Instagram", "LinkedIn"]
  }
]`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, trendingContext } = body
    const count = typeof body.count === 'number' ? body.count : 8
    const targetDate: string | undefined = typeof body.targetDate === 'string' ? body.targetDate : undefined

    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json({ ok: false, error: 'clientId is required' }, { status: 400 })
    }
    if (trendingContext !== undefined && typeof trendingContext !== 'string') {
      return NextResponse.json({ ok: false, error: 'trendingContext must be a string' }, { status: 400 })
    }
    if (typeof trendingContext === 'string' && trendingContext.length > 300) {
      return NextResponse.json({ ok: false, error: 'trendingContext too long (max 300 chars)' }, { status: 400 })
    }

    if (!hasGeminiKeys()) {
      return NextResponse.json({ ok: false, error: 'Gemini API key not configured' }, { status: 500 })
    }

    // Fetch client data from Supabase
    let businessName = ''
    let businessType = ''
    let city = ''
    let area = ''
    let brandTone = 'Professional'
    let contentPillars: string[] = []
    let approvedPostTypes: string[] = ['Tips', 'Photos', 'Events']
    let gemInstructions = ''
    let keywords: string[] = []

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: client } = await supabase
      .from('clients')
      .select('business_name, business_type, city, area')
      .eq('id', clientId)
      .single()
    if (!client) {
      return NextResponse.json({ ok: false, error: 'Client not found' }, { status: 404 })
    }
    businessName = client.business_name
    businessType = client.business_type ?? ''
    city = client.city ?? ''
    area = client.area ?? ''

    const { data: branding } = await supabase
      .from('branding_profiles')
      .select('brand_tone, content_pillars, approved_post_types, gem_instructions')
      .eq('client_id', clientId)
      .single()
    if (branding) {
      brandTone = branding.brand_tone ?? 'Professional'
      contentPillars = (branding.content_pillars as string[]) ?? []
      approvedPostTypes = (branding.approved_post_types as string[]) ?? ['Tips', 'Photos', 'Events']
      gemInstructions = (branding.gem_instructions as string) ?? ''
    }

    const { data: keywordRows } = await supabase
      .from('keywords')
      .select('keyword')
      .eq('client_id', clientId)
      .limit(10)
    keywords = (keywordRows ?? []).map((k: { keyword: string }) => k.keyword)

    // Fallback 1: local gem config file (data/gem-configs/{clientId}.json)
    if (!gemInstructions) {
      const localInstructions = await loadLocalGemInstructions(clientId)
      if (localInstructions) {
        gemInstructions = localInstructions
        console.log(`[GenerateIdeas] Using local gem-config file for ${businessName}`)
      }
    }

    // Fallback 2: hardcoded gem-instructions.ts by business_name
    if (!gemInstructions) {
      const gemConfig = getGemConfig(businessName)
      if (gemConfig) {
        gemInstructions = gemConfig.gemInstructions
      }
    }

    // Sector-specific structured data (local file per client)
    const sectorData = await readSectorData(clientId)
    const sectorContext = sectorData ? buildSectorPromptContext(sectorData) : null

    // Extract menu from gem_instructions if no structured sector data exists
    const menuContext = (!sectorData?.restaurant?.menuItems?.length && gemInstructions)
      ? extractMenuFromGemInstructions(gemInstructions)
      : ''

    // Occasion / trend context
    let occasionContext: string | null = null
    if (trendingContext?.trim()) {
      occasionContext = trendingContext.trim()
    } else {
      const occasion: OccasionContext | null = await getNearestOccasion(targetDate)
      if (occasion) {
        const timing = occasion.daysAway === 0 ? 'TODAY' : `in ${occasion.daysAway} day${occasion.daysAway > 1 ? 's' : ''}`
        occasionContext = `${occasion.name} (${occasion.displayDate} — ${timing}) — ${occasion.description}`
      }
    }

    const prompt = buildIdeaPrompt({
      businessName, businessType, city, area,
      brandTone, contentPillars, approvedPostTypes, keywords,
      count: Math.min(count, 31),
      menuContext: menuContext || undefined,
      gemInstructions: gemInstructions || undefined,
      occasionContext,
      sectorContext: sectorContext || null,
    })

    const text = await withKeyRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        // gem_instructions are visual-only — do NOT use as systemInstruction for idea generation
      })
      return response.text ?? ''
    })

    // Parse JSON from response (strip markdown fences if present)
    const cleaned = text.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim()
    let ideas: unknown
    try {
      ideas = JSON.parse(cleaned)
    } catch {
      console.error('[GenerateIdeas] Invalid JSON from AI:', cleaned.slice(0, 200))
      return NextResponse.json({ ok: false, error: 'AI returned an invalid response. Please try again.' }, { status: 500 })
    }

    if (!Array.isArray(ideas) || ideas.length === 0) {
      return NextResponse.json({ ok: false, error: 'Failed to generate ideas' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, ideas })
  } catch (err) {
    console.error('Generate ideas error:', err)
    const message = err instanceof Error ? err.message : String(err)
    const isQuota = message.includes('429') || message.toLowerCase().includes('quota')
    return NextResponse.json(
      { ok: false, error: isQuota ? 'API quota exceeded. Try again later.' : message },
      { status: isQuota ? 429 : 500 },
    )
  }
}