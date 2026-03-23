import {
  parseCaptionResponse,
  buildCaptionPrompt,
  buildImagePrompt,
} from '@/app/api/content/generate/route'

// ─── parseCaptionResponse ────────────────────────────────────────────────────

describe('parseCaptionResponse', () => {
  it('extracts caption and hashtags from well-formed response', () => {
    const raw = `---CAPTION---
This is the caption text.
---HASHTAGS---
#tag1 #tag2 #tag3`
    const result = parseCaptionResponse(raw)
    expect(result.caption).toBe('This is the caption text.')
    expect(result.hashtags).toBe('#tag1 #tag2 #tag3')
  })

  it('trims whitespace from caption and hashtags', () => {
    const raw = `---CAPTION---
   Trimmed caption.
---HASHTAGS---
   #hash   `
    const result = parseCaptionResponse(raw)
    expect(result.caption).toBe('Trimmed caption.')
    expect(result.hashtags).toBe('#hash')
  })

  it('returns full text as caption when delimiters are missing', () => {
    const raw = 'Just some caption without delimiters'
    const result = parseCaptionResponse(raw)
    expect(result.caption).toBe('Just some caption without delimiters')
    expect(result.hashtags).toBe('')
  })

  it('returns empty hashtags when only caption delimiter is present', () => {
    const raw = `---CAPTION---
Only a caption here.`
    const result = parseCaptionResponse(raw)
    expect(result.caption).toBe('Only a caption here.')
    expect(result.hashtags).toBe('')
  })

  it('handles multi-line captions', () => {
    const raw = `---CAPTION---
Line 1
Line 2
Line 3
---HASHTAGS---
#a #b`
    const result = parseCaptionResponse(raw)
    expect(result.caption).toContain('Line 1')
    expect(result.caption).toContain('Line 2')
    expect(result.caption).toContain('Line 3')
  })
})

// ─── buildCaptionPrompt ──────────────────────────────────────────────────────

const baseCaptionInput = {
  businessName: 'Test Cafe',
  businessType: 'Cafe',
  city: 'Pune',
  area: 'Kothrud',
  phone: '9876543210',
  brandTone: 'Friendly',
  hashtagBank: '#TestCafe #Pune',
  captionTemplates: '',
  contentDos: 'Be warm',
  contentDonts: 'No formal language',
  keywords: ['best cafe', 'coffee Pune'],
  platform: 'Instagram',
  ideaTitle: 'Morning Coffee Special',
  ideaDescription: 'Start your morning right with our signature brew.',
}

describe('buildCaptionPrompt', () => {
  it('includes the business name', () => {
    const prompt = buildCaptionPrompt(baseCaptionInput)
    expect(prompt).toContain('Test Cafe')
  })

  it('includes the business type', () => {
    const prompt = buildCaptionPrompt(baseCaptionInput)
    expect(prompt).toContain('Cafe')
  })

  it('includes the idea title', () => {
    const prompt = buildCaptionPrompt(baseCaptionInput)
    expect(prompt).toContain('Morning Coffee Special')
  })

  it('includes the platform', () => {
    const prompt = buildCaptionPrompt(baseCaptionInput)
    expect(prompt).toContain('Instagram')
  })

  it('includes the brand tone', () => {
    const prompt = buildCaptionPrompt(baseCaptionInput)
    expect(prompt).toContain('Friendly')
  })

  it('includes provided keywords', () => {
    const prompt = buildCaptionPrompt(baseCaptionInput)
    expect(prompt).toContain('best cafe')
    expect(prompt).toContain('coffee Pune')
  })

  it('includes location', () => {
    const prompt = buildCaptionPrompt(baseCaptionInput)
    expect(prompt).toContain('Pune')
    expect(prompt).toContain('Kothrud')
  })

  it('includes output format delimiters', () => {
    const prompt = buildCaptionPrompt(baseCaptionInput)
    expect(prompt).toContain('---CAPTION---')
    expect(prompt).toContain('---HASHTAGS---')
  })

  it('includes phone number', () => {
    const prompt = buildCaptionPrompt(baseCaptionInput)
    expect(prompt).toContain('9876543210')
  })

  it('includes keyword-based hashtag strategy', () => {
    const prompt = buildCaptionPrompt({ ...baseCaptionInput, keywords: ['Web Design', 'Mobile App'] })
    expect(prompt).toContain('HASHTAG STRATEGY')
  })

  it('handles empty keywords gracefully', () => {
    const prompt = buildCaptionPrompt({ ...baseCaptionInput, keywords: [] })
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(0)
  })
})

// ─── buildImagePrompt (no gem_instructions) ──────────────────────────────────

