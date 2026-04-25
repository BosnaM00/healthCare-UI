import React, { useState } from 'react'
import { AbilityProvider } from '@/lib/can'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { MfaPage } from '@/features/auth/components/MfaPage'
import { PasswordResetPage } from '@/features/auth/components/PasswordResetPage'
import { RegisterPage } from '@/features/patient/components/RegisterPage'
import { PatientDashboard } from '@/features/booking/components/PatientDashboard'
import { MedicSearchPage } from '@/features/booking/components/MedicSearchPage'
import { MedicProfilePage } from '@/features/booking/components/MedicProfilePage'
import { BookingSheet } from '@/features/booking/components/BookingSheet'
import { BookingDetailPage } from '@/features/booking/components/BookingDetailPage'
import { ProfileEditPage } from '@/features/patient/components/ProfileEditPage'
import { useAuthStore } from '@/stores/auth.store'
import type { Medic, Slot } from '@/types'

// ── Simple client-side router ──────────────────────────────────────────────
type Route =
  | { id: 'login' }
  | { id: 'mfa' }
  | { id: 'password-reset' }
  | { id: 'register' }
  | { id: 'dashboard' }
  | { id: 'medics' }
  | { id: 'medic-profile'; medicId: string }
  | { id: 'booking-detail'; bookingId: string }
  | { id: 'profile' }

interface BookingTarget {
  medic: Medic
  slot: Slot
}

export default function App() {
  const { isAuthenticated, setLoading } = useAuthStore()
  const [route, setRoute] = useState<Route>(isAuthenticated ? { id: 'dashboard' } : { id: 'login' })
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
            onSuccess={() => setRoute({ id: 'dashboard' })}
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
          onSuccess={() => setRoute({ id: 'dashboard' })}
          onForgotPassword={() => setRoute({ id: 'password-reset' })}
          onRegister={() => setRoute({ id: 'register' })}
        />
      </ErrorBoundary>
    )
  }

  // Authenticated routes — wrapped in AppShell
  const renderContent = () => {
    switch (route.id) {
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
              onBook={(medic, slot) => {
                setBookingTarget({ medic, slot })
              }}
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
              />
            )}
          </>
        )

      case 'booking-detail':
        return (
          <BookingDetailPage
            bookingId={route.bookingId}
            onBack={() => setRoute({ id: 'dashboard' })}
          />
        )

      case 'profile':
        return <ProfileEditPage />

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
        <AppShell>
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </AppShell>
      </AbilityProvider>
    </ErrorBoundary>
  )
}
