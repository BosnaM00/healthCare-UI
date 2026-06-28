import React, { useEffect } from 'react'
import {
  ArrowLeft, AlertTriangle, User, Heart, Clock, FileText, Pill, File,
  Phone, Mail, Building2, Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHeader } from '@/components/layout/PageHeader'
import { VitalsChart } from './VitalsChart'
import { PatientTimeline } from './PatientTimeline'
import { PrescriptionCard } from '@/features/consultation/components/PrescriptionCard'
import { downloadPrescriptionPdf } from '@/features/consultation/hooks/use-consultation'
import {
  usePatientDetail,
  usePatientVitals,
  usePatientDocuments,
  usePatientPrescriptions,
  usePatientTimeline,
} from '../hooks/use-medic'
import { cn } from '@/lib/utils'
import type { DocumentType } from '@/types'

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  LAB_RESULT: 'Lab Result',
  IMAGING: 'Imaging',
  REFERRAL: 'Referral',
  INSURANCE: 'Insurance',
  OTHER: 'Other',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function KeyValueRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2">
      <dt className="text-xs text-[--color-text-tertiary] uppercase tracking-wide w-36 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-[--color-text-primary] flex-1">{value ?? <span className="text-[--color-text-tertiary]">—</span>}</dd>
    </div>
  )
}

interface PatientDetailPageProps {
  patientId: string
  onBack: () => void
  onStartConsultation?: (patientId: string) => void
}