const baseImageInput = {
  businessName: 'Test Restaurant',
  businessType: 'Restaurant',
  city: 'Mumbai',
  area: 'Andheri',
  brandTone: 'Warm',
  primaryColor: '#FF5733',
  secondaryColor: '#333333',
  phone: '9999988888',
  websiteUrl: 'spicegarden.in',
  keywords: ['Indian food', 'best restaurant Mumbai'],
  ideaTitle: 'Dal Makhani Special',
  ideaDescription: 'Rich, creamy dal makhani slow cooked overnight.',
  hasLogo: false,
  gemInstructions: '',
}

describe('buildImagePrompt — no gem_instructions (auto-built)', () => {
  it('includes the business name', () => {
    const prompt = buildImagePrompt(baseImageInput)
    expect(prompt).toContain('Test Restaurant')
  })

  it('includes the idea title (TOPIC)', () => {
    const prompt = buildImagePrompt(baseImageInput)
    expect(prompt).toContain('Dal Makhani Special')
  })

  it('includes primary brand color', () => {
    const prompt = buildImagePrompt(baseImageInput)
    expect(prompt).toContain('#FF5733')
  })

  it('includes website URL in footer', () => {
    const prompt = buildImagePrompt(baseImageInput)
    expect(prompt).toContain('spicegarden.in')
  })

  it('includes business type visual guide (restaurant)', () => {
    const prompt = buildImagePrompt(baseImageInput)
    // Restaurant visual guide mentions food photography
    expect(prompt.toLowerCase()).toContain('food')
  })

  it('does NOT include logo instructions when hasLogo is false', () => {
    const prompt = buildImagePrompt(baseImageInput)
    expect(prompt).not.toContain('brand logo')
  })

  it('includes logo instructions when hasLogo is true', () => {
    const prompt = buildImagePrompt({ ...baseImageInput, hasLogo: true })
    expect(prompt).toContain('logo')
  })

  it('slices idea description to max 120 chars', () => {
    const longDesc = 'A'.repeat(200)
    const prompt = buildImagePrompt({ ...baseImageInput, ideaDescription: longDesc })
    // The sliced desc (120 chars) should be present, not the full 200
    expect(prompt).not.toContain('A'.repeat(121))
  })
})

// ─── buildImagePrompt (with gem_instructions) ────────────────────────────────

describe('buildImagePrompt — with gem_instructions', () => {
  const gemInput = {
    ...baseImageInput,
    gemInstructions: `You are "Annabrahma Visual Bot"
═══ STRICT VISUAL RULES ═══
BACKGROUND: dark crimson
═══ ANNABRAHMA OFFICIAL MENU ═══
Veg Noodles, Paneer Momos`,
    ideaTitle: 'Paneer Momos',
    ideaDescription: 'खुसखुशीत मोमोज, तिखट चटणीसोबत!',
  }

  it('returns minimal content (DISH: [title]) when gem_instructions provided', () => {
    const prompt = buildImagePrompt(gemInput)
    expect(prompt).toContain('DISH: Paneer Momos')
  })

  it('includes FORMAT line', () => {
    const prompt = buildImagePrompt(gemInput)
    expect(prompt).toContain('FORMAT:')
  })

  it('includes the tagline/quote from ideaDescription', () => {
    const prompt = buildImagePrompt(gemInput)
    expect(prompt).toContain('खुसखुशीत मोमोज')
  })

  it('does NOT include tech-oriented CREATIVITY GUIDELINES', () => {
    const prompt = buildImagePrompt(gemInput)
    expect(prompt).not.toContain('CREATIVITY GUIDELINES')
  })

  it('does NOT include TRENDING CONTEXT section', () => {
    const prompt = buildImagePrompt(gemInput)
    expect(prompt).not.toContain('TRENDING CONTEXT')
  })

  it('does NOT include REALISM REQUIREMENTS section', () => {
    const prompt = buildImagePrompt(gemInput)
    expect(prompt).not.toContain('REALISM REQUIREMENTS')
  })

  it('does NOT contain conflicting background override (white/light gray)', () => {
    const prompt = buildImagePrompt(gemInput)
    expect(prompt).not.toContain('solid white or light gray')
  })

  it('includes logo line when hasLogo is true', () => {
    const prompt = buildImagePrompt({ ...gemInput, hasLogo: true })
    expect(prompt).toContain('logo')
  })

  it('respects imageRatio in FORMAT label', () => {
    const prompt = buildImagePrompt({ ...gemInput, imageRatio: '9:16' })
    expect(prompt).toContain('Story (9:16)')
  })

  it('defaults to Portrait 4:5 format when ratio not specified', () => {
    const prompt = buildImagePrompt(gemInput)
    expect(prompt).toContain('Portrait Post (4:5)')
  })
})
