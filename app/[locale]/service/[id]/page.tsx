'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Service, VerificationLevel } from '@/types/service';
import { useAuth } from '@/components/AuthProvider';
import { claimService } from '@/lib/services';
import {
    MapPin, Phone, Globe, Mail, Clock,
    ShieldCheck, AlertCircle, ArrowLeft,
    Share2, Flag, Building2, Info
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const t = useTranslations('ServiceDetail');
    const locale = useLocale();
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [copying, setCopying] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [claimError, setClaimError] = useState<string | null>(null);
    const [claimSuccess, setClaimSuccess] = useState(false);

    useEffect(() => {
        async function fetchService() {
            const { data, error: _error } = await supabase
                .from('services')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                const mappedData = {
                    ...data,
                    embedding: typeof data.embedding === 'string' ? JSON.parse(data.embedding) : data.embedding,
                    identity_tags: typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags,
                    intent_category: data.category,
                    verification_level: data.verification_status,
                } as unknown as Service;
                setService(mappedData);
            }
            setLoading(false);
        }
        fetchService();
    }, [id]);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopying(true);
        setTimeout(() => setCopying(false), 2000);
    };

    const handleClaim = async () => {
        if (!user) return; // User should be logged in via login redirect link

        // Mock organization ID for now since we don't have a full org management UI yet
        // In a real app, this would come from the user's profile/claims
        const mockOrgId = 'org_' + user.id.substring(0, 8);

        setClaiming(true);
        setClaimError(null);

        const result = await claimService(id, mockOrgId);

        if (result.success) {
            setClaimSuccess(true);
            // Refresh service data
            const { data } = await supabase.from('services').select('*').eq('id', id).single();
            if (data) {
                setService({
                    ...data,
                    embedding: typeof data.embedding === 'string' ? JSON.parse(data.embedding) : data.embedding,
                    identity_tags: typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags,
                    intent_category: data.category,
                    verification_level: data.verification_status,
                } as unknown as Service);
            }
        } else {
            setClaimError(result.error || 'Claim failed');
        }
        setClaiming(false);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-neutral-950">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-6 text-center dark:bg-neutral-950">
                <AlertCircle className="mb-4 h-16 w-16 text-neutral-300" />
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('notFound')}</h1>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t('notFoundText')}</p>
                <Button asChild className="mt-8">
                    <Link href="/">&larr; {t('backToSearch')}</Link>
                </Button>
            </div>
        );
    }

    const isVerified = service.verification_level === VerificationLevel.L2 || service.verification_level === VerificationLevel.L3;
    const name = (locale === 'fr' && service.name_fr) ? service.name_fr : service.name;
    const description = (locale === 'fr' && service.description_fr) ? service.description_fr : service.description;
    const address = (locale === 'fr' && service.address_fr) ? service.address_fr : service.address;

    return (
        <main className="min-h-screen bg-stone-50 dark:bg-neutral-950">
            {/* Header / Navigation */}
            <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
                    <Button variant="ghost" size="sm" asChild className="gap-2">
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                            {t('back')}
                        </Link>
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                            <Share2 className="h-4 w-4" />
                            {copying ? t('shareSuccess') : t('share')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 gap-8 lg:grid-cols-3"
                >
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                {isVerified && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        {t('officialProvider')}
                                    </span>
                                )}
                                <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                    {service.intent_category}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
                                {name}
                            </h1>
                            <div className="mt-6 prose prose-neutral dark:prose-invert max-w-none">
                                <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
                                    {description}
                                </p>
                            </div>
                        </section>

                        {/* Service Metadata Blocks */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {service.hours && (
                                <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                                    <div className="flex items-center gap-3 mb-3 text-neutral-900 dark:text-white font-semibold">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                        {t('hours')}
                                    </div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{service.hours}</p>
                                </div>
                            )}
                            {service.fees && (
                                <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                                    <div className="flex items-center gap-3 mb-3 text-neutral-900 dark:text-white font-semibold">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                        {t('fees')}
                                    </div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{service.fees}</p>
                                </div>
                            )}
                        </div>

                        {service.eligibility && (
                            <section className="rounded-xl border border-blue-100 bg-blue-50/30 p-6 dark:border-blue-900/20 dark:bg-blue-900/10">
                                <div className="flex items-center gap-3 mb-3 text-blue-900 dark:text-blue-100 font-semibold">
                                    <Info className="h-5 w-5 text-blue-600" />
                                    {t('eligibility')}
                                </div>
                                <p className="text-sm text-blue-800/80 dark:text-blue-300/80 leading-relaxed italic">
                                    {service.eligibility}
                                </p>
                            </section>
                        )}

                        {service.application_process && (
                            <section>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">{t('access')}</h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">{service.application_process}</p>
                            </section>
                        )}

                        {/* Tags */}
                        <section>
                            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">{t('focusedOn')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {service.identity_tags.map((tag, idx) => (
                                    <span key={idx} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800">
                                        {tag.tag}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar / Quick Actions */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">{t('contactInfo')}</h3>

                            <div className="space-y-4">
                                {address && (
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
                                            <MapPin className="h-4 w-4 text-neutral-500" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-neutral-400 uppercase tracking-tighter">{t('location')}</div>
                                            <p className="text-sm text-neutral-900 dark:text-white mt-0.5">{address}</p>
                                        </div>
                                    </div>
                                )}

                                {service.phone && (
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
                                            <Phone className="h-4 w-4 text-neutral-500" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-neutral-400 uppercase tracking-tighter">{t('phone')}</div>
                                            <a href={`tel:${service.phone}`} className="text-sm text-blue-600 hover:underline hover:text-blue-500 dark:text-blue-400 block mt-0.5">{service.phone}</a>
                                        </div>
                                    </div>
                                )}

                                {service.url && (
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
                                            <Globe className="h-4 w-4 text-neutral-500" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-neutral-400 uppercase tracking-tighter">{t('website')}</div>
                                            <a href={service.url} target="_blank" rel="noopener" className="text-sm text-blue-600 hover:underline hover:text-blue-500 dark:text-blue-400 block mt-0.5 break-all">
                                                {new URL(service.url).hostname}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {service.email && (
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
                                            <Mail className="h-4 w-4 text-neutral-500" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-medium text-neutral-400 uppercase tracking-tighter">{t('email')}</div>
                                            <a href={`mailto:${service.email}`} className="text-sm text-blue-600 hover:underline hover:text-blue-500 dark:text-blue-400 block mt-0.5 break-all">{service.email}</a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                <Button asChild className="w-full">
                                    <a href={service.url} target="_blank" rel="noopener">{t('visitWebsite')}</a>
                                </Button>
                            </div>
                        </div>

                        {/* Help / Reporting */}
                        <div className="rounded-xl border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mb-4">
                                {t('incorrectInfo')}
                            </p>
                            <Button variant="outline" size="sm" className="w-full gap-2 text-xs" asChild>
                                <a href={`mailto:feedback@kingstoncare.ca?subject=Data%20Update:%20${service.name}`}>
                                    <Flag className="h-3 w-3" />
                                    {t('reportIssue')}
                                </a>
                            </Button>
                        </div>

                        {/* Claim CTA (If unverified/unclaimed) */}
                        {!service.org_id && !isVerified && (
                            <div className="rounded-xl bg-emerald-50 p-6 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/20">
                                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mb-2">{t('claimTitle')}</h4>
                                <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-4">
                                    {t('claimText')}
                                </p>

                                {user ? (
                                    <Button
                                        onClick={handleClaim}
                                        disabled={claiming || claimSuccess}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {claiming ? t('claiming') : claimSuccess ? t('claimed') : t('confirmClaim')}
                                    </Button>
                                ) : (
                                    <Button variant="secondary" size="sm" className="w-full bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-neutral-900 dark:text-emerald-400 dark:border-emerald-800" asChild>
                                        <Link href={`/login?claim=${service.id}`}>{t('claimListing')}</Link>
                                    </Button>
                                )}

                                {claimError && (
                                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">{claimError}</p>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
