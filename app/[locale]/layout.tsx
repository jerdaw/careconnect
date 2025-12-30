import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";
import BetaBanner from "../../components/BetaBanner";
import { AuthProvider } from "../../components/AuthProvider";
import { ErrorBoundary } from "../../components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Kingston Care Connect",
  description: "Find local support services for food, housing, crisis, and health in Kingston, Ontario.",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KCC",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <BetaBanner />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
