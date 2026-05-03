import React, { useState } from 'react'
import { AbilityProvider } from '@/lib/can'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'

// Auth
import { LoginPage } from '@/features/auth/components/LoginPage'
import { MfaPage } from '@/features/auth/components/MfaPage'
import { PasswordResetPage } from '@/features/auth/components/PasswordResetPage'

// Patient
import { RegisterPage } from '@/features/patient/components/RegisterPage'
import { ProfileEditPage } from '@/features/patient/components/ProfileEditPage'

// Booking
import { PatientDashboard } from '@/features/booking/components/PatientDashboard'
import { MedicSearchPage } from '@/features/booking/components/MedicSearchPage'
import { MedicProfilePage } from '@/features/booking/components/MedicProfilePage'
import { BookingSheet } from '@/features/booking/components/BookingSheet'
import { BookingDetailPage } from '@/features/booking/components/BookingDetailPage'

// Payments (Stripe Connect)
import { MedicOnboardingPage } from '@/features/payments/MedicOnboardingPage'
import { MedicPayoutsPage } from '@/features/payments/MedicPayoutsPage'
import { BookingResultPage } from '@/features/payments/BookingResultPage'
import { env } from '@/env'

// Phase 2 — Medic
import { MedicDashboard } from '@/features/medic/components/MedicDashboard'
import { PatientDetailPage } from '@/features/medic/components/PatientDetailPage'

// Phase 2 — Consultation
import { MedicConsultationWorkspace } from '@/features/consultation/components/MedicConsultationWorkspace'
import { PatientConsultationPage } from '@/features/consultation/components/PatientConsultationPage'

// Phase 2 — Admin
import { AdminDisputeQueue } from '@/features/admin/components/AdminDisputeQueue'
import { AdminUserManagement } from '@/features/admin/components/AdminUserManagement'
import { AuditLogViewer } from '@/features/admin/components/AuditLogViewer'
import { DisputeFilingForm } from '@/features/admin/components/DisputeFilingForm'

// Phase 2 — Clinic
import { ClinicManagerDashboard } from '@/features/clinic/components/ClinicManagerDashboard'

// Phase 2 — Settings
import { SettingsPage } from '@/features/settings/components/SettingsPage'

import { useAuthStore } from '@/stores/auth.store'
import type { Booking, Medic, Slot } from '@/types'

// ── Simple client-side router ──────────────────────────────────────────────
type Route =
  // Auth
  | { id: 'login' }
  | { id: 'mfa' }
  | { id: 'password-reset' }
  | { id: 'register' }
  // Patient routes
  | { id: 'dashboard' }
  | { id: 'medics' }
  | { id: 'medic-profile'; medicId: string }
  | { id: 'booking-detail'; bookingId: string; booking?: Booking }
  | { id: 'booking-result'; bookingId: string; paymentId: string; clientSecret: string; publishableKey: string }
  | { id: 'profile' }
  | { id: 'settings' }
  // Dispute filing (patient)
  | { id: 'dispute-file'; bookingId: string }
  // Medic routes
  | { id: 'medic-dashboard' }
  | { id: 'medic-patients' }
  | { id: 'patient-detail'; patientId: string }
  | { id: 'consultation'; consultationId: string; booking: Booking }
  | { id: 'patient-consultation'; consultationId: string; bookingId: string; booking: Booking }
  | { id: 'medic-onboarding' }
  | { id: 'medic-payouts' }
  // Admin routes
  | { id: 'admin-disputes' }
  | { id: 'admin-users' }
  | { id: 'admin-audit' }
  // Clinic manager
  | { id: 'clinic-dashboard' }

interface BookingTarget {
  medic: Medic
  slot: Slot
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore()
  const role = user?.role ?? 'PATIENT'

