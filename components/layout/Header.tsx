"use client"

import { useState, useEffect } from "react"
// import { Link as I18nLink } from '@/i18n/routing';
import { useAuth } from "@/components/AuthProvider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "./ThemeToggle"
// import { LanguageSelector } from "./LanguageSelector"
import BetaBanner from "@/components/BetaBanner"
import { EmergencyModal } from "@/components/ui/EmergencyModal"

export function Header({ forceSolid = false }: { forceSolid?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false)
  const { user } = useAuth()
  const t = useTranslations("Navigation")
  const tPartners = useTranslations("Partners")
  const tEmergency = useTranslations("EmergencyModal")

  // Combine forceSolid with scroll detection
  const isSolid = forceSolid || scrolled

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <header
        className={cn(
          "fixed top-0 right-0 left-0 z-50 border-b transition-all duration-300",
          (isSolid || mobileMenuOpen)
            ? "border-neutral-200/50 bg-white shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950"
            : "border-transparent bg-transparent"
        )}
      >
        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-out",
            isSolid
              ? "max-h-0 opacity-0 -translate-y-2"
              : "max-h-12 opacity-100 translate-y-0"
          )}
        >
          <BetaBanner />
        </div>

        <nav
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8",
            isSolid ? "py-3" : "py-5"
          )}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "relative flex h-9 items-center justify-center rounded-xl transition-all"
                )}
              >
                <Image
                  src="/logo.png"
                  alt="KCC Logo"
                  width={64}
                  height={32}
                  className="h-7 w-auto object-contain"
                  priority
                />
              </div>
            </div>
            {/* Full name - hidden on mobile unless scrolled, always visible on desktop */}
            <span
              className={cn(
                "heading-display text-lg font-bold tracking-tight transition-all",
                "text-neutral-900 dark:text-white",
                // Mobile: only show when scrolled (hero not visible)
                isSolid ? "block" : "hidden md:block"
              )}
            >
              Kingston Care Connect
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center md:flex">
            {/* Emergency - High priority, always visible */}
            <button
              onClick={() => setEmergencyModalOpen(true)}
              className="mr-6 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
              {tEmergency("buttonLabel")}
            </button>

            {/* Navigation Links Group */}
            <nav className="flex items-center gap-5" aria-label="Main navigation">
              <Link
                href="/about"
                className={cn(
                  "hover:text-primary-500 text-sm font-medium transition-colors",
                  "text-neutral-600 dark:text-neutral-300"
                )}
              >
                {t("about")}
              </Link>
              <Link
                href="/about/partners"
                className={cn(
                  "hover:text-primary-500 text-sm font-medium transition-colors",
                  "text-neutral-600 dark:text-neutral-300"
                )}
              >
                {tPartners("link")}
              </Link>
              <Link
                href="/submit-service"
                className={cn(
                  "hover:text-primary-500 text-sm font-medium transition-colors",
                  "text-neutral-600 dark:text-neutral-300"
                )}
              >
                {t("suggest")}
              </Link>
            </nav>

            {/* Separator */}
            <div className="mx-4 h-5 w-px bg-neutral-200 dark:bg-neutral-700" aria-hidden="true" />

            {/* Utility Controls Group */}
            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            {/* Primary CTA */}
            {user ? (
              <Button variant={isSolid ? "default" : "secondary"} className="ml-4" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button variant={isSolid ? "default" : "secondary"} className="ml-4" asChild>
                <Link href="/login">Partner Login</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            <ThemeToggle />
            <button
              className="p-2 text-neutral-600 dark:text-neutral-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X /> : <Menu className="text-neutral-900 dark:text-white" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-neutral-200 bg-white/95 backdrop-blur-xl md:hidden dark:border-neutral-800 dark:bg-slate-950/95"
            >
              <div className="flex flex-col space-y-2 p-4">
                {/* Emergency - prominent at top */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setEmergencyModalOpen(true)
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
                  </span>
                  {tEmergency("buttonLabel")}
                </button>

                <div className="my-2 h-px bg-neutral-200 dark:bg-neutral-700" />

                {/* Navigation Links */}
                <Link href="/about" className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
                  {t("about")}
                </Link>
                <Link href="/about/partners" className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
                  {tPartners("link")}
                </Link>
                <Link href="/submit-service" className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
                  {t("suggest")}
                </Link>

                <div className="my-2 h-px bg-neutral-200 dark:bg-neutral-700" />

                {/* Language Switcher */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Language</span>
                  <LanguageSwitcher />
                </div>

                <div className="my-2 h-px bg-neutral-200 dark:bg-neutral-700" />

                {/* Primary CTA */}
                {user ? (
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/login">Partner Login</Link>
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />
    </>
  )
}
