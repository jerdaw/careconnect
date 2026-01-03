"use client"

import { Link } from "@/i18n/routing"
import { useTranslations } from 'next-intl';
import { ShieldCheck, Mail, Github, Twitter } from "lucide-react"
import Image from "next/image"

export function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="relative mt-24 overflow-hidden bg-neutral-950 text-white">
      {/* Gradient accent line */}
      <div className="from-primary-500 via-accent-500 to-primary-500 absolute top-0 right-0 left-0 h-1 bg-gradient-to-r" />

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Logo & Mission */}
          <div className="space-y-6 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 items-center justify-center transition-all">
                <Image 
                  src="/logo.png" 
                  alt="KCC Logo" 
                  width={64} 
                  height={32}
                  className="h-7 w-auto object-contain"
                />
              </div>
              <span className="heading-display text-xl font-bold tracking-tight text-white">Kingston Care Connect</span>
            </div>
            <p className="max-w-md leading-relaxed text-neutral-400">
              Connecting Kingston residents with the support services they need. Built with care for our community.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="GitHub" className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10">
                <Github className="h-5 w-5 text-neutral-400" />
              </a>
              <a href="#" aria-label="Twitter" className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10">
                <Twitter className="h-5 w-5 text-neutral-400" />
              </a>
              <a
                href="mailto:feedback@kingstoncare.ca"
                aria-label="Contact by Email"
                className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10"
              >
                <Mail className="h-5 w-5 text-neutral-400" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{t("quickLinks.community")}</h3>
            <ul className="space-y-3 text-neutral-400">
              <li>
                <Link href="/search?category=food" className="hover:text-primary-400 transition-colors">
                  {t("quickLinks.food")}
                </Link>
              </li>
              <li>
                <Link href="/search?category=housing" className="hover:text-primary-400 transition-colors">
                  {t("quickLinks.housing")}
                </Link>
              </li>
              <li>
                <Link href="/search?category=health" className="hover:text-primary-400 transition-colors">
                  {t("quickLinks.health")}
                </Link>
              </li>
              <li>
                <Link href="/search?category=crisis" className="hover:text-primary-400 transition-colors">
                  {t("quickLinks.crisis")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{t("quickLinks.legal")}</h3>
            <ul className="space-y-3 text-neutral-400">
              <li>
                <Link href="/about" className="hover:text-primary-400 transition-colors">
                  {t("quickLinks.about")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary-400 transition-colors">
                  {t("quickLinks.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary-400 transition-colors">
                  {t("quickLinks.terms")}
                </Link>
              </li>
              <li>
                <Link href="/content-policy" className="hover:text-primary-400 transition-colors">
                  {t("quickLinks.contentPolicy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-neutral-800 pt-8 text-sm text-neutral-400">
          <p className="text-center text-neutral-500">
            {t("emergencyDisclaimer")}
          </p>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p>© 2024 Kingston Care Connect (Pilot v1.0)</p>

            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Privacy First • No Tracking • Open Source</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
