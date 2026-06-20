import React from 'react'
import { Pill } from 'lucide-react'
import { useMyPrescriptions } from '../hooks/use-patient'
import { PrescriptionCard } from '@/features/consultation/components/PrescriptionCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/layout/EmptyState'
import { SkeletonCard } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'

export function MyPrescriptionsPage() {
  const { data, isLoading } = useMyPrescriptions()

  const prescriptions = [...(data ?? [])].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
  )

  const handleDownloadPdf = () => {
    toast({ title: 'Preparing download', description: 'Your prescription PDF will be ready shortly.' })
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="My Prescriptions"
        description="Prescriptions issued by your doctors"
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="h-16" />
          ))}
        </div>
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={<Pill className="h-7 w-7" />}
          title="No prescriptions yet"
          description="Prescriptions your doctors issue during consultations will appear here."
        />
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <PrescriptionCard
              key={rx.id}
              prescription={rx}
              compact
              onDownloadPdf={handleDownloadPdf}
            />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
