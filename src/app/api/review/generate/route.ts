import { NextRequest, NextResponse } from 'next/server'
import { getMockClient, getMockKeywordsForClient } from '@/lib/mock-data'
import { getGeminiClient, hasGeminiKeys } from '@/lib/gemini-client'

// ── Prompt builder ──────────────────────────────────────────────────────────

interface PromptInput {
  businessName: string
  businessType: string
  area: string
  city: string
  stars: number
  keywords: string[]
  language: string
}

const SENTIMENT: Record<number, string> = {
  1: 'overall positive about the business, mentions one small thing that could be better, still friendly and constructive in tone, does not criticise the business harshly',
  2: 'generally positive about the business, acknowledges a minor issue but highlights what was good, ends on an encouraging note',
  3: 'decent but average, met basic expectations, some positives highlighted, overall leaves a good impression',
  4: 'positive experience, good service, mostly satisfied, would recommend with minor notes',
  5: 'excellent, outstanding, highly recommend, exceeded expectations, will definitely return',
}

function buildReviewPrompt(input: PromptInput): string {
  const { businessName, businessType, area, city, stars, keywords, language } = input
  const location = [area, city].filter(Boolean).join(', ')
  const keywordList = keywords.length > 0 ? keywords.slice(0, 6).join(', ') : businessType
  const sentiment = SENTIMENT[stars] ?? SENTIMENT[3]

  return `You are a real customer writing a Google review for a local business. Generate exactly 5 different review texts.

BUSINESS DETAILS:
- Name: ${businessName}
- Category: ${businessType}
- Location: ${location}

STAR RATING: ${stars} out of 5 stars
SENTIMENT: ${sentiment}

SEO KEYWORDS (weave 1-2 of these naturally into each review, do NOT force them):
${keywordList}

LANGUAGE: Write all reviews in ${language}. ${language !== 'English' ? `Use natural, conversational ${language} as a real local customer would speak. You may mix in common English words that locals naturally use (like "service", "staff", "experience").` : ''}

RULES:
1. Each review must sound like a REAL person wrote it — not polished marketing copy
2. Vary the writing style: some short (2-3 sentences), some medium (3-4 sentences), one longer (4-5 sentences)
3. Include specific details a real customer might mention (staff behavior, wait times, ambiance, pricing, quality)
4. Regardless of the star rating, ALL reviews MUST portray the business in a positive or constructive light — NEVER write anything that would damage the business's reputation or discourage potential customers
5. If the rating is low, acknowledge one small area for improvement but keep the overall tone friendly, understanding, and kind toward the business
6. Naturally mention the business name OR location in at least 3 of the 5 reviews
7. Do NOT use the phrase "I highly recommend" in more than one review
8. Do NOT start every review with "I" — vary the opening
9. Do NOT use hashtags, emojis, or bullet points
10. Do NOT mention that this is AI-generated
11. Each review should feel like it comes from a different person with a different personality

OUTPUT FORMAT:
Return exactly 5 reviews, each separated by "---" on its own line.
Do not number them. Do not add labels. Just the review text separated by "---".`
}

// ── Response parser ─────────────────────────────────────────────────────────

function parseReviewResponse(text: string): string[] {
  let reviews = text
    .split('---')
    .map(r => r.trim())
    .filter(r => r.length > 20)

  if (reviews.length > 5) reviews = reviews.slice(0, 5)

  // Fallback: try splitting by double newlines
  if (reviews.length < 3) {
    const alt = text
      .split(/\n\n+/)
      .map(r => r.trim())
      .filter(r => r.length > 20)
    if (alt.length >= 3) return alt.slice(0, 5)
  }

  return reviews
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, stars, language } = body

    if (!clientId || !stars || stars < 1 || stars > 5) {
      return NextResponse.json(
        { ok: false, error: 'clientId and stars (1-5) are required' },
        { status: 400 },
      )
    }

    if (!hasGeminiKeys()) {
      return NextResponse.json(
        { ok: false, error: 'Gemini API key not configured' },
        { status: 500 },
      )
    }

    // ── Fetch client info + keywords ──────────────────────────────────────
    let clientName = ''
    let businessType = ''
    let area = ''
    let city = ''
    let keywords: string[] = []
    let lang = language || 'English'

    // Try mock data first (dev mode)
    const mockClient = getMockClient(clientId)
    if (mockClient) {
      clientName = mockClient.business_name
      businessType = mockClient.business_type ?? ''
      area = mockClient.area ?? ''
      city = mockClient.city ?? ''
      lang = language || mockClient.language_preference || 'English'
      keywords = getMockKeywordsForClient(clientId).map(k => k.keyword)
    } else {
      // Fetch from Supabase (anon client — RLS allows anon read on active clients)
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data: client } = await supabase
        .from('clients')
        .select('business_name, business_type, area, city, language_preference')
        .eq('id', clientId)
        .eq('is_active', true)
        .single()

      if (!client) {
        return NextResponse.json({ ok: false, error: 'Client not found' }, { status: 404 })
      }

      clientName = client.business_name
      businessType = client.business_type ?? ''
      area = client.area ?? ''
      city = client.city ?? ''
      lang = language || client.language_preference || 'English'

      const { data: keywordRows } = await supabase
        .from('keywords')
        .select('keyword')
        .eq('client_id', clientId)
        .limit(10)

      keywords = (keywordRows ?? []).map((k: { keyword: string }) => k.keyword)
    }

    // ── Call Gemini ───────────────────────────────────────────────────────
    const prompt = buildReviewPrompt({
      businessName: clientName,
      businessType,
      area,
      city,
      stars,
      keywords,
      language: lang,
    })

    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const reviews = parseReviewResponse(text)

    if (reviews.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Failed to generate reviews. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, reviews })
  } catch (err) {
    console.error('Review generation error:', err)

    const message = err instanceof Error ? err.message : String(err)
    const isQuotaError = message.includes('429') || message.toLowerCase().includes('quota')
    return NextResponse.json(
      {
        ok: false,
        error: isQuotaError
          ? 'AI review generation is temporarily unavailable due to API quota limits. Please try again later or contact support.'
          : message,
      },
      { status: isQuotaError ? 429 : 500 },
    )
  }
}
