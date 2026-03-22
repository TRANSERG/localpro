import {
  cn,
  formatINR,
  formatNumber,
  calcMoM,
  getInitials,
  formatDate,
  formatMonthYear,
  getStatusClasses,
} from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-3')).toBe('px-2 py-3')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})

describe('formatINR', () => {
  it('formats a positive number as INR currency', () => {
    const result = formatINR(5000)
    expect(result).toContain('5,000')
    expect(result).toMatch(/₹|INR/)
  })

  it('returns em-dash for null', () => {
    expect(formatINR(null)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(formatINR(undefined)).toBe('—')
  })

  it('formats zero correctly', () => {
    const result = formatINR(0)
    expect(result).toContain('0')
  })

  it('formats large numbers with Indian grouping', () => {
    const result = formatINR(100000)
    expect(result).toContain('1,00,000')
  })
})

describe('formatNumber', () => {
  it('returns plain string for numbers under 1000', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(1)).toBe('1')
  })

  it('abbreviates thousands with K', () => {
    expect(formatNumber(1000)).toBe('1.0K')
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(999999)).toBe('1000.0K')
  })

  it('abbreviates millions with M', () => {
    expect(formatNumber(1_000_000)).toBe('1.0M')
    expect(formatNumber(2_500_000)).toBe('2.5M')
  })
})

describe('calcMoM', () => {
  it('calculates percentage change correctly', () => {
    expect(calcMoM(110, 100)).toBe(10)
    expect(calcMoM(90, 100)).toBe(-10)
    expect(calcMoM(150, 100)).toBe(50)
  })

  it('returns null when current is null', () => {
    expect(calcMoM(null, 100)).toBeNull()
  })

  it('returns null when previous is null', () => {
    expect(calcMoM(100, null)).toBeNull()
  })

  it('returns null when previous is zero (avoids divide-by-zero)', () => {
    expect(calcMoM(100, 0)).toBeNull()
  })

  it('rounds result to nearest integer', () => {
    expect(calcMoM(133, 100)).toBe(33)
  })
})

describe('getInitials', () => {
  it('returns first two initials from a two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns only first initial for a single-word name', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('returns at most 2 characters for multi-word names', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('returns uppercase initials', () => {
    expect(getInitials('alice bob')).toBe('AB')
  })
})

describe('formatDate', () => {
  it('returns em-dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('formats a valid ISO date string', () => {
    const result = formatDate('2024-03-15')
    expect(result).toMatch(/15/)
    expect(result).toMatch(/Mar|march/i)
    expect(result).toMatch(/2024/)
  })
})

describe('formatMonthYear', () => {
  it('formats YYYY-MM to full month name and year', () => {
    const result = formatMonthYear('2024-03')
    expect(result).toMatch(/March|march/i)
    expect(result).toMatch(/2024/)
  })

  it('formats January correctly', () => {
    const result = formatMonthYear('2025-01')
    expect(result).toMatch(/January|january/i)
  })
})

describe('getStatusClasses', () => {
  it('returns green classes for Paid status', () => {
    expect(getStatusClasses('Paid')).toContain('green')
  })

  it('returns yellow classes for Pending status', () => {
    expect(getStatusClasses('Pending')).toContain('yellow')
  })

  it('returns red classes for Overdue status', () => {
    expect(getStatusClasses('Overdue')).toContain('red')
  })

  it('returns blue classes for In Progress status', () => {
    expect(getStatusClasses('In Progress')).toContain('blue')
  })

  it('returns green classes for Done status', () => {
    expect(getStatusClasses('Done')).toContain('green')
  })

  it('returns red classes for High priority', () => {
    expect(getStatusClasses('High')).toContain('red')
  })

  it('returns purple classes for Premium plan', () => {
    expect(getStatusClasses('Premium')).toContain('purple')
  })

  it('returns default gray classes for unknown status', () => {
    const result = getStatusClasses('UnknownStatus')
    expect(result).toContain('gray')
  })
})
