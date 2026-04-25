// ─── User & Auth ────────────────────────────────────────────────────────────
export type UserRole = 'PATIENT' | 'MEDIC' | 'CLINIC_MANAGER' | 'ADMIN'

export interface User {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  phone?: string
  avatarUrl?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ─── Medic ───────────────────────────────────────────────────────────────────
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'
export type ConsultationType = 'VIDEO' | 'IN_PERSON'

export interface Specialty {
  id: string
  name: string
}

export interface Medic {
  id: string
  userId: string
  firstName: string
  lastName: string
  avatarUrl?: string
  clinicId?: string
  clinicName?: string
  licenseNumber: string
  licenseExpiresAt: string
  verificationStatus: VerificationStatus
  availableForInstant: boolean
  specialties: Specialty[]
  consultationTypes: ConsultationType[]
  pricePerSession: number
  currency: string
  bio?: string
  languages: string[]
  rating?: number
  reviewCount?: number
  soonestAvailableSlot?: string
}

// ─── Booking ─────────────────────────────────────────────────────────────────
export type PaymentStatus = 'PENDING' | 'CAPTURED' | 'REFUNDED' | 'RELEASED'
export type BookingStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface Slot {
  id: string
  medicId: string
  startTime: string
  endTime: string
  consultationType: ConsultationType
  available: boolean
}

export interface Booking {
  id: string
  patientId: string
  medicId: string
  slotId: string
  consultationType: ConsultationType
  paymentStatus: PaymentStatus
  bookingStatus: BookingStatus
  cancellationPolicyAcceptedAt?: string
  createdAt: string
  slot: Slot
  medic?: Medic
  notes?: string
}

// ─── Consultation ─────────────────────────────────────────────────────────────
export type ConsultationStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface Consultation {
  id: string
  bookingId: string
  status: ConsultationStatus
  videoRoomId?: string
  startedAt?: string
  endedAt?: string
  durationSeconds?: number
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// ─── API Error (RFC 7807) ────────────────────────────────────────────────────
export interface ProblemDetail {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
  errors?: Record<string, string[]>
}
