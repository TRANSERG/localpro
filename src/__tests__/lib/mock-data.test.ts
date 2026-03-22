import { getMockClient, getMockKeywordsForClient, mockBrandingProfiles } from '@/lib/mock-data'

describe('getMockClient', () => {
  it('returns a client for a valid mock ID', () => {
    const client = getMockClient('c6')
    expect(client).not.toBeNull()
    expect(client?.id).toBe('c6')
    expect(typeof client?.business_name).toBe('string')
    expect(client?.business_name.length).toBeGreaterThan(0)
  })

  it('returns undefined/null for an unknown ID', () => {
    expect(getMockClient('nonexistent-id-999')).toBeFalsy()
  })

  it('returns undefined/null for empty string ID', () => {
    expect(getMockClient('')).toBeFalsy()
  })

  it('each mock client has required fields', () => {
    const client = getMockClient('c6')
    expect(client).toHaveProperty('id')
    expect(client).toHaveProperty('business_name')
    expect(client).toHaveProperty('business_type')
  })
})

describe('getMockKeywordsForClient', () => {
  it('returns an array for a known client', () => {
    const keywords = getMockKeywordsForClient('c6')
    expect(Array.isArray(keywords)).toBe(true)
  })

  it('each keyword entry has a keyword string', () => {
    const keywords = getMockKeywordsForClient('c6')
    keywords.forEach(k => {
      expect(typeof k.keyword).toBe('string')
      expect(k.keyword.length).toBeGreaterThan(0)
    })
  })

  it('returns empty array for unknown client', () => {
    const keywords = getMockKeywordsForClient('nonexistent-999')
    expect(keywords).toEqual([])
  })
})

describe('mockBrandingProfiles', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(mockBrandingProfiles)).toBe(true)
    expect(mockBrandingProfiles.length).toBeGreaterThan(0)
  })

  it('each profile has client_id and primary_color', () => {
    mockBrandingProfiles.forEach(profile => {
      expect(typeof profile.client_id).toBe('string')
      expect(typeof profile.primary_color).toBe('string')
      expect(profile.primary_color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  it('contains branding profiles for real clients only', () => {
    const clientIds = mockBrandingProfiles.map(b => b.client_id)
    expect(clientIds).toContain('c6')
    expect(clientIds).toContain('c7')
    expect(clientIds).toContain('c8')
    // No fake clients
    expect(clientIds).not.toContain('c1')
    expect(clientIds).not.toContain('c2')
    expect(clientIds).not.toContain('c3')
  })
})
