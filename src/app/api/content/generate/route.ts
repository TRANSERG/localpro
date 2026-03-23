import { NextRequest, NextResponse } from 'next/server'
import { Modality } from '@google/genai'
import { createClient as createStorageSupabase } from '@/lib/supabase/server'
import { withKeyRetry, hasGeminiKeys } from '@/lib/gemini-client'
import { getGemConfig } from '@/lib/gem-instructions'
import { loadLocalGemInstructions, loadTextOverlayConfig, loadImageModel } from '@/lib/gem-config-loader'
import { applyDevanagariOverlay, resolveDishName, resolveTagline } from '@/lib/image-text-overlay'
import { ANNABRAHMA_PHRASES, lookupTagline } from '@/lib/devanagari-phrases'
import { readSectorData, buildSectorPromptContext } from '@/lib/client-sector-data'

const REALISM_PREAMBLE = `IMAGE QUALITY BASELINE (apply alongside all other visual rules):
- Photorealistic output — real-world physics, real lighting, real textures
- No plastic/shiny/waxy surfaces — materials must look physically accurate
- No AI-art giveaways — no morphed details, no impossible reflections
- Real texture: grains in bread, bubbles in cheese, genuine steam, real fabric weave
- Target: indistinguishable from a professional photograph (90%+ realism)`

const PLATFORM_LIMITS: Record<string, number> = {
  Instagram: 2200,
  Facebook: 5000,
  GBP: 1500,
  WhatsApp: 1000,
}

export function buildCaptionPrompt(input: {
  businessName: string
  businessType: string
  city: string
  area: string
  phone: string
  brandTone: string
  hashtagBank: string
  captionTemplates: string
  contentDos: string
  contentDonts: string
  keywords: string[]
  platform: string
  ideaTitle: string
  ideaDescription: string
  sectorContext?: string | null
}): string {
  const limit = PLATFORM_LIMITS[input.platform] ?? 2200
  const sectorBlock = input.sectorContext
    ? `\nBUSINESS OFFERINGS (reference these when relevant — mention real services/products/dishes naturally):\n${input.sectorContext}\n`
    : ''
  return `You are a social media copywriter for ${input.businessName}, a ${input.businessType} in ${[input.area, input.city].filter(Boolean).join(', ')}, India.

BRAND GUIDELINES:
- Tone: ${input.brandTone}
- Caption Templates: ${input.captionTemplates || 'None provided'}
- Hashtag Bank: ${input.hashtagBank || 'None provided'}
- Do's: ${input.contentDos || 'None'}
- Don'ts: ${input.contentDonts || 'None'}
${sectorBlock}

SEO KEYWORDS (weave 1-2 naturally into caption): ${input.keywords.join(', ')}
HASHTAG STRATEGY: Build hashtags using these keywords as primary seeds. Mix: location hashtags (#${input.city.replace(/\s+/g, '')} style), service hashtags derived from keywords, niche discovery hashtags, and 2-3 brand hashtags.

POST DETAILS:
- Idea: ${input.ideaTitle}
- Brief: ${input.ideaDescription}
- Platform: ${input.platform}
- Contact: ${input.phone}

Write a creative, innovative ${input.platform} caption. Be authentic and on-brand.
- Focus on the post topic, emotion, and value — NOT a corporate press release
- Do NOT force the business name into every line — mention it once only if it feels completely natural, otherwise skip it entirely
- Avoid generic filler phrases like "we are excited to share" or "check us out"
- Make the first line a strong hook that stops the scroll
Include a clear CTA. Stay under ${limit} characters.

OUTPUT FORMAT (use these exact delimiters):
---CAPTION---
[full caption text here]
---HASHTAGS---
[15-20 hashtags space-separated — must include keyword-based hashtags, location tags, and niche discovery tags]`
}

