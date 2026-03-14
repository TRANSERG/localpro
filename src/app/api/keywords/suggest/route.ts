import { NextRequest, NextResponse } from 'next/server'
import { getMockClient } from '@/lib/mock-data'
import { getGeminiClient, hasGeminiKeys } from '@/lib/gemini-client'

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildKeywordPrompt(
  businessName: string,
  businessType: string,
  area: string,
  city: string,
): string {
  return `You are a local SEO expert specializing in the Indian market.

Generate a list of 20 relevant search keywords for the following business:

Business Name: ${businessName}
Business Type: ${businessType}
City: ${city}
Neighborhood/Area: ${area}

Return ONLY a valid JSON array. No explanation, no markdown, no code block. Just the raw JSON array.

Each object in the array must have exactly these fields:
- "keyword": the search phrase (string)
- "keyword_type": one of ["Service+Location", "Near Me", "Emergency", "Best/Top", "Affordable", "Problem Based", "Neighborhood", "Service Specific", "Question Based", "Brand"]
- "monthly_search_volume": estimated monthly searches in India (number, realistic for a city-level keyword)
- "competition": one of ["Low", "Medium", "High"]
- "priority": one of ["High", "Medium", "Low"] — your recommendation based on opportunity vs competition

Rules:
- Mix keyword types (don't just do Service+Location)
- Include neighborhood-specific, near-me, emergency, and question-based variants
- Volume should reflect Indian local search reality (city-level keywords rarely exceed 10,000/mo)
- Prioritize keywords with decent volume and Low/Medium competition
- Do NOT include branded keywords unless the business name is the keyword itself`
}

// ── Response parser ───────────────────────────────────────────────────────────

interface RawSuggestion {
  keyword: string
  keyword_type: string
  monthly_search_volume: number
  competition: 'Low' | 'Medium' | 'High'
  priority: 'High' | 'Medium' | 'Low'
}

function parseKeywordResponse(text: string): RawSuggestion[] {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim()

  const parsed = JSON.parse(cleaned)

  if (!Array.isArray(parsed)) throw new Error('Expected JSON array')

  return parsed
    .filter((item: RawSuggestion) => item.keyword && item.keyword_type && item.monthly_search_volume)
    .slice(0, 20)
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json()

    if (!clientId) {
      return NextResponse.json({ ok: false, error: 'clientId is required' }, { status: 400 })
    }

    if (!hasGeminiKeys()) {
      return NextResponse.json({ ok: false, error: 'Gemini API key not configured' }, { status: 500 })
    }

    // ── Fetch client info ─────────────────────────────────────────────────
    let businessName = ''
    let businessType = ''
    let area = ''
    let city = ''

    const mockClient = getMockClient(clientId)
    if (mockClient) {
      businessName = mockClient.business_name
      businessType = mockClient.business_type ?? ''
      area = mockClient.area ?? ''
      city = mockClient.city ?? ''
    } else {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data: client } = await supabase
        .from('clients')
        .select('business_name, business_type, area, city')
        .eq('id', clientId)
        .eq('is_active', true)
        .single()

      if (!client) {
        return NextResponse.json({ ok: false, error: 'Client not found' }, { status: 404 })
      }

      businessName = client.business_name
      businessType = client.business_type ?? ''
      area = client.area ?? ''
      city = client.city ?? ''
    }

    // ── Call Gemini ───────────────────────────────────────────────────────
    const prompt = buildKeywordPrompt(businessName, businessType, area, city)
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const suggestions = parseKeywordResponse(text)

    if (suggestions.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No keywords generated. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, suggestions })
  } catch (err) {
    console.error('Keyword suggestion error:', err)
    const message = err instanceof Error ? err.message : String(err)
    const isQuota = message.includes('429') || message.toLowerCase().includes('quota')
    return NextResponse.json(
      { ok: false, error: isQuota ? 'API quota limit reached. Please try again later.' : message },
      { status: isQuota ? 429 : 500 },
    )
  }
}
