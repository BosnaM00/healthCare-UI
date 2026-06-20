import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import '@/styles/tokens.css'
import '@/i18n'

async function prepare() {
  // MSW is enabled in dev by default. Set VITE_MOCK_API=false in .env.local
  // to bypass mocks and hit the real backend (needed for real Stripe testing).
  const mockEnabled = import.meta.env.DEV && import.meta.env.VITE_MOCK_API !== 'false'
  if (mockEnabled) {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    })
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status?: number }).status
          if (status && status >= 400 && status < 500) return false
        }
        return failureCount < 2
      },
      staleTime: 1000 * 60 * 5,
    },
  },
})

prepare().then(() => {
  const rootEl = document.getElementById('root')
  if (!rootEl) throw new Error('Root element not found')

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>
  )
})
