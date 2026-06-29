import type { Metadata, Viewport } from "next"
import { Inter, Outfit } from "next/font/google"
import "../globals.css"
import { BRAND_NAME, getPublicBaseUrl } from "@/lib/brand"

export const metadata: Metadata = {
  metadataBase: new URL(getPublicBaseUrl()),
  title: BRAND_NAME,
  description: "Find local support services for food, housing, crisis, and health in Kingston, Ontario.",
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

export default function AuthRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
