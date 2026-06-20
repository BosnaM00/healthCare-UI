import React, { useState } from 'react'
import { Calendar, Search } from 'lucide-react'
import { useMyBookings } from '../hooks/use-booking'
import { BookingRow } from './PatientDashboard'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/layout/EmptyState'
import { SkeletonCard } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MyBookingsPageProps {
  onViewBooking?: (bookingId: string) => void
  onFindMedic?: () => void
}

export function MyBookingsPage({ onViewBooking, onFindMedic }: MyBookingsPageProps) {
  const { data, isLoading } = useMyBookings()
  const [tab, setTab] = useState('upcoming')

  const bookings = data?.content ?? []
  const now = new Date()

  const upcoming = bookings
    .filter((b) =>
      b.paymentStatus !== 'REFUNDED' &&
      b.paymentStatus !== 'FAILED' &&
      new Date(b.slot.startTime) > now
    )
    .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime())

  const past = bookings
    .filter((b) => new Date(b.slot.startTime) <= now && b.paymentStatus !== 'REFUNDED')
    .sort((a, b) => new Date(b.slot.startTime).getTime() - new Date(a.slot.startTime).getTime())

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="My Bookings"
        description="View and manage your upcoming and past consultations"
        actions={
          <Button onClick={onFindMedic} className="gap-2">
            <Search className="h-4 w-4" />
            Find a doctor
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-[68px]" />
          ))}
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-3">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-7 w-7" />}
                title="No upcoming appointments"
                description="Book a consultation with a specialist to get started."
                action={onFindMedic ? { label: 'Find a doctor', onClick: onFindMedic } : undefined}
              />
            ) : (
              upcoming.map((b) => (
                <BookingRow key={b.id} booking={b} onView={onViewBooking} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-3">
            {past.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-7 w-7" />}
                title="No past consultations"
                description="Your completed and previous appointments will appear here."
              />
            ) : (
              past.map((b) => (
                <BookingRow key={b.id} booking={b} onView={onViewBooking} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  )
}
