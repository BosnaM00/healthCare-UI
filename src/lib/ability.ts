import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability'
import type { UserRole } from '@/types'

export type Actions = 'read' | 'create' | 'update' | 'delete' | 'manage'
export type Subjects =
  | 'Booking'
  | 'Consultation'
  | 'Prescription'
  | 'Patient'
  | 'Medic'
  | 'Clinic'
  | 'Report'
  | 'Audit'
  | 'Admin'
  | 'OwnPayouts'
  | 'all'

export type AppAbility = MongoAbility<[Actions, Subjects]>

export function defineAbilityFor(role: UserRole): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  switch (role) {
    case 'PATIENT':
      can('read', 'Medic')
      can('create', 'Booking')
      can('read', 'Booking')
      can('update', 'Booking') // cancel
      can('read', 'Consultation')
      can('read', 'Prescription')
      can('read', 'Patient') // own profile
      can('update', 'Patient') // own profile
      break

    case 'MEDIC':
      can('read', 'Patient')
      can('read', 'Booking')
      can('update', 'Booking')
      can('manage', 'Consultation')
      can('manage', 'Prescription')
      can('read', 'Report')
      can('update', 'Medic') // own profile
      can('manage', 'OwnPayouts') // Stripe Connect payouts
      break

    case 'CLINIC_MANAGER':
      can('read', 'Patient')
      can('read', 'Booking')
      can('read', 'Medic')
      can('manage', 'Clinic')
      can('manage', 'Report')
      can('read', 'Audit')
      break

    case 'ADMIN':
      can('manage', 'all')
      break
  }

  return build()
}

export { createMongoAbility }