export function buildImagePrompt(input: {
  businessName: string
  businessType: string
  city: string
  area: string
  brandTone: string
  primaryColor: string
  secondaryColor: string
  phone: string
  websiteUrl: string
  keywords: string[]
  ideaTitle: string
  ideaDescription: string
  hasLogo: boolean
  hasReferenceImages?: boolean
  gemInstructions: string
  imageRatio?: string
  marathiContext?: { dishName: string; tagline: string; addressBar: string } | null
}): string {
  // When gem_instructions exist: send only the dish/topic as content.
  // The full gem_instructions will be passed as systemInstruction in the API call.
  if (input.gemInstructions) {
    const ratioLabel: Record<string, string> = {
      '1:1': 'Square Post (1:1)',
      '3:4': 'Portrait Post (4:5)',
      '9:16': 'Story (9:16)',
      '16:9': 'Landscape (16:9)',
      '4:3': 'Wide Post (4:3)',
    }
    const formatStr = ratioLabel[input.imageRatio ?? '3:4'] ?? 'Portrait Post (4:5)'

    const logoLine = input.hasLogo
      ? '\nLOGO: The attached image is the brand logo. Place it exactly as specified in the visual rules.'
      : ''

    const isFoodBusiness = /restaurant|cafe|café|food|chinese|bar|dhaba|bakery|sweet/i.test(input.businessType)
    const contentLabel = isFoodBusiness ? 'DISH' : 'TOPIC'

    const refLine = input.hasReferenceImages
      ? '\nSTYLE INSPIRATION: Reference images define the visual style and brand layout. For the BOTTOM ADDRESS/CONTACT BAR: copy its text content and layout style exactly as shown in the reference images. For PHONE NUMBER and WEBSITE: use ONLY the values from the MANDATORY CONTACT DETAILS section below — override what the reference images show for those specific fields.'
      : ''

    const contactLine = [
      input.phone ? `Phone: ${input.phone}` : '',
      input.websiteUrl ? `Website: ${input.websiteUrl}` : '',
    ].filter(Boolean).join('\n')

    const marathiBlock = input.marathiContext
      ? `\n\nMARATHI TEXT TO RENDER IN IMAGE (copy exactly — do NOT modify spelling):
MARATHI DISH NAME: ${input.marathiContext.dishName}
MARATHI TAGLINE: ${input.marathiContext.tagline}
ADDRESS BAR TEXT: ${input.marathiContext.addressBar}`
      : ''

    return `${contentLabel}: ${input.ideaTitle}
FORMAT: ${formatStr}${input.ideaDescription ? `\nVISUAL CONTEXT (for image design only — do NOT render this as text on image): ${input.ideaDescription.slice(0, 80)}` : ''}${logoLine}${refLine}
${contactLine ? `\nMANDATORY CONTACT DETAILS (use these EXACTLY in the contact bar — do not use any other values):\n${contactLine}\n` : ''}${marathiBlock}
Follow your system instructions exactly for all visual style, text content, language, branding, and layout. Generate a completely new original image.`
  }

  // Auto-built prompt from branding data (no gem_instructions)
  const location = [input.area, input.city].filter(Boolean).join(', ') || 'India'
  const footer = [input.phone, input.websiteUrl].filter(Boolean).join(' | ')

  // Business-type visual guidance
  const VISUAL_GUIDE: Record<string, string> = {
    restaurant: 'Ultra-realistic food photography. ONE hero dish centered, dramatic studio lighting, steam or drips visible, dark matte ceramic plating, floating ingredients/spices, shallow depth of field with bokeh.',
    cafe: 'Ultra-realistic food/beverage photography. Hero drink or dish centered, warm café ambiance lighting, steam rising, cozy Indian café aesthetic.',
    'it & technology': 'Clean infographic illustration. 3D isometric device (phone/laptop) with floating callout labels, or a hub diagram with service icons. White background with subtle grid texture.',
    technology: 'Clean infographic illustration. Device mockups, dashboard screenshots, circular service diagrams. Professional tech aesthetic.',
    gym: 'High-energy fitness lifestyle. Bold typography overlaid on a dynamic gym/workout background. Indian faces, real equipment, motivational.',
    fitness: 'High-energy fitness lifestyle. Bold typography overlaid on a dynamic workout background. Real people, Indian aesthetic.',
    dental: 'Clean, clinical, trustworthy. Bright white background, subtle dental imagery, professional medical aesthetic.',
    medical: 'Clean, clinical, trustworthy. Professional medical aesthetic with Indian context.',
    plumbing: 'Before/after style or work-in-progress. Real tools, Indian home context, trustworthy professional look.',
    salon: 'Glamorous, warm lighting. Hair/beauty product hero shot or before/after, Indian aesthetic.',
  }
  const bizLower = input.businessType.toLowerCase()
  const visualGuide = Object.entries(VISUAL_GUIDE).find(([k]) => bizLower.includes(k))?.[1]
    ?? 'Product/service focused hero visual. Clean Indian aesthetic, realistic, professional.'

  const logoInstruction = input.hasLogo
    ? '\n\nLOGO: The attached image is the brand logo. Place it top-right as a small badge. Do NOT alter or redesign it.'
    : ''

  const keywordHint = input.keywords.length
    ? `\nSEO CONTEXT (weave 1-2 naturally into visible text): ${input.keywords.slice(0, 5).join(', ')}`
    : ''

  return `Generate a professional social media poster image.

TOPIC: "${input.ideaTitle}"
${input.ideaDescription ? `VISUAL SUBJECT (decide what to show — do NOT render this as paragraph text on the image): "${input.ideaDescription.slice(0, 120)}"` : ''}

BUSINESS: ${input.businessName} — ${input.businessType} in ${location}, India

BRAND COLORS:
- Primary: ${input.primaryColor} (use for headline accents, CTA button, key graphic elements)
- Secondary: ${input.secondaryColor} (use for supporting text, dividers, secondary elements)

VISUAL STYLE — ${input.brandTone.toUpperCase()} TONE:
${visualGuide}

LAYOUT:
- TOP: Business name or short punchy headline in primary color
- MIDDLE (60%): Main visual (follow VISUAL STYLE above)
- BOTTOM: CTA button (rounded, primary color background, white text)${footer ? `\n- FOOTER: Small pill bar — "${footer}"` : ''}

RULES:
- Indian regional context — visuals must feel local and authentic
- Photorealistic quality — NOT illustrated, NOT cartoon, NOT stock clip art
- Image text overlay: ultra-short phrase (3-5 words max) — NOT a sentence; use a creative display font style (bold condensed | calligraphic script | modern geometric sans-serif | vintage poster serif | art deco) — vary the style each time
- All text must be clean, legible, properly hierarchical with strong contrast
- Real product/service visuals that match the topic exactly${keywordHint}${logoInstruction}

IMAGE QUALITY (mandatory):
- PHOTOREALISTIC — real-world physics, real lighting, real textures
- NO plastic/shiny/waxy surfaces — materials must look physically accurate
- NO AI-art giveaways — no morphed details, no impossible reflections
- Target: indistinguishable from a professional photograph (100% realism)`
}

