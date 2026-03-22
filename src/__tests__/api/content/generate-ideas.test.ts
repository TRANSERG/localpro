import {
  extractMenuFromGemInstructions,
  buildIdeaPrompt,
} from '@/app/api/content/generate-ideas/route'

// ─── extractMenuFromGemInstructions ─────────────────────────────────────────

const annabrahmaGemInstructions = `You are "Annabrahma Visual Bot" — you generate food post images.

BRAND IDENTITY:
- Restaurant name: Annabrahma Chinese Corner

═══ STRICT VISUAL RULES — NEVER BREAK THESE ═══

BACKGROUND:
- ALWAYS deep crimson-to-maroon gradient

═══ ANNABRAHMA OFFICIAL MENU — ONLY THESE DISHES ═══

SOUP:
Veg Manchow Soup, Veg Tomato Soup, Veg Lemon Coriander Soup

VEG MOMOS:
Mix Veg Momos, Paneer Momos, Corn Cheese Momos

MAGGI:
Veg Maggie, Cheese Maggie

STRICT RESTRICTIONS — never change these:
- Background: ALWAYS dark crimson/maroon only`

describe('extractMenuFromGemInstructions', () => {
  it('extracts the OFFICIAL MENU section when present', () => {
    const menu = extractMenuFromGemInstructions(annabrahmaGemInstructions)
    expect(menu).toContain('OFFICIAL MENU')
    expect(menu).toContain('Veg Manchow Soup')
    expect(menu).toContain('Paneer Momos')
    expect(menu).toContain('Cheese Maggie')
  })

  it('stops before STRICT RESTRICTIONS section', () => {
    const menu = extractMenuFromGemInstructions(annabrahmaGemInstructions)
    expect(menu).not.toContain('STRICT RESTRICTIONS')
    expect(menu).not.toContain('Background: ALWAYS dark crimson')
  })

  it('returns empty string when no OFFICIAL MENU section exists', () => {
    const noMenu = `You are a designer. Generate images with dark background. No menu here.`
    expect(extractMenuFromGemInstructions(noMenu)).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(extractMenuFromGemInstructions('')).toBe('')
  })

  it('does not include visual rules before the menu section', () => {
    const menu = extractMenuFromGemInstructions(annabrahmaGemInstructions)
    expect(menu).not.toContain('BACKGROUND')
    expect(menu).not.toContain('BRAND IDENTITY')
  })
})

// ─── buildIdeaPrompt — dish-focused mode (with menuContext) ─────────────────

const menuContext = `ANNABRAHMA OFFICIAL MENU — ONLY THESE DISHES

SOUP:
Veg Manchow Soup, Veg Tomato Soup

VEG MOMOS:
Mix Veg Momos, Paneer Momos`

const dishModeInput = {
  businessName: 'Annabrahma Chinese Corner',
  businessType: 'Chinese Restaurant',
  city: 'Chh. Sambhaji Nagar',
  area: 'Bajaj Nagar',
  brandTone: 'Warm',
  contentPillars: ['Menu Highlight'],
  approvedPostTypes: ['Photos'],
  keywords: [],
  count: 5,
  menuContext,
}

describe('buildIdeaPrompt — dish-focused mode (menuContext provided)', () => {
  it('includes the menu context in the prompt', () => {
    const prompt = buildIdeaPrompt(dishModeInput)
    expect(prompt).toContain('Veg Manchow Soup')
    expect(prompt).toContain('Paneer Momos')
  })

  it('instructs AI to use dish names as idea titles', () => {
    const prompt = buildIdeaPrompt(dishModeInput)
    expect(prompt).toContain('dish name')
  })

  it('generates English taglines by default (no gemInstructions)', () => {
    const prompt = buildIdeaPrompt(dishModeInput)
    expect(prompt).toContain('English tagline')
    expect(prompt).not.toContain('Marathi')
  })

  it('generates Marathi taglines when gemInstructions specify Marathi', () => {
    const prompt = buildIdeaPrompt({ ...dishModeInput, gemInstructions: 'Text language: ALWAYS Marathi (Devanagari)' })
    expect(prompt).toContain('Marathi')
    expect(prompt).toContain('Devanagari')
  })

  it('instructs AI to return JSON', () => {
    const prompt = buildIdeaPrompt(dishModeInput)
    expect(prompt).toContain('JSON')
  })

  it('includes the requested count', () => {
    const prompt = buildIdeaPrompt(dishModeInput)
    expect(prompt).toContain('5')
  })

  it('includes the restaurant name', () => {
    const prompt = buildIdeaPrompt(dishModeInput)
    expect(prompt).toContain('Annabrahma Chinese Corner')
  })

  it('specifies post_type as Photos', () => {
    const prompt = buildIdeaPrompt(dishModeInput)
    expect(prompt).toContain('"Photos"')
  })

  it('specifies platforms as Instagram and Facebook', () => {
    const prompt = buildIdeaPrompt(dishModeInput)
    expect(prompt).toContain('Instagram')
    expect(prompt).toContain('Facebook')
  })

  it('does NOT include generic tech content rules', () => {
    const prompt = buildIdeaPrompt(dishModeInput)
    expect(prompt).not.toContain('SaaS')
    expect(prompt).not.toContain('AI adoption')
    expect(prompt).not.toContain('startup ecosystem')
  })
})

// ─── buildIdeaPrompt — generic mode (no menuContext) ────────────────────────

const genericModeInput = {
  businessName: 'Transerg LLP',
  businessType: 'IT & Technology',
  city: 'Pune',
  area: 'Hinjewadi',
  brandTone: 'Professional',
  contentPillars: ['Mobile App Dev', 'SaaS Development', 'AI Integration'],
  approvedPostTypes: ['Tips', 'Case Studies', 'Behind the Scenes'],
  keywords: ['mobile app development', 'SaaS startup India'],
  count: 8,
}

describe('buildIdeaPrompt — generic mode (no menuContext)', () => {
  it('includes the business name', () => {
    const prompt = buildIdeaPrompt(genericModeInput)
    expect(prompt).toContain('Transerg LLP')
  })

  it('includes the content pillars', () => {
    const prompt = buildIdeaPrompt(genericModeInput)
    expect(prompt).toContain('Mobile App Dev')
    expect(prompt).toContain('SaaS Development')
    expect(prompt).toContain('AI Integration')
  })

  it('includes the approved post types', () => {
    const prompt = buildIdeaPrompt(genericModeInput)
    expect(prompt).toContain('Tips')
    expect(prompt).toContain('Case Studies')
  })

  it('includes the keywords', () => {
    const prompt = buildIdeaPrompt(genericModeInput)
    expect(prompt).toContain('mobile app development')
    expect(prompt).toContain('SaaS startup India')
  })

  it('includes the requested count', () => {
    const prompt = buildIdeaPrompt(genericModeInput)
    expect(prompt).toContain('8')
  })

  it('includes location', () => {
    const prompt = buildIdeaPrompt(genericModeInput)
    expect(prompt).toContain('Hinjewadi')
    expect(prompt).toContain('Pune')
  })

  it('instructs AI to return a JSON array', () => {
    const prompt = buildIdeaPrompt(genericModeInput)
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('"title"')
    expect(prompt).toContain('"description"')
  })

  it('does NOT include dish-specific Marathi instructions', () => {
    const prompt = buildIdeaPrompt(genericModeInput)
    expect(prompt).not.toContain('OFFICIAL MENU')
    expect(prompt).not.toContain('Devanagari')
  })
})
