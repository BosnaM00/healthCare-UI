import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth.handlers'
import { bookingHandlers } from './handlers/booking.handlers'
import { patientHandlers } from './handlers/patient.handlers'

export const worker = setupWorker(
  ...authHandlers,
  ...bookingHandlers,
  ...patientHandlers,
)
