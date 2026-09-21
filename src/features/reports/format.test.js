import { describe, expect, it } from 'vitest'
import { formatBucket, formatDuration, formatPercent } from './format'

describe('formatDuration', () => {
  it.each([
    [null, '—'],
    [undefined, '—'],
    [0, '0 s'],
    [45, '45 s'],
    [60, '1 min'],
    [2700, '45 min'],
    [3600, '1 h'],
    [9000, '2.5 h'],
    [43200, '12 h'],
    [86400, '1 d'],
    [129600, '1.5 d'],
    [864000, '10 d'],
  ])('%s reads %s', (seconds, text) => expect(formatDuration(seconds)).toBe(text))
})

describe('formatPercent', () => {
  it.each([
    [null, '—'],
    [0, '0%'],
    [0.5, '50%'],
    [0.3333, '33%'],
    [1.25, '125%'],
  ])('%s reads %s', (ratio, text) => expect(formatPercent(ratio)).toBe(text))
})

describe('formatBucket', () => {
  it('reads a date without any time-zone shift', () => {
    expect(formatBucket('2026-09-01', 'day')).toMatch(/1/)
    expect(formatBucket('2026-01-01', 'day')).not.toMatch(/Dec/)
  })

  it('says "Week of" for weekly buckets', () => {
    expect(formatBucket('2026-09-21', 'week')).toMatch(/^Week of /)
  })
})
