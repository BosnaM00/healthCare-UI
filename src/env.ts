/**
 * Typed, fail-fast environment variable accessor.
 * Import this module instead of reading import.meta.env directly.
 */

function requireEnv(key: string): string {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${key}\n` +
      `Copy .env.example to .env.local and fill in the value.`
    )
  }
  return value as string
}

function optionalEnv(key: string, defaultValue: string): string {
  return (import.meta.env[key] as string | undefined) ?? defaultValue
}

export const env = {
  apiUrl: optionalEnv('VITE_API_URL', 'http://localhost:8080/api'),

  /** Stripe publishable key. Throws if missing. */
  stripePublishableKey: (): string => requireEnv('VITE_STRIPE_PUBLISHABLE_KEY'),

  /** Feature flag: Stripe payments. Defaults to true in dev, false in prod. */
  featureStripe: (): boolean => {
    const raw = import.meta.env['VITE_FEATURE_STRIPE'] as string | undefined
    if (raw === undefined) return import.meta.env.DEV
    return raw === 'true' || raw === '1'
  },
} as const