  const defaultRoute = (): Route => {
    if (!isAuthenticated) return { id: 'login' }
    switch (role) {
      case 'MEDIC': return { id: 'medic-dashboard' }
      case 'ADMIN': return { id: 'admin-disputes' }
      case 'CLINIC_MANAGER': return { id: 'clinic-dashboard' }
      default: return { id: 'dashboard' }
    }
  }

  const [route, setRoute] = useState<Route>(defaultRoute)
  const [bookingTarget, setBookingTarget] = useState<BookingTarget | null>(null)

  // Unauthenticated routes
  if (!isAuthenticated) {
    if (route.id === 'register') {
      return (
        <ErrorBoundary>
          <RegisterPage
            onSuccess={() => setRoute({ id: 'dashboard' })}
            onLogin={() => setRoute({ id: 'login' })}
          />
        </ErrorBoundary>
      )
    }
    if (route.id === 'mfa') {
      return (
        <ErrorBoundary>
          <MfaPage
            onSuccess={() => setRoute(defaultRoute())}
            onBack={() => setRoute({ id: 'login' })}
          />
        </ErrorBoundary>
      )
    }
    if (route.id === 'password-reset') {
      return (
        <ErrorBoundary>
          <PasswordResetPage onBack={() => setRoute({ id: 'login' })} />
        </ErrorBoundary>
      )
    }
    return (
      <ErrorBoundary>
        <LoginPage
          onSuccess={() => setRoute(defaultRoute())}
          onForgotPassword={() => setRoute({ id: 'password-reset' })}
          onRegister={() => setRoute({ id: 'register' })}
        />
      </ErrorBoundary>
    )
  }

  // ── Navigation handler (sidebar uses string paths) ──────────────────────
  function navigate(path: string) {
    switch (path) {
      case '/dashboard':
        setRoute(role === 'MEDIC' ? { id: 'medic-dashboard' } : { id: 'dashboard' })
        break
      case '/medics':
        setRoute({ id: 'medics' })
        break
      case '/patients':
        setRoute({ id: 'medic-patients' })
        break
      case '/admin':
      case '/admin/disputes':
        setRoute({ id: 'admin-disputes' })
        break
      case '/admin/users':
        setRoute({ id: 'admin-users' })
        break
      case '/admin/audit':
        setRoute({ id: 'admin-audit' })
        break
      case '/admin/medics':
        setRoute({ id: 'admin-users' })
        break
      case '/clinic':
        setRoute({ id: 'clinic-dashboard' })
        break
      case '/reports':
        setRoute({ id: 'clinic-dashboard' })
        break
      case '/schedule':
        setRoute({ id: 'medic-dashboard' })
        break
      case '/medic/onboarding':
        setRoute({ id: 'medic-onboarding' })
        break
      case '/medic/payouts':
        setRoute({ id: 'medic-payouts' })
        break
      case '/settings':
        setRoute({ id: 'settings' })
        break
      case '/profile':
        setRoute({ id: 'profile' })
        break
      default:
        setRoute(defaultRoute())
    }
  }

