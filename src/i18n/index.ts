import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// RO translations
import roPayments from './locales/ro/payments.json'
import roPayouts from './locales/ro/payouts.json'

// EN translations
import enPayments from './locales/en/payments.json'
import enPayouts from './locales/en/payouts.json'

export const defaultNS = 'payments'

i18n
  .use(initReactI18next)
  .init({
    lng: 'ro',
    fallbackLng: 'en',
    defaultNS,
    ns: ['payments', 'payouts'],
    resources: {
      ro: {
        payments: roPayments,
        payouts: roPayouts,
      },
      en: {
        payments: enPayments,
        payouts: enPayouts,
      },
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
  })

export default i18n
