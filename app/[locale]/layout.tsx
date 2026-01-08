import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import "../globals.css"
import { AuthProvider } from "../../components/AuthProvider"
import { ErrorBoundary } from "../../components/ErrorBoundary"
import { ThemeProvider } from "@/components/ThemeProvider"
import { Outfit, Inter } from "next/font/google"
import { ClientOnly } from "@/components/ClientOnly"
import { Toaster } from "@/components/ui/toaster"
import ChatAssistant from "@/components/ai/ChatAssistant"

export const metadata: Metadata = {
  title: "Kingston Care Connect",
  description: "Find local support services for food, housing, crisis, and health in Kingston, Ontario.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KCC",
  },
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
}

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <ErrorBoundary>
                {children}
                <ClientOnly>
                  <ChatAssistant />
                </ClientOnly>
                <Toaster />
              </ErrorBoundary>
            </ThemeProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
