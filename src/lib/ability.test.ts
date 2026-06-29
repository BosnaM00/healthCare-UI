import { describe, it, expect } from 'vitest'
import { defineAbilityFor } from './ability'

describe('defineAbilityFor', () => {
  it('lets a PATIENT create and read bookings', () => {
    const ability = defineAbilityFor('PATIENT')
    expect(ability.can('create', 'Booking')).toBe(true)
    expect(ability.can('read', 'Booking')).toBe(true)
  })

  it('does not let a PATIENT manage a clinic', () => {
    const ability = defineAbilityFor('PATIENT')
    expect(ability.can('manage', 'Clinic')).toBe(false)
  })

  it('lets a MEDIC manage consultations and prescriptions', () => {
    const ability = defineAbilityFor('MEDIC')
    expect(ability.can('manage', 'Consultation')).toBe(true)
    expect(ability.can('manage', 'Prescription')).toBe(true)
  })

  it('does not let a MEDIC manage a clinic', () => {
    const ability = defineAbilityFor('MEDIC')
    expect(ability.can('manage', 'Clinic')).toBe(false)
  })

  it('lets a CLINIC_MANAGER read the audit log', () => {
    const ability = defineAbilityFor('CLINIC_MANAGER')
    expect(ability.can('read', 'Audit')).toBe(true)
  })

  it('grants an ADMIN full access', () => {
    const ability = defineAbilityFor('ADMIN')
    expect(ability.can('manage', 'all')).toBe(true)
    expect(ability.can('delete', 'Patient')).toBe(true)
  })
})
