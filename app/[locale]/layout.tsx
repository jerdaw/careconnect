import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import "../globals.css"
import { AuthProvider } from "@/components/layout/AuthProvider"
import { ErrorBoundary } from "@/components/error/ErrorBoundary"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { Outfit, Inter } from "next/font/google"
import { ClientOnly } from "@/components/ui/ClientOnly"
import { Toaster } from "@/components/ui/toaster"
import { ChatAssistantShell } from "@/components/ai/ChatAssistantShell"
import { TranslationBanner } from "@/components/layout/TranslationBanner"
import { OfflineSync } from "@/components/offline/OfflineSync"
import { OfflineBanner } from "@/components/ui/OfflineBanner"

export const metadata: Metadata = {
  title: "HelpBridge",
  description: "Find local support services for food, housing, crisis, and health in Kingston, Ontario.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HelpBridge",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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

  const messages = await getMessages({ locale })

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <ErrorBoundary>
                <TranslationBanner />
                <OfflineBanner />
                {children}
                <ClientOnly>
                  <OfflineSync />
                  <ChatAssistantShell />
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