export function PatientDetailPage({ patientId, onBack, onStartConsultation }: PatientDetailPageProps) {
  const { data: patient, isLoading } = usePatientDetail(patientId)
  const { data: vitals = [] } = usePatientVitals(patientId)
  const { data: documents = [] } = usePatientDocuments(patientId)
  const { data: prescriptions = [] } = usePatientPrescriptions(patientId)
  const { data: timeline = [] } = usePatientTimeline(patientId)

  // Audit log on mount
  useEffect(() => {
    // useAuditLogger equivalent — fire-and-forget
    fetch('/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'READ_PATIENT_RECORD', entityType: 'patient', entityId: patientId }),
    }).catch(() => {})
  }, [patientId])

  if (isLoading) {
    return (
      <div className="px-6 py-8 space-y-4" aria-label="Loading patient record">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-[--radius-md] bg-[--color-surface-raised] animate-pulse" />
        ))}
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-[--color-text-secondary]">Patient record not found.</p>
        <Button variant="ghost" size="sm" onClick={onBack} className="mt-4">Go back</Button>
      </div>
    )
  }

  const initials = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase()
  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
  const hasAllergies = patient.allergies.length > 0

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-4 pb-0 shrink-0">
        <PageHeader
          title={`${patient.firstName} ${patient.lastName}`}
          description={`${age} years · ${patient.bloodType ?? 'Blood type unknown'}`}
          actions={
            <div className="flex gap-2">
              {onStartConsultation && (
                <Button size="sm" onClick={() => onStartConsultation(patientId)}>
                  Start Consultation
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            </div>
          }
        />

        {/* Allergy alert */}
        {hasAllergies && (
          <div
            className="flex items-start gap-2 rounded-[--radius-md] border border-danger/30 bg-danger/5 px-4 py-3 mb-4"
            role="alert"
          >
            <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-danger">Allergies</p>
              <p className="text-sm text-[--color-text-primary]">{patient.allergies.join(', ')}</p>
            </div>
          </div>
        )}
        <Separator />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: identity card */}
        <aside
          className="w-64 shrink-0 border-r border-[--color-border] p-4 overflow-y-auto"
          aria-label="Patient identity"
        >
          <div className="flex flex-col items-center gap-3 pb-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-[--color-accent]/10 text-[--color-accent]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="font-semibold text-[--color-text-primary]">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-xs text-[--color-text-tertiary]">{age} years old</p>
            </div>
          </div>

          <Separator className="mb-3" />

          <dl className="space-y-1">
            <KeyValueRow
              label="DOB"
              value={new Date(patient.dateOfBirth).toLocaleDateString('ro-RO')}
            />
            <KeyValueRow label="Blood type" value={patient.bloodType} />
            <KeyValueRow
              label="Email"
              value={
                <a href={`mailto:${patient.email}`} className="hover:underline text-[--color-accent]">
                  {patient.email}
                </a>
              }
            />
            <KeyValueRow label="Phone" value={patient.phone} />
            <KeyValueRow label="Insurer" value={patient.insurerName} />
            <KeyValueRow label="Policy #" value={patient.insurancePolicyNumber} />
          </dl>

          {patient.activeConditions.length > 0 && (
            <>
              <Separator className="my-3" />
              <p className="text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wide mb-2">
                Active conditions
              </p>
              <div className="flex flex-wrap gap-1">
                {patient.activeConditions.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">
                    {c}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* Right: tabs */}
        <main className="flex-1 overflow-auto">
          <Tabs defaultValue="overview" className="h-full">
            <div className="px-6 pt-4 border-b border-[--color-border] sticky top-0 bg-[--color-surface] z-10">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="vitals">
                  Vitals
                  {vitals.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                      {vitals.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="documents">
                  Documents
                  {documents.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                      {documents.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="prescriptions">
                  Prescriptions
                  {prescriptions.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                      {prescriptions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview */}
            <TabsContent value="overview" className="px-6 py-6 space-y-6">
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    label: 'Last consultation',
                    value: patient.lastConsultationAt
                      ? new Date(patient.lastConsultationAt).toLocaleDateString('ro-RO')
                      : 'None',
                    icon: <Calendar className="h-4 w-4" />,
                  },
                  {
                    label: 'Prescriptions',
                    value: prescriptions.length,
                    icon: <Pill className="h-4 w-4" />,
                  },
                  {
                    label: 'Documents',
                    value: documents.length,
                    icon: <File className="h-4 w-4" />,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[--radius-md] border border-[--color-border] bg-[--color-surface-raised] p-4"
                  >
                    <div className="flex items-center gap-2 text-[--color-text-secondary] mb-1">
                      {stat.icon}
                      <span className="text-xs">{stat.label}</span>
                    </div>
                    <p className="text-xl font-semibold text-[--color-text-primary]">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Latest prescriptions */}
              {prescriptions.slice(0, 2).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[--color-text-primary] mb-3">
                    Active Prescriptions
                  </h3>
                  <div className="space-y-2">
                    {prescriptions.slice(0, 2).map((rx) => (
                      <PrescriptionCard key={rx.id} prescription={rx} compact />
                    ))}
                  </div>
                </div>
              )}

              {/* Latest timeline events */}
              {timeline.slice(0, 5).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[--color-text-primary] mb-3">
                    Recent Activity
                  </h3>
                  <PatientTimeline events={timeline} maxItems={5} />
                </div>
              )}
            </TabsContent>

            {/* Vitals */}
            <TabsContent value="vitals" className="px-6 py-6 space-y-8">
              {(['heartRate', 'systolicBp', 'diastolicBp', 'weightKg', 'oxygenSaturation'] as const).map(
                (key) => (
                  <VitalsChart key={key} readings={vitals} vitalKey={key} />
                )
              )}
            </TabsContent>

            {/* History */}
            <TabsContent value="history" className="px-6 py-6">
              <PatientTimeline events={timeline} />
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="px-6 py-6">
              {documents.length === 0 ? (
                <p className="text-sm text-[--color-text-tertiary] text-center py-12">
                  No documents uploaded
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-[--radius-md] border border-[--color-border] p-3 hover:border-[--color-accent]/40 hover:bg-[--color-surface-raised] transition-colors group"
                      aria-label={`${doc.name} — ${DOC_TYPE_LABELS[doc.type]}`}
                    >
                      <FileText
                        className="h-6 w-6 text-[--color-text-tertiary] group-hover:text-[--color-accent] mb-2 transition-colors"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium text-[--color-text-primary] truncate">{doc.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1">
                          {DOC_TYPE_LABELS[doc.type]}
                        </Badge>
                        <span className="text-xs text-[--color-text-tertiary]">{formatBytes(doc.sizeBytes)}</span>
                      </div>
                      <time
                        dateTime={doc.uploadedAt}
                        className="block text-xs text-[--color-text-tertiary] mt-1"
                      >
                        {new Date(doc.uploadedAt).toLocaleDateString('ro-RO')}
                      </time>
                    </a>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Prescriptions */}
            <TabsContent value="prescriptions" className="px-6 py-6 space-y-3">
              {prescriptions.length === 0 ? (
                <p className="text-sm text-[--color-text-tertiary] text-center py-12">
                  No prescriptions issued
                </p>
              ) : (
                prescriptions.map((rx) => (
                  <PrescriptionCard
                    key={rx.id}
                    prescription={rx}
                    onReissue={(id) => console.log('Reissue', id)}
                    onDownloadPdf={downloadPrescriptionPdf}
                    aiDiagnosis
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
