import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })

  it('deduplicates tailwind conflicts (twMerge)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
})
