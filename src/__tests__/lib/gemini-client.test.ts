// Tests for gemini-client.ts
// Note: We test the exported utilities and retry logic using mocked env vars.

describe('gemini-client env loading', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('hasGeminiKeys returns false when no keys are set', async () => {
    delete process.env.GOOGLE_GEMINI_API_KEY
    for (let i = 1; i <= 20; i++) delete process.env[`GOOGLE_GEMINI_API_KEY_${i}`]
    const { hasGeminiKeys } = await import('@/lib/gemini-client')
    expect(hasGeminiKeys()).toBe(false)
  })

  it('hasGeminiKeys returns true when legacy key is set', async () => {
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key-abc'
    for (let i = 1; i <= 20; i++) delete process.env[`GOOGLE_GEMINI_API_KEY_${i}`]
    const { hasGeminiKeys } = await import('@/lib/gemini-client')
    expect(hasGeminiKeys()).toBe(true)
  })

  it('hasGeminiKeys returns true when numbered key is set', async () => {
    delete process.env.GOOGLE_GEMINI_API_KEY
    for (let i = 1; i <= 20; i++) delete process.env[`GOOGLE_GEMINI_API_KEY_${i}`]
    process.env.GOOGLE_GEMINI_API_KEY_1 = 'test-key-1'
    const { hasGeminiKeys } = await import('@/lib/gemini-client')
    expect(hasGeminiKeys()).toBe(true)
  })

  it('geminiKeyCount returns 0 when no keys set', async () => {
    delete process.env.GOOGLE_GEMINI_API_KEY
    for (let i = 1; i <= 20; i++) delete process.env[`GOOGLE_GEMINI_API_KEY_${i}`]
    const { geminiKeyCount } = await import('@/lib/gemini-client')
    expect(geminiKeyCount()).toBe(0)
  })

  it('geminiKeyCount counts multiple numbered keys', async () => {
    delete process.env.GOOGLE_GEMINI_API_KEY
    for (let i = 1; i <= 20; i++) delete process.env[`GOOGLE_GEMINI_API_KEY_${i}`]
    process.env.GOOGLE_GEMINI_API_KEY_1 = 'key-one'
    process.env.GOOGLE_GEMINI_API_KEY_2 = 'key-two'
    process.env.GOOGLE_GEMINI_API_KEY_3 = 'key-three'
    const { geminiKeyCount } = await import('@/lib/gemini-client')
    expect(geminiKeyCount()).toBe(3)
  })
})

describe('withKeyRetry', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    process.env.GOOGLE_GEMINI_API_KEY_1 = 'test-key-1'
    process.env.GOOGLE_GEMINI_API_KEY_2 = 'test-key-2'
    for (let i = 1; i <= 20; i++) {
      if (i > 2) delete process.env[`GOOGLE_GEMINI_API_KEY_${i}`]
    }
    delete process.env.GOOGLE_GEMINI_API_KEY
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('throws immediately when no keys are configured', async () => {
    for (let i = 1; i <= 20; i++) delete process.env[`GOOGLE_GEMINI_API_KEY_${i}`]
    delete process.env.GOOGLE_GEMINI_API_KEY
    const { withKeyRetry } = await import('@/lib/gemini-client')
    await expect(withKeyRetry(async () => 'result')).rejects.toThrow('No Gemini API key')
  })

  it('returns result on success', async () => {
    const { withKeyRetry } = await import('@/lib/gemini-client')
    const result = await withKeyRetry(async (_client) => 'success-value')
    expect(result).toBe('success-value')
  })

  it('throws non-quota errors immediately without retrying', async () => {
    const { withKeyRetry } = await import('@/lib/gemini-client')
    let callCount = 0
    await expect(
      withKeyRetry(async () => {
        callCount++
        throw new Error('Invalid API key format')
      })
    ).rejects.toThrow('Invalid API key format')
    // Should only be called once — no retry on non-quota errors
    expect(callCount).toBe(1)
  })

  it('retries on 429 quota error and tries next key', async () => {
    const { withKeyRetry } = await import('@/lib/gemini-client')
    let callCount = 0
    const result = await withKeyRetry(async () => {
      callCount++
      if (callCount === 1) throw new Error('429 quota exceeded')
      return 'recovered'
    })
    expect(result).toBe('recovered')
    expect(callCount).toBe(2)
  })

  it('throws after all keys are exhausted on quota errors', async () => {
    const { withKeyRetry } = await import('@/lib/gemini-client')
    await expect(
      withKeyRetry(async () => {
        throw new Error('429 quota exceeded')
      })
    ).rejects.toBeDefined()
  })
})
