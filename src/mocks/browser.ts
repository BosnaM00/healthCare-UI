import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth.handlers'
import { bookingHandlers } from './handlers/booking.handlers'
import { patientHandlers } from './handlers/patient.handlers'
import { consultationHandlers } from './handlers/consultation.handlers'
import { adminHandlers } from './handlers/admin.handlers'
import { clinicHandlers } from './handlers/clinic.handlers'
import { paymentsHandlers } from './handlers/payments.handlers'

export const worker = setupWorker(
  ...authHandlers,
  ...bookingHandlers,
  ...patientHandlers,
  ...consultationHandlers,
  ...adminHandlers,
  ...clinicHandlers,
  ...paymentsHandlers,
)
