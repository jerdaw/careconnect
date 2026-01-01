"use client"

import { useState, useEffect } from "react"
// import { Link as I18nLink } from '@/i18n/routing';
import { useAuth } from "@/components/AuthProvider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
// import { useTranslations } from 'next-intl';
// import LanguageSwitcher from './LanguageSwitcher';
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "./ThemeToggle"
import BetaBanner from "@/components/BetaBanner"

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user } = useAuth()

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
        scrolled
          ? "border-neutral-200/50 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80"
          : "border-transparent bg-transparent"
      )}
    >
      <div
        className={cn("transition-all duration-300", scrolled ? "h-0 overflow-hidden opacity-0" : "h-auto opacity-100")}
      >
        <BetaBanner />
      </div>

      <nav
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8",
          scrolled ? "py-3" : "py-5"
        )}
      >
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          {/* <div className="from-primary-500 to-primary-600 group-hover:shadow-primary-500/30 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-lg font-bold text-white shadow-lg transition-shadow">
            K
          </div> */}
          <span
            className={cn(
              "heading-display text-xl font-bold tracking-tight transition-colors",
              "text-neutral-900 dark:text-white"
            )}
          >
            Kingston Care Connect
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/about"
            className={cn(
              "hover:text-primary-500 text-sm font-medium transition-colors",
              "text-neutral-600 dark:text-neutral-300"
            )}
          >
            About
          </Link>
          <Link
            href="/partners"
            className={cn(
              "hover:text-primary-500 text-sm font-medium transition-colors",
              "text-neutral-600 dark:text-neutral-300"
            )}
          >
            For Partners
          </Link>
          <Link
            href="/submit-service"
            className={cn(
              "hover:text-primary-500 text-sm font-medium transition-colors",
              "text-neutral-600 dark:text-neutral-300"
            )}
          >
            Suggest Service
          </Link>

          <a
            href="tel:911"
            className="hidden items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 transition-colors hover:bg-red-200 sm:inline-flex dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
            Emergency: 911
          </a>

          <ThemeToggle />

          {user ? (
            <Button variant={scrolled ? "default" : "secondary"} asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button variant={scrolled ? "default" : "secondary"} asChild>
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
            className="glass border-t border-neutral-200 md:hidden dark:border-neutral-800"
          >
            <div className="flex flex-col space-y-4 p-4">
              <Link href="/about" className="p-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                About
              </Link>
              <Link href="/partners" className="p-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                For Partners
              </Link>
              {user ? (
                <Button className="w-full" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button className="w-full" asChild>
                  <Link href="/login">Partner Login</Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    </>
  )
}
