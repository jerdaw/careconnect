import React from "react"
import { NextIntlClientProvider } from "next-intl"

// Default mock messages
const defaultMessages = {
    Common: {
        loading: "Loading...",
        error: "Error",
        retry: "Retry",
    },
    // Add other common namespaces here as needed
}

interface TestWrapperProps {
    children: React.ReactNode
    locale?: string
    messages?: Record<string, unknown>
}

export const TestWrapper = ({
    children,
    locale = "en",
    messages = defaultMessages
}: TestWrapperProps) => {
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    )
}
