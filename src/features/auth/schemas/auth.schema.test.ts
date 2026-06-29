import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  mfaSchema,
  passwordResetConfirmSchema,
} from './auth.schema'

describe('loginSchema', () => {
  it('accepts a valid email and non-empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'secret',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'secret',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('mfaSchema', () => {
  it('accepts a 6-digit code', () => {
    expect(mfaSchema.safeParse({ code: '123456' }).success).toBe(true)
  })

  it('rejects a code with the wrong length', () => {
    expect(mfaSchema.safeParse({ code: '123' }).success).toBe(false)
  })

  it('rejects a code containing non-digits', () => {
    expect(mfaSchema.safeParse({ code: '12345a' }).success).toBe(false)
  })
})

describe('passwordResetConfirmSchema', () => {
  it('accepts a strong matching password', () => {
    const result = passwordResetConfirmSchema.safeParse({
      password: 'Passw0rd',
      confirmPassword: 'Passw0rd',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when passwords do not match', () => {
    const result = passwordResetConfirmSchema.safeParse({
      password: 'Passw0rd',
      confirmPassword: 'Different1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a password without an uppercase letter or number', () => {
    const result = passwordResetConfirmSchema.safeParse({
      password: 'password',
      confirmPassword: 'password',
    })
    expect(result.success).toBe(false)
  })
})