  // ── Authenticated routes ─────────────────────────────────────────────────
  const renderContent = () => {
    switch (route.id) {
      // ── Patient ──────────────────────────────────────────────────────────
      case 'dashboard':
        return (
          <PatientDashboard
            onFindMedic={() => setRoute({ id: 'medics' })}
            onViewBooking={(id) => setRoute({ id: 'booking-detail', bookingId: id })}
          />
        )

      case 'medics':
        return (
          <MedicSearchPage
            onViewProfile={(m) => setRoute({ id: 'medic-profile', medicId: m.id })}
            onBook={(medic) => setRoute({ id: 'medic-profile', medicId: medic.id })}
          />
        )

      case 'medic-profile':
        return (
          <>
            <MedicProfilePage
              medicId={route.medicId}
              onBack={() => setRoute({ id: 'medics' })}
              onBook={(medic, slot) => setBookingTarget({ medic, slot })}
            />
            {bookingTarget && (
              <BookingSheet
                medic={bookingTarget.medic}
                slot={bookingTarget.slot}
                open={!!bookingTarget}
                onClose={() => setBookingTarget(null)}
                onSuccess={(bookingId) => {
                  setBookingTarget(null)
                  setRoute({ id: 'booking-detail', bookingId })
                }}
                onPaymentResult={(bookingId, _paymentId) => {
                  // Payment confirmed; navigate to booking detail
                  setBookingTarget(null)
                  setRoute({ id: 'booking-detail', bookingId })
                }}
              />
            )}
          </>
        )

      case 'booking-detail':
        return (
          <BookingDetailPage
            bookingId={route.bookingId}
            consultationId={route.booking ? 'consult-1' : undefined}
            onBack={() => setRoute({ id: 'dashboard' })}
            onJoinConsultation={(consultationId) =>
              setRoute({
                id: 'patient-consultation',
                consultationId,
                bookingId: route.bookingId,
                booking: route.booking ?? {
                  id: route.bookingId,
                  patientId: 'usr-patient-1',
                  medicId: 'med-1',
                  slotId: 'slot-1',
                  consultationType: 'VIDEO',
                  paymentStatus: 'HELD',
                  bookingStatus: 'CONFIRMED',
                  createdAt: new Date().toISOString(),
                  slot: {
                    id: 'slot-1',
                    medicId: 'med-1',
                    startTime: new Date().toISOString(),
                    endTime: new Date(Date.now() + 1800_000).toISOString(),
                    consultationType: 'VIDEO',
                    available: false,
                  },
                },
              })
            }
          />
        )

      case 'patient-consultation':
        return (
          <PatientConsultationPage
            consultationId={route.consultationId}
            bookingId={route.bookingId}
            booking={route.booking}
            onBack={() => setRoute({ id: 'booking-detail', bookingId: route.bookingId })}
          />
        )

      case 'booking-result':
        return (
          <BookingResultPage
            bookingId={route.bookingId}
            paymentId={route.paymentId}
            clientSecret={route.clientSecret}
            publishableKey={route.publishableKey}
            onViewBooking={(id) => setRoute({ id: 'booking-detail', bookingId: id })}
            onRetry={() => setRoute({ id: 'medics' })}
          />
        )

      case 'profile':
        return <ProfileEditPage />

      case 'settings':
        return <SettingsPage />

      case 'dispute-file':
        return (
          <div className="px-6 py-8 max-w-xl">
            <h1 className="text-xl font-semibold text-[--color-text-primary] mb-6">
              File a Dispute
            </h1>
            <DisputeFilingForm
              bookingId={route.bookingId}
              onSuccess={() => setRoute({ id: 'dashboard' })}
              onCancel={() => setRoute({ id: 'dashboard' })}
            />
          </div>
        )

      // ── Medic ─────────────────────────────────────────────────────────────
      case 'medic-dashboard':
        return (
          <MedicDashboard
            onViewPatient={(patientId) => setRoute({ id: 'patient-detail', patientId })}
            onStartConsultation={(bookingId) => {
              // In a real app, we'd fetch the booking and consultation ID
              // Here we route directly to a placeholder consultation
              setRoute({ id: 'consultation', consultationId: 'consult-1', booking: {
                id: bookingId,
                patientId: 'usr-patient-1',
                medicId: 'med-1',
                slotId: 'slot-1',
                consultationType: 'VIDEO',
                paymentStatus: 'CAPTURED',
                bookingStatus: 'CONFIRMED',
                createdAt: new Date().toISOString(),
                slot: {
                  id: 'slot-1',
                  medicId: 'med-1',
                  startTime: new Date().toISOString(),
                  endTime: new Date(Date.now() + 1800_000).toISOString(),
                  consultationType: 'VIDEO',
                  available: false,
                },
              }})
            }}
            onViewSchedule={() => setRoute({ id: 'medic-dashboard' })}
          />
        )

      case 'medic-patients':
        return (
          <div className="px-6 py-6">
            <h1 className="text-xl font-semibold text-[--color-text-primary] mb-4">Patients</h1>
            <p className="text-sm text-[--color-text-secondary]">
              Select a patient from your upcoming appointments to view their record.
            </p>
            <div className="mt-4">
              <button
                className="text-sm text-[--color-accent] hover:underline"
                onClick={() => setRoute({ id: 'patient-detail', patientId: 'usr-patient-1' })}
              >
                Maria Popescu → View record
              </button>
            </div>
          </div>
        )

      case 'patient-detail':
        return (
          <PatientDetailPage
            patientId={route.patientId}
            onBack={() => setRoute({ id: 'medic-patients' })}
            onStartConsultation={(patientId) =>
              setRoute({ id: 'consultation', consultationId: 'consult-1', booking: {
                id: 'bk-new',
                patientId,
                medicId: 'med-1',
                slotId: 'slot-1',
                consultationType: 'VIDEO',
                paymentStatus: 'CAPTURED',
                bookingStatus: 'CONFIRMED',
                createdAt: new Date().toISOString(),
                slot: {
                  id: 'slot-1',
                  medicId: 'med-1',
                  startTime: new Date().toISOString(),
                  endTime: new Date(Date.now() + 1800_000).toISOString(),
                  consultationType: 'VIDEO',
                  available: false,
                },
              }})
            }
          />
        )

      case 'consultation':
        return (
          <MedicConsultationWorkspace
            consultationId={route.consultationId}
            booking={route.booking}
            onBack={() => setRoute({ id: 'medic-dashboard' })}
            onViewPatient={(patientId) => setRoute({ id: 'patient-detail', patientId })}
          />
        )

      case 'medic-onboarding':
        return (
          <MedicOnboardingPage
            onGoToPayouts={() => setRoute({ id: 'medic-payouts' })}
          />
        )

      case 'medic-payouts':
        return (
          <MedicPayoutsPage
            onGoToOnboarding={() => setRoute({ id: 'medic-onboarding' })}
          />
        )

      // ── Admin ─────────────────────────────────────────────────────────────
      case 'admin-disputes':
        return <AdminDisputeQueue />

      case 'admin-users':
        return <AdminUserManagement />

      case 'admin-audit':
        return <AuditLogViewer />

      // ── Clinic Manager ────────────────────────────────────────────────────
      case 'clinic-dashboard':
        return <ClinicManagerDashboard />

      default:
        return (
          <PatientDashboard
            onFindMedic={() => setRoute({ id: 'medics' })}
            onViewBooking={(id) => setRoute({ id: 'booking-detail', bookingId: id })}
          />
        )
    }
  }

  return (
    <ErrorBoundary>
      <AbilityProvider>
        <AppShell onNavigate={navigate} currentPath={routeToPath(route)}>
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </AppShell>
      </AbilityProvider>
    </ErrorBoundary>
  )
}

function routeToPath(route: Route): string {
  switch (route.id) {
    case 'dashboard': return '/dashboard'
    case 'medics': return '/medics'
    case 'medic-profile': return '/medics'
    case 'booking-detail': return '/bookings'
    case 'booking-result': return '/bookings'
    case 'profile': return '/profile'
    case 'settings': return '/settings'
    case 'medic-dashboard': return '/dashboard'
    case 'medic-patients': return '/patients'
    case 'patient-detail': return '/patients'
    case 'consultation': return '/consultations'
    case 'patient-consultation': return '/consultations'
    case 'medic-onboarding': return '/medic/onboarding'
    case 'medic-payouts': return '/medic/payouts'
    case 'admin-disputes': return '/admin'
    case 'admin-users': return '/admin/users'
    case 'admin-audit': return '/admin/audit'
    case 'clinic-dashboard': return '/reports'
    default: return '/dashboard'
  }
}
