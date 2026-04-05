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
  Search: {
    matchReasonsHeading: "Why this matched",
    matchReasonsToggle: "See more match reasons",
    hideMatchReasons: "Hide extra match reasons",
    matchReasonsListLabel: "Match reasons",
  },
  Eligibility: {
    likelyQualify: "Likely Qualify",
  },
  Feedback: {
    reportIssueTitle: "Report Issue",
    reportIssueDescription: "Help us improve {service}",
    issueTypeLabel: "Issue Type",
    issueTypes: {
      wrong_contact_info: "Wrong contact info",
      service_closed: "Service closed",
      eligibility_incorrect: "Eligibility incorrect",
      other: "Other",
    },
    detailsLabel: "Message",
    detailsPlaceholder: "Enter details...",
    cancel: "Cancel",
    submitReport: "Submit",
    successTitle: "Thanks",
    successMessage: "Your report was submitted",
    errorTitle: "Something went wrong",
    errorMessage: "Please try again",
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
