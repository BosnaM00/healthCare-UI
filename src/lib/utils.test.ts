import { describe, it, expect } from 'vitest'
import { cn, formatDate, maskName, maskPhone } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('lets later Tailwind classes override earlier conflicting ones', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('ignores falsy values', () => {
    expect(cn('px-2', false, undefined, null, 'py-1')).toBe('px-2 py-1')
  })
})

describe('formatDate', () => {
  it('formats a Date as "dd MMM yyyy" (en-GB)', () => {
    expect(formatDate(new Date(2025, 0, 15))).toBe('15 Jan 2025')
  })

  it('accepts an ISO date string', () => {
    expect(formatDate('2025-01-15T00:00:00')).toBe('15 Jan 2025')
  })
})

describe('maskName', () => {
  it('abbreviates the surname to an initial', () => {
    expect(maskName('John Doe')).toBe('John D.')
  })

  it('abbreviates every name part after the first', () => {
    expect(maskName('Mary Jane Watson')).toBe('Mary J. W.')
  })

  it('returns a single-word name unchanged', () => {
    expect(maskName('Cher')).toBe('Cher')
  })
})

describe('maskPhone', () => {
  it('keeps the first 3 and last 3 digits, masking the middle', () => {
    expect(maskPhone('0712345678')).toBe('071****678')
  })

  it('returns short inputs unchanged', () => {
    expect(maskPhone('123')).toBe('123')
  })
})
