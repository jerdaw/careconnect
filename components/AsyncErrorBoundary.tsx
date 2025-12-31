"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "./ui/button"
import { AlertCircle, RefreshCcw, Copy } from "lucide-react"
import { logger } from "@/lib/logger"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  componentName?: string
}

type State = { hasError: false; errorId: null } | { hasError: true; error: Error; errorId: string }

/**
 * AsyncErrorBoundary
 * Specialized error boundary for async components and Suspense.
 * Provides a localized retry mechanism and detailed logging.
 */
export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorId: null }
  }

  public static getDerivedStateFromError(error: Error): State {
    const errorId = `ERR-ASYNC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    return { hasError: true, error, errorId }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const state = this.state
    logger.error(`Async Error in ${this.props.componentName || "Unknown Component"}`, error, {
      errorInfo,
      errorId: state.hasError ? state.errorId : "unknown",
      component: this.props.componentName,
    })
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorId: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/50 p-6 text-center dark:border-red-900/30 dark:bg-red-900/10">
          <div className="mb-3 rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/50 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-red-900 dark:text-red-100">Something went wrong</h3>
          <p className="mb-4 text-xs text-red-700/80 dark:text-red-300/60">
            {this.state.hasError
              ? this.state.error.message
              : "An unexpected error occurred while loading this section."}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="h-8 gap-1.5 border-red-200 text-xs hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/50"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Retry
            </Button>

            <div className="group relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (this.state.hasError) {
                    navigator.clipboard.writeText(this.state.errorId)
                  }
                }}
                className="h-8 gap-1.5 text-[10px] text-red-600/60 hover:text-red-600 dark:text-red-400/60"
              >
                <Copy className="h-3 w-3" />
                ID: {this.state.hasError ? this.state.errorId : ""}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
