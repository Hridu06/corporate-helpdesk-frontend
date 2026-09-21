import { describe, expect, it } from 'vitest'
import { describeEvent, statusActionLabel } from './labels'

describe('statusActionLabel', () => {
  it.each([
    ['open', 'in_progress', 'Start progress'],
    ['resolved', 'in_progress', 'Reopen'],
    ['closed', 'in_progress', 'Reopen'],
    ['in_progress', 'open', 'Move back to open'],
    ['resolved', 'open', 'Reopen'],
    ['open', 'resolved', 'Mark resolved'],
    ['in_progress', 'resolved', 'Mark resolved'],
    ['open', 'closed', 'Close ticket'],
    ['resolved', 'closed', 'Close ticket'],
  ])('%s -> %s reads "%s"', (from, to, label) => {
    expect(statusActionLabel(from, to)).toBe(label)
  })
})

describe('describeEvent', () => {
  const actor = { id: 1, name: 'Ada Admin' }

  it('describes each kind of change with readable labels', () => {
    expect(describeEvent({ type: 'status_changed', from: 'in_progress', to: 'resolved', actor })).toBe(
      'Ada Admin changed the status from In progress to Resolved.',
    )
    expect(describeEvent({ type: 'priority_changed', from: 'low', to: 'high', actor })).toBe(
      'Ada Admin changed the priority from Low to High.',
    )
    expect(describeEvent({ type: 'assigned', assignee_name: 'Alex Agent', actor })).toBe(
      'Ada Admin assigned the ticket to Alex Agent.',
    )
    expect(describeEvent({ type: 'unassigned', from: 'Alex Agent', actor })).toBe(
      'Ada Admin unassigned the ticket (was Alex Agent).',
    )
  })

  it('copes with a removed actor, a missing name and unknown types', () => {
    expect(describeEvent({ type: 'unassigned', actor: null })).toBe('A former team member unassigned the ticket.')
    expect(describeEvent({ type: 'assigned', actor })).toBe('Ada Admin assigned the ticket to an agent.')
    expect(describeEvent({ type: 'something_new', actor })).toBe('Ada Admin updated the ticket.')
  })

  it('falls back to the raw value for statuses it does not know', () => {
    expect(describeEvent({ type: 'status_changed', from: 'open', to: 'archived', actor })).toBe(
      'Ada Admin changed the status from Open to archived.',
    )
  })
})
