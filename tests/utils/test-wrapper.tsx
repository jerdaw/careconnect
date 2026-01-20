import React from "react"
import { NextIntlClientProvider } from "next-intl"

// Default mock messages
const defaultMessages = {
  Common: {
    loading: "Loading...",
    error: "Error",
    retry: "Retry",
    ServiceCard: {
      reportIssue: "Report Issue",
      details: "Details",
    },
  },
  Eligibility: {
    likelyQualify: "Likely Qualify",
  },
  Feedback: {
    title: "Report Issue",
    description: "Help us improve",
    issueType: "Issue Type",
    types: {
      wrong_phone: "Wrong phone",
      wrong_address: "Wrong address",
      service_closed: "Service closed",
      other: "Other",
    },
    messageLabel: "Message",
    messagePlaceholder: "Enter details...",
    cancel: "Cancel",
    submit: "Submit",
  },
  Badges: {
    ontarioWide: "Ontario-wide",
    canadaWide: "Canada-wide",
  },
  Distance: {
    ontarioWide: "Ontario-wide",
    canadaWide: "Canada-wide",
  },
  ServiceDetail: {
    kingston: "Kingston",
    report: "Report",
    details: "Details",
    free: "Free",
    verified: "Verified",
    merged: "Merged",
    closed: "Closed",
  },
}

import { render, RenderOptions } from "@testing-library/react"

interface TestWrapperProps {
  children: React.ReactNode
  locale?: string
  messages?: Record<string, unknown>
}

export const TestWrapper = ({ children, locale = "en", messages = defaultMessages }: TestWrapperProps) => {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { locale?: string; messages?: Record<string, any> }
) => {
  const { locale, messages, ...rest } = options || {}
  return render(ui, {
    wrapper: (props) => <TestWrapper {...props} locale={locale} messages={messages} />,
    ...rest,
  })
}

export * from "@testing-library/react"
