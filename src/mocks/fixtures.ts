import type { User, Medic, Booking, Consultation, Slot } from '@/types'

export const mockUsers: User[] = [
  {
    id: 'usr-patient-1',
    email: 'maria.popescu@example.com',
    role: 'PATIENT',
    firstName: 'Maria',
    lastName: 'Popescu',
    phone: '+40 721 234 567',
    avatarUrl: undefined,
  },
  {
    id: 'usr-medic-1',
    email: 'dr.ionescu@clinic.ro',
    role: 'MEDIC',
    firstName: 'Andrei',
    lastName: 'Ionescu',
    phone: '+40 722 345 678',
    avatarUrl: undefined,
  },
]

export const mockSpecialties = [
  { id: 'spec-1', name: 'General Medicine' },
  { id: 'spec-2', name: 'Cardiology' },
  { id: 'spec-3', name: 'Dermatology' },
  { id: 'spec-4', name: 'Neurology' },
  { id: 'spec-5', name: 'Orthopedics' },
  { id: 'spec-6', name: 'Pediatrics' },
]

export const mockMedics: Medic[] = [
  {
    id: 'med-1',
    userId: 'usr-medic-1',
    firstName: 'Andrei',
    lastName: 'Ionescu',
    clinicName: 'Clinica Centrală',
    licenseNumber: 'RO-MED-12345',
    licenseExpiresAt: '2027-12-31',
    verificationStatus: 'VERIFIED',
    availableForInstant: true,
    specialties: [mockSpecialties[0]!, mockSpecialties[1]!],
    consultationTypes: ['VIDEO', 'IN_PERSON'],
    pricePerSession: 150,
    currency: 'RON',
    bio: 'General practitioner with 10+ years of experience in internal medicine and cardiology prevention.',
    languages: ['Romanian', 'English'],
    rating: 4.8,
    reviewCount: 124,
    soonestAvailableSlot: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: 'med-2',
    userId: 'usr-medic-2',
    firstName: 'Elena',
    lastName: 'Dumitrescu',
    clinicName: 'MedPoint Clinic',
    licenseNumber: 'RO-MED-67890',
    licenseExpiresAt: '2026-06-30',
    verificationStatus: 'VERIFIED',
    availableForInstant: false,
    specialties: [mockSpecialties[2]!],
    consultationTypes: ['VIDEO'],
    pricePerSession: 200,
    currency: 'RON',
    bio: 'Board-certified dermatologist specializing in skin conditions and cosmetic dermatology.',
    languages: ['Romanian', 'French'],
    rating: 4.9,
    reviewCount: 87,
    soonestAvailableSlot: new Date(Date.now() + 172800000).toISOString(),
  },
  {
    id: 'med-3',
    userId: 'usr-medic-3',
    firstName: 'Mihai',
    lastName: 'Gheorghe',
    clinicName: 'NeuroClinic Bucharest',
    licenseNumber: 'RO-MED-11111',
    licenseExpiresAt: '2028-03-15',
    verificationStatus: 'VERIFIED',
    availableForInstant: false,
    specialties: [mockSpecialties[3]!],
    consultationTypes: ['VIDEO', 'IN_PERSON'],
    pricePerSession: 300,
    currency: 'RON',
    bio: 'Neurologist with expertise in headache disorders and epilepsy management.',
    languages: ['Romanian', 'English', 'German'],
    rating: 4.7,
    reviewCount: 56,
    soonestAvailableSlot: new Date(Date.now() + 259200000).toISOString(),
  },
]

const tomorrow = new Date(Date.now() + 86400000)

export const mockSlots: Slot[] = [
  {
    id: 'slot-1',
    medicId: 'med-1',
    startTime: new Date(tomorrow.setHours(9, 0, 0, 0)).toISOString(),
    endTime: new Date(tomorrow.setHours(9, 30, 0, 0)).toISOString(),
    consultationType: 'VIDEO',
    available: true,
  },
  {
    id: 'slot-2',
    medicId: 'med-1',
    startTime: new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString(),
    endTime: new Date(tomorrow.setHours(10, 30, 0, 0)).toISOString(),
    consultationType: 'VIDEO',
    available: true,
  },
  {
    id: 'slot-3',
    medicId: 'med-1',
    startTime: new Date(tomorrow.setHours(14, 0, 0, 0)).toISOString(),
    endTime: new Date(tomorrow.setHours(14, 30, 0, 0)).toISOString(),
    consultationType: 'IN_PERSON',
    available: true,
  },
]

export const mockBookings: Booking[] = [
  {
    id: 'book-1',
    patientId: 'usr-patient-1',
    medicId: 'med-1',
    slotId: 'slot-1',
    consultationType: 'VIDEO',
    paymentStatus: 'CAPTURED',
    bookingStatus: 'CONFIRMED',
    cancellationPolicyAcceptedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    slot: mockSlots[0]!,
    medic: mockMedics[0],
  },
]

export const mockConsultations: Consultation[] = [
  {
    id: 'cons-1',
    bookingId: 'book-1',
    status: 'WAITING',
    videoRoomId: 'room-abc123',
  },
]
