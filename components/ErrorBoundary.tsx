"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logger, generateErrorId } from "@/lib/logger"

interface Props {
  children?: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorId?: string
  copied: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    copied: false,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorId: generateErrorId() }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state

    // Log to centralized logger
    logger.error("Uncaught error in ErrorBoundary", error, {
      component: "ErrorBoundary",
      errorId: errorId || "unknown",
      componentStack: errorInfo.componentStack || undefined,
    })

    // Call optional error callback
    if (this.props.onError && errorId) {
      this.props.onError(error, errorInfo, errorId)
    }
  }

  private handleCopyErrorId = async () => {
    if (this.state.errorId) {
      try {
        await navigator.clipboard.writeText(this.state.errorId)
        this.setState({ copied: true })
        setTimeout(() => this.setState({ copied: false }), 2000)
      } catch {
        logger.warn("Failed to copy error ID to clipboard", { component: "ErrorBoundary" })
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">Something went wrong</h2>
          <p className="mb-4 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
            We encountered an unexpected error. Please try reloading the page.
          </p>

          {/* Error ID for support */}
          {this.state.errorId && (
            <div className="mb-6 flex items-center gap-2 rounded-md bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              <span>Error ID: {this.state.errorId}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={this.handleCopyErrorId}
                title="Copy error ID"
              >
                {this.state.copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          )}

          <Button onClick={() => window.location.reload()} variant="default">
            Reload Page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