async function fetchLogoAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? 'image/png'
    const arrayBuffer = await res.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    return { data: base64, mimeType: contentType.split(';')[0] }
  } catch {
    return null
  }
}

async function loadReferenceImages(clientId: string): Promise<Array<{ data: string; mimeType: string }>> {
  try {
    const supabase = await createStorageSupabase()
    const { data: files, error } = await supabase.storage
      .from('reference-images')
      .list(clientId, { sortBy: { column: 'created_at', order: 'desc' } })

    if (error || !files) return []

    const imageFiles = files
      .filter((f: { name: string }) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
      .slice(0, 5)

    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg',
      png: 'image/png', webp: 'image/webp', gif: 'image/gif',
    }

    const results: Array<{ data: string; mimeType: string }> = []
    for (const f of imageFiles) {
      const { data: blob, error: dlErr } = await supabase.storage
        .from('reference-images')
        .download(`${clientId}/${f.name}`)
      if (dlErr || !blob) continue
      const buffer = Buffer.from(await blob.arrayBuffer())
      const ext = f.name.split('.').pop()?.toLowerCase() ?? 'png'
      results.push({ data: buffer.toString('base64'), mimeType: mimeMap[ext] ?? 'image/png' })
    }
    return results
  } catch {
    return []
  }
}

export function parseCaptionResponse(text: string): { caption: string; hashtags: string } {
  const captionMatch = text.match(/---CAPTION---\s*([\s\S]*?)(?:---HASHTAGS---|$)/)
  const hashtagsMatch = text.match(/---HASHTAGS---\s*([\s\S]*)$/)
  return {
    caption: captionMatch?.[1]?.trim() ?? text.trim(),
    hashtags: hashtagsMatch?.[1]?.trim() ?? '',
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, entryId, ideaTitle, ideaDescription, generateImage = false, gemInstructions: bodyGemInstructions, brandLogoUrl: bodyLogoUrl } = body

    const ALLOWED_PLATFORMS = ['Instagram', 'Facebook', 'GBP', 'WhatsApp', 'LinkedIn']
    const ALLOWED_RATIOS = ['1:1', '3:4', '9:16', '16:9', '4:3']
    const platform = ALLOWED_PLATFORMS.includes(body.platform) ? body.platform : 'Instagram'
    const imageRatio = ALLOWED_RATIOS.includes(body.imageRatio) ? body.imageRatio : '3:4'

    if (!clientId || typeof clientId !== 'string' || !ideaTitle || typeof ideaTitle !== 'string') {
      return NextResponse.json({ ok: false, error: 'clientId and ideaTitle are required' }, { status: 400 })
    }

    if (!hasGeminiKeys()) {
      return NextResponse.json({ ok: false, error: 'Gemini API key not configured' }, { status: 500 })
    }

    // Fetch client data
    let businessName = ''
    let businessType = ''
    let city = ''
    let area = ''
    let phone = ''
    let websiteUrl = ''
    let brandTone = 'Professional'
    let primaryColor = '#3b82f6'
    let secondaryColor = '#1a1a1a'
    let logoUrl = ''
    let hashtagBank = ''
    let captionTemplates = ''
    let contentDos = ''
    let contentDonts = ''
    let gemInstructions = ''
    let keywords: string[] = []

    // Fetch client data from Supabase
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: client } = await supabase
      .from('clients')
      .select('business_name, business_type, city, area, phone, website_url')
      .eq('id', clientId)
      .single()
    if (!client) {
      return NextResponse.json({ ok: false, error: 'Client not found' }, { status: 404 })
    }
    businessName = client.business_name
    businessType = client.business_type ?? ''
    city = client.city ?? ''
    area = client.area ?? ''
    phone = client.phone ?? ''
    websiteUrl = client.website_url ?? ''

    const { data: branding } = await supabase
      .from('branding_profiles')
      .select('*')
      .eq('client_id', clientId)
      .single()
    if (branding) {
      brandTone = branding.brand_tone ?? 'Professional'
      primaryColor = branding.primary_color ?? '#3b82f6'
      secondaryColor = branding.secondary_color ?? '#1a1a1a'
      logoUrl = branding.logo_url ?? ''
      hashtagBank = branding.hashtag_bank ?? ''
      captionTemplates = branding.caption_templates ?? ''
      contentDos = branding.content_dos ?? ''
      contentDonts = branding.content_donts ?? ''
      gemInstructions = branding.gem_instructions ?? ''
    }

    const { data: keywordRows } = await supabase
      .from('keywords')
      .select('keyword')
      .eq('client_id', clientId)
      .limit(10)
    keywords = (keywordRows ?? []).map((k: { keyword: string }) => k.keyword)

    // Primary: use gem_instructions from client-side (loaded from gem-config API)
    if (bodyGemInstructions) {
      gemInstructions = bodyGemInstructions
      console.log(`[Generate] Using gem_instructions from client-side for ${businessName}`)
    }
    if (bodyLogoUrl && !logoUrl) logoUrl = bodyLogoUrl

    // Fallback 1: local gem config file (data/gem-configs/{clientId}.json)
    if (!gemInstructions) {
      const localInstructions = await loadLocalGemInstructions(clientId)
      if (localInstructions) {
        gemInstructions = localInstructions
        console.log(`[Generate] Using local gem-config file for ${businessName}`)
      }
    }

    // Fallback 2: hardcoded gem-instructions.ts by business_name
    if (!gemInstructions) {
      const gemConfig = getGemConfig(businessName)
      if (gemConfig) {
        gemInstructions = gemConfig.gemInstructions
        if (!logoUrl && gemConfig.logoUrl) logoUrl = gemConfig.logoUrl
        console.log(`[Generate] Using gem-instructions.ts fallback for ${businessName}`)
      }
    }

    console.log(`[Generate] Client: ${businessName}, gemInstructions: ${gemInstructions ? gemInstructions.slice(0, 50) + '...' : 'NONE'}, logoUrl: ${logoUrl ? 'YES' : 'NONE'}, clientId: ${clientId}`)

    // Sector-specific structured data (local file per client)
    const sectorData = await readSectorData(clientId)
    const sectorContext = sectorData ? buildSectorPromptContext(sectorData) : null

    // Generate caption
    const captionPrompt = buildCaptionPrompt({
      businessName, businessType, city, area, phone,
      brandTone, hashtagBank, captionTemplates, contentDos, contentDonts,
      keywords, platform: platform ?? 'Instagram',
      ideaTitle, ideaDescription: ideaDescription ?? '',
      sectorContext,
    })

    const { caption, hashtags } = await withKeyRetry(async (ai) => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: captionPrompt,
        // gem_instructions are visual/image rules — do NOT use as systemInstruction for caption writing
      })
      return parseCaptionResponse(response.text ?? '')
    })

    // Generate image (optional)
    let imageUrl: string | null = null
    let imagePromptUsed: string | null = null
    let imageError: string | null = null

    if (generateImage) {
      try {
        // Fetch logo as base64 if available
        const logoData = logoUrl ? await fetchLogoAsBase64(logoUrl) : null

        // Load reference images from local storage (Gem-like style references)
        const referenceImages = await loadReferenceImages(clientId)

        // Resolve Marathi text for AI prompt (uses dishNameMap/taglineMap from overlay config)
        let marathiContext: { dishName: string; tagline: string; addressBar: string } | null = null
        const overlayConfig = await loadTextOverlayConfig(clientId)
        if (overlayConfig) {
          const mDishName = resolveDishName(ideaTitle, overlayConfig)
          const mTagline = resolveTagline(
            ideaTitle, overlayConfig,
            (dish, map, fallback) => lookupTagline(dish, Object.keys(map).length > 0 ? map : ANNABRAHMA_PHRASES, fallback),
          )
          const mAddress = overlayConfig.zones?.addressBar?.text ?? ''
          marathiContext = { dishName: mDishName, tagline: mTagline, addressBar: mAddress }
        }

        imagePromptUsed = buildImagePrompt({
          businessName, businessType, city, area,
          brandTone, primaryColor, secondaryColor,
          phone, websiteUrl, keywords,
          ideaTitle,
          ideaDescription: ideaDescription ?? '',
          hasLogo: !!logoData,
          hasReferenceImages: referenceImages.length > 0,
          gemInstructions,
          imageRatio,
          marathiContext,
        })

        // Build content parts: labeled reference images + labeled logo + text prompt
        const contentParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

        // Add reference images with a text label so model knows what they are
        if (referenceImages.length > 0) {
          contentParts.push({ text: 'The following are STYLE REFERENCE images. Study the visual layout, color palette, composition, and brand style. For the BOTTOM ADDRESS/CONTACT BAR: copy its address text and layout exactly as shown. For PHONE NUMBER and WEBSITE: use only the values explicitly provided in the text prompt below — those override the reference images for those specific fields.' })
          for (const ref of referenceImages) {
            contentParts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } })
          }
        }

        // Add logo with explicit label so model can distinguish it from references
        if (logoData) {
          contentParts.push({ text: 'The following image is the BRAND LOGO — place it exactly at the top left corner:' })
          contentParts.push({ inlineData: { mimeType: logoData.mimeType, data: logoData.data } })
        }

        contentParts.push({ text: imagePromptUsed })

        // Build systemInstruction: client's brand rules FIRST (most important), realism baseline AFTER
        // For no-gem cases, realism rules are embedded in the text prompt itself
        const systemInstr = gemInstructions
          ? gemInstructions + '\n\n' + REALISM_PREAMBLE
          : undefined

        // Per-client image model override (default: flash)
        const clientImageModel = await loadImageModel(clientId)
        const imageModelName = clientImageModel ?? 'gemini-3-pro-image-preview'
        console.log(`[Generate] Using image model: ${imageModelName} for ${businessName}`)

        const imageResult = await withKeyRetry(async (ai) => {
          return ai.models.generateContent({
            model: imageModelName,
            contents: contentParts,
            config: {
              responseModalities: [Modality.IMAGE],
              imageConfig: { aspectRatio: imageRatio },
              ...(systemInstr ? { systemInstruction: systemInstr } : {}),
            },
          })
        })

        // Extract image from response
        const parts = imageResult.candidates?.[0]?.content?.parts ?? []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imagePart = parts.find((p: any) =>
          p.inlineData?.mimeType?.startsWith('image/')
        )

        // Check for text-only response (model refused to generate image)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const textPart = parts.find((p: any) => p.text)

        if (imagePart?.inlineData) {
          const { data, mimeType } = imagePart.inlineData
          if (data && mimeType) {
            let finalBase64 = data
            let finalMimeType = mimeType

            // Programmatic Devanagari text overlay (only if enabled — currently disabled, AI handles text)
            try {
              if (overlayConfig?.enabled) {
                const oDishName = resolveDishName(ideaTitle, overlayConfig)
                const oTagline = resolveTagline(
                  ideaTitle,
                  overlayConfig,
                  (dish, map, fallback) =>
                    lookupTagline(dish, Object.keys(map).length > 0 ? map : ANNABRAHMA_PHRASES, fallback),
                )
                const overlaidUri = await applyDevanagariOverlay(
                  `data:${mimeType};base64,${data}`, mimeType, overlayConfig, oDishName, oTagline,
                )
                const match = overlaidUri.match(/^data:([^;]+);base64,(.+)$/)
                if (match) {
                  finalMimeType = match[1]
                  finalBase64 = match[2]
                }
              }
            } catch (overlayErr) {
              console.error('[Overlay] Failed, using raw Gemini image:', overlayErr)
            }

            // Upload to Supabase Storage (fallback to data URI if upload fails)
            try {
              const storageClient = await createStorageSupabase()
              const ext = finalMimeType === 'image/png' ? 'png' : 'jpg'
              const storagePath = `${clientId}/${entryId ?? Date.now()}.${ext}`
              const buffer = Buffer.from(finalBase64, 'base64')

              const { error: uploadErr } = await storageClient.storage
                .from('generated-images')
                .upload(storagePath, buffer, { contentType: finalMimeType, upsert: true })

              if (!uploadErr) {
                const { data: { publicUrl } } = storageClient.storage
                  .from('generated-images')
                  .getPublicUrl(storagePath)
                imageUrl = publicUrl
                console.log(`[Storage] Uploaded image: ${storagePath}`)
              } else {
                console.error('[Storage] Upload failed, using data URI fallback:', uploadErr.message)
                imageUrl = `data:${finalMimeType};base64,${finalBase64}`
              }
            } catch (storageErr) {
              console.error('[Storage] Error, using data URI fallback:', storageErr)
              imageUrl = `data:${finalMimeType};base64,${finalBase64}`
            }
          }
        } else {
          const reason = textPart?.text
            ? `Model returned text instead of image: ${textPart.text.slice(0, 200)}`
            : 'Image model returned no image data'
          console.error(`[Generate] Image extraction failed:`, reason)
          imageError = reason
        }
      } catch (imgErr) {
        console.error('Image generation error:', imgErr)
        imageError = imgErr instanceof Error ? imgErr.message : String(imgErr)
      }
    }

    // Save to calendar entry if entryId provided
    if (entryId) {
      try {
        const supabase = await createStorageSupabase()
        await supabase
          .from('content_calendar')
          .update({
            caption,
            hashtags,
            status: 'generated',
            ...(imageUrl ? { image_url: imageUrl, image_prompt: imagePromptUsed } : {}),
          })
          .eq('id', entryId)
      } catch {
        // Non-fatal — data still returned to client
      }
    }

    return NextResponse.json({
      ok: true,
      caption,
      hashtags,
      imageUrl,
      imagePrompt: imagePromptUsed,
      imageError,
    })
  } catch (err) {
    console.error('Content generation error:', err)
    const message = err instanceof Error ? err.message : String(err)
    const isQuota = message.includes('429') || message.toLowerCase().includes('quota')
    return NextResponse.json(
      { ok: false, error: isQuota ? 'API quota exceeded. Try again later.' : message },
      { status: isQuota ? 429 : 500 },
    )
  }
}