import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, ShieldCheck, Flag, ArrowRight, HeartPulse, Home, Utensils, AlertTriangle } from 'lucide-react';
import { Service, VerificationLevel, IntentCategory } from '../types/service';
import { generateFeedbackLink } from '../lib/feedback';
import { Link } from '../i18n/routing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { scaleOnHover } from '@/lib/motion';

import { useLocale, useTranslations } from 'next-intl';
import { trackEvent } from '../lib/analytics';
import { highlightMatches } from '../lib/search/highlight';
import { useUserContext } from '@/hooks/useUserContext';
import { checkEligibility } from '@/lib/eligibility/checker';

/**
 * Props for the ServiceCard component.
 */
interface ServiceCardProps {
    service: Service;
    score?: number;
    matchReasons?: string[];
    highlightTokens?: string[];
}

const CategoryIcon = ({ category, className }: { category: string, className?: string }) => {
    switch (category) {
        case IntentCategory.Health: return <HeartPulse className={className} />;
        case IntentCategory.Housing: return <Home className={className} />;
        case IntentCategory.Food: return <Utensils className={className} />;
        case IntentCategory.Crisis: return <AlertTriangle className={className} />;
        default: return <HeartPulse className={className} />;
    }
};

const ServiceCard: React.FC<ServiceCardProps> = ({ service, highlightTokens = [] }) => {
    const locale = useLocale();
    const t = useTranslations('Common');
    const isVerified = service.verification_level === VerificationLevel.L2 || service.verification_level === VerificationLevel.L3;

    // Localized Content
    const rawName = (locale === 'fr' && service.name_fr) ? service.name_fr : service.name;
    const rawDescription = (locale === 'fr' && service.description_fr) ? service.description_fr : service.description;
    const address = (locale === 'fr' && service.address_fr) ? service.address_fr : service.address;

    // Apply Highlighting
    const nameHtml = highlightMatches(rawName, highlightTokens);
    const descriptionHtml = highlightMatches(rawDescription, highlightTokens);

    // Cast to any to safely access distance if it's not on the main type yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceWithDistance = service as any;

    const handleTrack = (type: 'click_website' | 'click_call') => {
        trackEvent(service.id, type);
    };

    return (
        <motion.div
            variants={scaleOnHover}
            whileHover="whileHover"
            whileTap="whileTap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
        >
            <Card className="group relative h-full overflow-hidden border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary-100 dark:bg-neutral-900 dark:border-neutral-800">
                {/* Top Gradient Line on Hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                <div className="p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center dark:from-primary-900/20 dark:to-primary-800/20">
                            <CategoryIcon category={service.intent_category} className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3
                                    className="text-lg font-bold text-neutral-900 dark:text-white truncate leading-tight"
                                    dangerouslySetInnerHTML={{ __html: nameHtml }}
                                />
                                {checkEligibility(service, useUserContext().context) === 'eligible' && (
                                    <Badge variant="secondary" size="sm" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 gap-1 px-1.5 py-0 border-green-200 dark:border-green-800">
                                        {t('Eligibility.likelyQualify')}
                                    </Badge>
                                )}
                                {isVerified && (
                                    <Badge variant="primary" size="sm" className="gap-1 px-1.5 py-0">
                                        <ShieldCheck className="w-3 h-3" /> Verified
                                    </Badge>
                                )}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant="outline" size="sm">
                                    {service.intent_category}
                                </Badge>
                                <span className="text-xs text-neutral-400">
                                    •
                                </span>
                                <span className="text-xs text-neutral-500">
                                    {serviceWithDistance.distance ? `${serviceWithDistance.distance.toFixed(1)} km away` : 'Kingston'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div
                        className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed flex-grow"
                        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                    />

                    {/* Info Grid */}
                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                        {address && (
                            <div className="flex items-center gap-2 truncate">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                                <span className="truncate">{address}</span>
                            </div>
                        )}
                        {service.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                                <a
                                    href={`tel:${service.phone}`}
                                    className="hover:text-primary-600 hover:underline transition-colors"
                                    onClick={(e) => { e.stopPropagation(); handleTrack('click_call'); }}
                                >
                                    {service.phone}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {service.identity_tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" size="sm" className="bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                {tag.tag}
                            </Badge>
                        ))}
                        {service.identity_tags.length > 3 && (
                            <span className="text-xs text-neutral-400 self-center">+{service.identity_tags.length - 3}</span>
                        )}
                    </div>

                    {/* Footer Actions - Reveal on Hover/Focus */}
                    <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <a
                            href={generateFeedbackLink(service)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                        >
                            <Flag className="h-3 w-3" />
                            {t('ServiceCard.reportIssue')}
                        </a>

                        <Button size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100" asChild>
                            <Link href={`/service/${service.id}`} onClick={() => handleTrack('click_website')}>
                                Details <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1 sm:hidden opacity-100" asChild>
                            <Link href={`/service/${service.id}`} onClick={() => handleTrack('click_website')}>
                                Details <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export default ServiceCard;
