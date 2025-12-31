"use client";

import { useState, useEffect } from 'react';
// import { Link as I18nLink } from '@/i18n/routing'; 
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
// import { useTranslations } from 'next-intl';
// import LanguageSwitcher from './LanguageSwitcher'; 
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { ProfileSettings } from '@/components/settings';
import BetaBanner from '@/components/BetaBanner';

export function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
            scrolled
                ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-neutral-200/50 dark:border-white/10 shadow-sm"
                : "bg-transparent border-transparent"
        )}>
            <div className={cn("transition-all duration-300", scrolled ? "h-0 overflow-hidden opacity-0" : "h-auto opacity-100")}>
                <BetaBanner />
            </div>

            <nav className={cn(
                "mx-auto max-w-7xl px-4 flex items-center justify-between sm:px-6 lg:px-8 transition-all duration-300",
                scrolled ? "py-3" : "py-5"
            )}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-primary-500/30 transition-shadow">
                        K
                    </div>
                    <span className={cn(
                        "text-xl font-bold tracking-tight transition-colors heading-display",
                        "text-neutral-900 dark:text-white"
                    )}>
                        Care Connect
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/about" className={cn(
                        "text-sm font-medium transition-colors hover:text-primary-500",
                        "text-neutral-600 dark:text-neutral-300"
                    )}>
                        About
                    </Link>
                    <Link href="/partners" className={cn(
                        "text-sm font-medium transition-colors hover:text-primary-500",
                        "text-neutral-600 dark:text-neutral-300"
                    )}>
                        For Partners
                    </Link>
                    <Link href="/submit-service" className={cn(
                        "text-sm font-medium transition-colors hover:text-primary-500",
                        "text-neutral-600 dark:text-neutral-300"
                    )}>
                        Suggest Service
                    </Link>

                    <a href="tel:911" className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Emergency: 911
                    </a>

                    <ProfileSettings />
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
                    <ProfileSettings />
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
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden glass border-t border-neutral-200 dark:border-neutral-800"
                    >
                        <div className="p-4 space-y-4 flex flex-col">
                            <Link href="/about" className="text-sm font-medium text-neutral-600 dark:text-neutral-300 p-2">
                                About
                            </Link>
                            <Link href="/partners" className="text-sm font-medium text-neutral-600 dark:text-neutral-300 p-2">
                                For Partners
                            </Link>
                            <div className="pt-2">
                                <ProfileSettings />
                            </div>
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
    );
}
