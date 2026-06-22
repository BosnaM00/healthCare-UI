import { PageContainer } from '@/components/layout/PageContainer'
import { useMedicPatients } from '@/features/medic/hooks/use-medic'

interface MedicPatientsPageProps {
  /** Navigate to a patient's record. Receives the patient's real id (UUID). */
  onViewPatient: (patientId: string) => void
}

/**
 * Medic "Patients" list. Fetches every patient the medic has booked from the
 * real backend (`GET /medic/patients`) and links each to their record using the
 * patient's actual id, so the detail page resolves instead of 404-ing.
 */
export function MedicPatientsPage({ onViewPatient }: MedicPatientsPageProps) {
  const { data: patients, isLoading, isError } = useMedicPatients()

  return (
    <PageContainer>
      <h1 className="text-xl font-semibold text-[--color-text-primary] mb-1">Patients</h1>
      <p className="text-sm text-[--color-text-secondary]">
        Patients you have treated. Select one to view their record.
      </p>

      <div className="mt-6">
        {isLoading && (
          <p className="text-sm text-[--color-text-secondary]">Loading patients…</p>
        )}

        {isError && (
          <p className="text-sm text-[--color-danger]">
            Couldn't load your patients. Please try again.
          </p>
        )}

        {!isLoading && !isError && (patients?.length ?? 0) === 0 && (
          <p className="text-sm text-[--color-text-secondary]">
            No patients yet. They'll appear here once you have a booking.
          </p>
        )}

        <ul className="space-y-2" role="list">
          {patients?.map((patient) => (
            <li key={patient.id}>
              <button
                className="w-full text-left rounded-[--radius-md] border border-[--color-border] bg-[--color-surface] px-4 py-3 hover:bg-[--color-surface-raised] transition-colors"
                onClick={() => onViewPatient(patient.id)}
              >
                <span className="block font-medium text-[--color-text-primary]">
                  {patient.firstName} {patient.lastName}
                </span>
                <span className="block text-sm text-[--color-text-secondary]">
                  {patient.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </PageContainer>
  )
}
