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
/** Full payment state machine as defined by the Stripe escrow model */
export type PaymentStatus =
  | 'RESERVED'  // PaymentIntent created, awaiting 3DS/capture
  | 'HELD'      // payment_intent.succeeded — funds held in escrow
  | 'RELEASED'  // Transfer sent to medic after consultation
  | 'REFUNDED'  // Full or partial refund issued
  | 'DISPUTED'  // Chargeback / dispute opened
  | 'FAILED'    // payment_intent.payment_failed
  // Legacy values kept for backwards-compat with mocks
  | 'PENDING'
  | 'CAPTURED'
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
export type ConsultationStatus =
  | 'WAITING'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'DISPUTED'

export type ConsultationFailureReason =
  | 'MEDIC_NO_SHOW'
  | 'PATIENT_NO_SHOW'
  | 'TECHNICAL_FAILURE'
  | 'MUTUAL_CANCEL'
  | 'OTHER'

export interface Consultation {
  id: string
  bookingId: string
  status: ConsultationStatus
  videoRoomId?: string | null
  videoRoomUrl?: string | null       // full Daily.co room URL for clients
  videoProvider?: 'daily' | null     // forward-compat for provider swap
  startedAt?: string | null
  endedAt?: string | null
  durationSeconds?: number | null
  failureReason?: ConsultationFailureReason | null
}

export interface JoinTokenResponse {
  roomUrl: string
  token: string
  role: 'OWNER' | 'PARTICIPANT'
  expiresAt: string
}

export interface ConsultationDiagnostics {
  consultationId: string
  webhookTimestamps: Record<string, string>
  heartbeatSamples: { ts: string; networkRttMs?: number; mediaState?: string }[]
}

// ─── Prescription ─────────────────────────────────────────────────────────────
export interface Prescription {
  id: string
  consultationId: string
  patientId: string
  medicId: string
  issuedAt: string
  expiresAt?: string
  medications: PrescriptionMedication[]
  diagnosis?: string
  notes?: string
  signatureUrl?: string
}

export interface PrescriptionMedication {
  id: string
  name: string
  dosage: string
  unit: string
  frequency: string
  durationDays: number
  instructions?: string
  interactionWarning?: string
}

// ─── Note ────────────────────────────────────────────────────────────────────
export interface ConsultationNote {
  id: string
  consultationId: string
  content: string
  template?: 'SOAP' | 'FOLLOW_UP' | 'FREE'
  updatedAt: string
  isDraft: boolean
}

// ─── Vitals ──────────────────────────────────────────────────────────────────
export interface VitalReading {
  id: string
  patientId: string
  recordedAt: string
  systolicBp?: number
  diastolicBp?: number
  heartRate?: number
  weightKg?: number
  temperatureC?: number
  oxygenSaturation?: number
  glucoseMgDl?: number
}

// ─── Patient Document ─────────────────────────────────────────────────────────
export type DocumentType = 'LAB_RESULT' | 'IMAGING' | 'REFERRAL' | 'INSURANCE' | 'OTHER'

export interface PatientDocument {
  id: string
  patientId: string
  uploadedAt: string
  name: string
  type: DocumentType
  mimeType: string
  sizeBytes: number
  url: string
  uploadedByMedicId?: string
}

// ─── Timeline Event ───────────────────────────────────────────────────────────
export type TimelineEventType = 'CONSULTATION' | 'PRESCRIPTION' | 'LAB_RESULT' | 'DOCUMENT' | 'BOOKING'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  timestamp: string
  title: string
  description?: string
  relatedId: string
}

// ─── Patient Detail (Medic View) ──────────────────────────────────────────────
export interface PatientDetail {
  id: string
  userId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  bloodType?: string
  allergies: string[]
  email: string
  phone?: string
  avatarUrl?: string
  insurerName?: string
  insurancePolicyNumber?: string
  lastConsultationAt?: string
  nextBookingAt?: string
  activeConditions: string[]
}

// ─── Dispute ─────────────────────────────────────────────────────────────────
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_PATIENT' | 'RESOLVED_MEDIC' | 'CLOSED'
export type DisputeReason = 'NO_SHOW_MEDIC' | 'NO_SHOW_PATIENT' | 'POOR_SERVICE' | 'TECHNICAL_ISSUE' | 'BILLING' | 'OTHER'

export interface Dispute {
  id: string
  bookingId: string
  patientId: string
  medicId: string
  filedBy: 'PATIENT' | 'MEDIC'
  reason: DisputeReason
  description: string
  status: DisputeStatus
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  resolution?: string
  adminNotes?: string
  patientName?: string
  medicName?: string
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: string
  userId: string
  userEmail: string
  userRole: UserRole
  action: string
  entityType: string
  entityId: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  metadata?: Record<string, string>
}

// ─── Clinic ───────────────────────────────────────────────────────────────────
export interface Clinic {
  id: string
  name: string
  address: string
  city: string
  phone: string
  email: string
  licenseNumber: string
  managerId: string
  createdAt: string
}

export interface MedicInvite {
  id: string
  clinicId: string
  email: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED'
  createdAt: string
  expiresAt: string
}

// ─── Earnings ────────────────────────────────────────────────────────────────
export interface EarningsSummary {
  totalGross: number
  platformFee: number
  totalNet: number
  currency: string
  period: string
  consultationCount: number
  avgPerConsultation: number
}

export interface EarningTransaction {
  id: string
  consultationId: string
  patientName: string
  date: string
  grossAmount: number
  platformFee: number
  netAmount: number
  currency: string
  status: 'PENDING' | 'RELEASED' | 'REFUNDED'
}

// ─── Admin User ───────────────────────────────────────────────────────────────
export interface AdminUser extends User {
  createdAt: string
  lastLoginAt?: string
  isActive: boolean
  consultationCount?: number
  clinicName?: string
}

// ─── GDPR ─────────────────────────────────────────────────────────────────────
export interface GdprConsent {
  purpose: string
  label: string
  description: string
  granted: boolean
  grantedAt?: string
  revokedAt?: string
}

// ─── Stripe / Payments ───────────────────────────────────────────────────────

/** Response from POST /api/v1/payments/intents */
export interface PaymentIntentResponse {
  paymentId: string
  clientSecret: string
  publishableKey: string
}

/** Single payment record from GET /api/v1/payments/:id */
export interface Payment {
  id: string
  bookingId: string
  patientId: string
  medicId: string
  amountBani: number
  applicationFeeBani: number
  currency: 'RON'
  state: PaymentStatus
  stripePaymentIntentId?: string
  createdAt: string
  updatedAt: string
}

/** Medic Stripe account capability flags from GET /medics/me/stripe/status */
export interface MedicStripeStatus {
  stripeAccountId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requirementsCurrentlyDue: string[]
  onboardingComplete: boolean
}

/** Single payout record from GET /medics/me/payouts */
export interface PayoutRecord {
  id: string
  amountBani: number
  currency: string
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed'
  arrivalDate: string
  loginLinkUrl?: string
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
