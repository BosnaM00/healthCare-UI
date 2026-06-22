import React, { useState, lazy, Suspense } from 'react'
import { AbilityProvider } from '@/lib/can'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { PageContainer } from '@/components/layout/PageContainer'

// Auth — LoginPage stays eager (unauthenticated entry point, avoids a load flash).
import { LoginPage } from '@/features/auth/components/LoginPage'

// ── Lazily-loaded routes (code-split per feature). Components are named exports,
//    so each import is mapped to a `default` for React.lazy. The consultation
//    pages pull in the Daily.co SDK, which therefore loads only on demand. ──────
const MfaPage = lazy(() => import('@/features/auth/components/MfaPage').then((m) => ({ default: m.MfaPage })))
const PasswordResetPage = lazy(() => import('@/features/auth/components/PasswordResetPage').then((m) => ({ default: m.PasswordResetPage })))

const RegisterPage = lazy(() => import('@/features/patient/components/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ProfileEditPage = lazy(() => import('@/features/patient/components/ProfileEditPage').then((m) => ({ default: m.ProfileEditPage })))

const PatientDashboard = lazy(() => import('@/features/booking/components/PatientDashboard').then((m) => ({ default: m.PatientDashboard })))
const MyBookingsPage = lazy(() => import('@/features/booking/components/MyBookingsPage').then((m) => ({ default: m.MyBookingsPage })))
const MyPrescriptionsPage = lazy(() => import('@/features/patient/components/MyPrescriptionsPage').then((m) => ({ default: m.MyPrescriptionsPage })))
const MedicSearchPage = lazy(() => import('@/features/booking/components/MedicSearchPage').then((m) => ({ default: m.MedicSearchPage })))
const MedicProfilePage = lazy(() => import('@/features/booking/components/MedicProfilePage').then((m) => ({ default: m.MedicProfilePage })))
const BookingSheet = lazy(() => import('@/features/booking/components/BookingSheet').then((m) => ({ default: m.BookingSheet })))
const BookingDetailPage = lazy(() => import('@/features/booking/components/BookingDetailPage').then((m) => ({ default: m.BookingDetailPage })))

const MedicOnboardingPage = lazy(() => import('@/features/payments/MedicOnboardingPage').then((m) => ({ default: m.MedicOnboardingPage })))
const MedicPayoutsPage = lazy(() => import('@/features/payments/MedicPayoutsPage').then((m) => ({ default: m.MedicPayoutsPage })))
const BookingResultPage = lazy(() => import('@/features/payments/BookingResultPage').then((m) => ({ default: m.BookingResultPage })))

const MedicDashboard = lazy(() => import('@/features/medic/components/MedicDashboard').then((m) => ({ default: m.MedicDashboard })))
const MedicPatientsPage = lazy(() => import('@/features/medic/components/MedicPatientsPage').then((m) => ({ default: m.MedicPatientsPage })))
const PatientDetailPage = lazy(() => import('@/features/medic/components/PatientDetailPage').then((m) => ({ default: m.PatientDetailPage })))

// Consultation — heaviest chunk (Daily.co video SDK), loaded only when a call starts.
const MedicConsultationWorkspace = lazy(() => import('@/features/consultation/components/MedicConsultationWorkspace').then((m) => ({ default: m.MedicConsultationWorkspace })))
const PatientConsultationPage = lazy(() => import('@/features/consultation/components/PatientConsultationPage').then((m) => ({ default: m.PatientConsultationPage })))

const AdminDisputeQueue = lazy(() => import('@/features/admin/components/AdminDisputeQueue').then((m) => ({ default: m.AdminDisputeQueue })))
const AdminUserManagement = lazy(() => import('@/features/admin/components/AdminUserManagement').then((m) => ({ default: m.AdminUserManagement })))
const AuditLogViewer = lazy(() => import('@/features/admin/components/AuditLogViewer').then((m) => ({ default: m.AuditLogViewer })))
const DisputeFilingForm = lazy(() => import('@/features/admin/components/DisputeFilingForm').then((m) => ({ default: m.DisputeFilingForm })))

const ClinicManagerDashboard = lazy(() => import('@/features/clinic/components/ClinicManagerDashboard').then((m) => ({ default: m.ClinicManagerDashboard })))

const SettingsPage = lazy(() => import('@/features/settings/components/SettingsPage').then((m) => ({ default: m.SettingsPage })))

import { useAuthStore } from '@/stores/auth.store'
import type { Booking, Medic, Slot } from '@/types'

// Fallback shown while a lazily-loaded route chunk is fetched.
function RouteFallback() {
  return (
    <PageContainer>
      <div
        className="flex items-center justify-center py-24 text-sm text-[--color-text-secondary]"
        role="status"
        aria-live="polite"
      >
        <span className="animate-pulse">Loading…</span>
      </div>
    </PageContainer>
  )
}

// ── Simple client-side router ──────────────────────────────────────────────
type Route =
  // Auth
  | { id: 'login' }
  | { id: 'mfa' }
  | { id: 'password-reset' }
  | { id: 'register' }
  // Patient routes
  | { id: 'dashboard' }
  | { id: 'my-bookings' }
  | { id: 'my-prescriptions' }
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
  | { id: 'consultation'; bookingId: string; booking: Booking }
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
          <Suspense fallback={<RouteFallback />}>
            <RegisterPage
              onSuccess={() => setRoute({ id: 'dashboard' })}
              onLogin={() => setRoute({ id: 'login' })}
            />
          </Suspense>
        </ErrorBoundary>
      )
    }
    if (route.id === 'mfa') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <MfaPage
              onSuccess={() => setRoute(defaultRoute())}
              onBack={() => setRoute({ id: 'login' })}
            />
          </Suspense>
        </ErrorBoundary>
      )
    }
    if (route.id === 'password-reset') {
      return (
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <PasswordResetPage onBack={() => setRoute({ id: 'login' })} />
          </Suspense>
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
      case '/bookings':
        setRoute({ id: 'my-bookings' })
        break
      case '/prescriptions':
        setRoute({ id: 'my-prescriptions' })
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

      case 'my-bookings':
        return (
          <MyBookingsPage
            onViewBooking={(id) => setRoute({ id: 'booking-detail', bookingId: id })}
            onFindMedic={() => setRoute({ id: 'medics' })}
          />
        )

      case 'my-prescriptions':
        return <MyPrescriptionsPage />

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
            consultationId={undefined}
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
          <PageContainer size="narrow">
            <h1 className="text-xl font-semibold text-[--color-text-primary] mb-6">
              File a Dispute
            </h1>
            <DisputeFilingForm
              bookingId={route.bookingId}
              onSuccess={() => setRoute({ id: 'dashboard' })}
              onCancel={() => setRoute({ id: 'dashboard' })}
            />
          </PageContainer>
        )

      // ── Medic ─────────────────────────────────────────────────────────────
      case 'medic-dashboard':
        return (
          <MedicDashboard
            onViewPatient={(patientId) => setRoute({ id: 'patient-detail', patientId })}
            onStartConsultation={(bookingId, booking) => {
              setRoute({ id: 'consultation', bookingId, booking })
            }}
            onViewSchedule={() => setRoute({ id: 'medic-dashboard' })}
          />
        )

      case 'medic-patients':
        return (
          <MedicPatientsPage
            onViewPatient={(patientId) => setRoute({ id: 'patient-detail', patientId })}
          />
        )

      case 'patient-detail':
        return (
          <PatientDetailPage
            patientId={route.patientId}
            onBack={() => setRoute({ id: 'medic-patients' })}
            onStartConsultation={() => setRoute({ id: 'medic-dashboard' })}
          />
        )

      case 'consultation':
        return (
          <MedicConsultationWorkspace
            bookingId={route.bookingId}
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
            <Suspense fallback={<RouteFallback />}>
              <div
                key={route.id}
                className="animate-in fade-in-0 slide-in-from-bottom-1 duration-[--duration-normal]"
              >
                {renderContent()}
              </div>
            </Suspense>
          </ErrorBoundary>
        </AppShell>
      </AbilityProvider>
    </ErrorBoundary>
  )
}

function routeToPath(route: Route): string {
  switch (route.id) {
    case 'dashboard': return '/dashboard'
    case 'my-bookings': return '/bookings'
    case 'my-prescriptions': return '/prescriptions'
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
