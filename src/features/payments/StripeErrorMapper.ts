/**
 * Maps Stripe error codes / decline codes to i18n translation keys in the
 * `payments.errors` namespace. Never echoes raw Stripe messages to the user.
 *
 * Usage:
 *   const key = StripeErrorMapper.toKey(error.decline_code ?? error.code)
 *   const message = t(`errors.${key}`, { ns: 'payments' })
 */

const KNOWN_KEYS = new Set([
  'card_declined',
  'insufficient_funds',
  'expired_card',
  'incorrect_cvc',
  'processing_error',
  'authentication_required',
  'generic_decline',
])

export const StripeErrorMapper = {
  /**
   * Returns a translation key safe for use with t('errors.<key>').
   * Falls back to 'default' for unknown codes.
   */
  toKey(code: string | undefined | null): string {
    if (!code) return 'default'
    // Normalise: lowercase, replace hyphens with underscores
    const normalised = code.toLowerCase().replace(/-/g, '_')
    return KNOWN_KEYS.has(normalised) ? normalised : 'default'
  },

  /**
   * Full translation key including namespace prefix, ready for t().
   */
  toTranslationKey(code: string | undefined | null): string {
    return `errors.${StripeErrorMapper.toKey(code)}`
  },
} as const

/** Format a RON amount from bani to display string */
export function formatRon(bani: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    minimumFractionDigits: 2,
  }).format(bani / 100)
}
