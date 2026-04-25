import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-[--radius-lg] border border-[--color-danger]/20 bg-[--color-danger]/5 p-8 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[--color-danger]/15 text-[--color-danger]">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[--color-text-primary]">
              Something went wrong
            </h2>
            <p className="text-sm text-[--color-text-secondary] max-w-sm">
              Our team has been notified. Please try again or contact support if the issue
              persists.
            </p>
          </div>
          <Button variant="outline" onClick={this.handleReset}>
            Try again
          </Button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-w-lg overflow-auto rounded-[--radius-md] bg-[--color-neutral-100] p-3 text-left text-xs text-[--color-danger]">
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
