import { z } from 'zod'

export const patientRegisterSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-()]{8,20}$/, 'Invalid phone number')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
    gdprConsent: z.literal(true, { errorMap: () => ({ message: 'You must accept the privacy policy' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export const patientProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{8,20}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
})

export type PatientRegisterInput = z.infer<typeof patientRegisterSchema>
export type PatientProfileInput = z.infer<typeof patientProfileSchema>
