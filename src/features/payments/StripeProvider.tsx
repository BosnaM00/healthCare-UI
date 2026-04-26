import React, { useMemo } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import type { StripeElementLocale, Appearance } from '@stripe/stripe-js'
import i18n from '@/i18n'

// Load Stripe once at module level — never recreate on render
let stripePromise: ReturnType<typeof loadStripe> | null = null

function getStripePromise(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

const brandAppearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0F766E',       // deep teal brand token
    colorBackground: '#ffffff',
    colorText: '#1a1a2e',
    colorDanger: '#dc2626',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    borderRadius: '8px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid #e2e8f0',
      boxShadow: 'none',
    },
    '.Input:focus': {
      border: '1px solid #0F766E',
      boxShadow: '0 0 0 2px rgba(15,118,110,0.15)',
      outline: 'none',
    },
    '.Label': {
      fontWeight: '500',
      color: '#475569',
    },
  },
}

interface StripeProviderProps {
  clientSecret: string
  publishableKey: string
  children: React.ReactNode
}

export function StripeProvider({ clientSecret, publishableKey, children }: StripeProviderProps) {
  const stripe = useMemo(() => getStripePromise(publishableKey), [publishableKey])

  // Map i18n language to Stripe locale; fall back to 'en'
  const locale = useMemo((): StripeElementLocale => {
    const lang = i18n.language?.split('-')[0] ?? 'en'
    const supported: StripeElementLocale[] = ['ro', 'en']
    return (supported.includes(lang as StripeElementLocale) ? lang : 'en') as StripeElementLocale
  }, [])

  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret,
        appearance: brandAppearance,
        locale,
      }}
    >
      {children}
    </Elements>
  )
}
