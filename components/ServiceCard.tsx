'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, ExternalLink, ShieldCheck, Flag } from 'lucide-react';
import { Service, VerificationLevel } from '../types/service';
import { generateFeedbackLink } from '../lib/feedback';

interface ServiceCardProps {
    service: Service;
    score?: number; // Optional search score for display or debugging
    matchReasons?: string[];
}

import { useLocale, useTranslations } from 'next-intl';

import { trackEvent } from '../lib/analytics';

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
    const locale = useLocale();
    const t = useTranslations('Common');
    const isVerified = service.verification_level === VerificationLevel.L2 || service.verification_level === VerificationLevel.L3;

    // Localized Content Selection
    const name = (locale === 'fr' && service.name_fr) ? service.name_fr : service.name;
    const description = (locale === 'fr' && service.description_fr) ? service.description_fr : service.description;
    const address = (locale === 'fr' && service.address_fr) ? service.address_fr : service.address;

    const handleTrack = (type: 'click_website' | 'click_call') => {
        trackEvent(service.id, type);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="group relative overflow-hidden rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800"
        >
            {/* Search Match Highlight - Hidden per user request to avoid echoing sensitive queries */}
            {/* {matchReasons && matchReasons.length > 0 && resultIsHighlyRelevant(score) && (
                <div className="mb-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    ✨ {matchReasons[0]}
                </div>
            )} */}

            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {name}
                        </h3>
                        {isVerified && (
                            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                <ShieldCheck className="h-3 w-3" />
                                Verified
                            </span>
                        )}
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                            {service.intent_category}
                        </span>
                    </div>

                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {description.length > 150
                            ? `${description.substring(0, 150)}...`
                            : description}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                {address && (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span>{address}</span>
                    </div>
                )}
                {service.phone && (
                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-neutral-400" />
                        <a
                            href={`tel:${service.phone}`}
                            className="hover:text-blue-600 hover:underline"
                            onClick={() => handleTrack('click_call')}
                        >
                            {service.phone}
                        </a>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {service.identity_tags.slice(0, 3).map((tag, idx) => (
                    <span
                        key={idx}
                        className="inline-flex items-center rounded-md bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-500/10 dark:bg-neutral-800 dark:text-neutral-400 dark:ring-neutral-700"
                    >
                        {tag.tag}
                    </span>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <a
                    href={generateFeedbackLink(service)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                    <Flag className="h-3 w-3" />
                    {t('ServiceCard.reportIssue')}
                </a>

                <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                    onClick={() => handleTrack('click_website')}
                >
                    Details <ExternalLink className="h-3 w-3" />
                    <span className="sr-only">{t('Common.openInNewTab')}</span>
                </a>
            </div>
        </motion.div>
    );
};

// Helper: Determine if we should show the "Magic Sparkle" reason
// function resultIsHighlyRelevant(score?: number) {
//     return score && score > 35;
// }

export default ServiceCard;
