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

import { render, RenderOptions } from "@testing-library/react"

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

export const renderWithProviders = (
    ui: React.ReactElement,
    options?: Omit<RenderOptions, "wrapper"> & { locale?: string; messages?: Record<string, any> }
) => {
    const { locale, messages, ...rest } = options || {}
    return render(ui, {
        wrapper: (props) => (
            <TestWrapper {...props} locale={locale} messages={messages} />
        ),
        ...rest,
    })
}

export * from "@testing-library/react"
