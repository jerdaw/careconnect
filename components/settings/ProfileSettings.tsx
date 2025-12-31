'use client';

import { useUserContext } from '@/hooks/useUserContext';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { User, ShieldCheck, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const AGE_GROUPS = ['youth', 'adult', 'senior'] as const;
const IDENTITY_OPTIONS = ['indigenous', 'newcomer', '2slgbtqi+', 'veteran', 'disability'] as const;

export function ProfileSettings() {
    const t = useTranslations('Settings');
    const { context, updateAgeGroup, toggleIdentity, optIn, optOut } = useUserContext();
    const [isOpen, setIsOpen] = useState(false);

    if (!context.hasOptedIn) {
        return (
            <div className="p-4 bg-primary-50 dark:bg-primary-950/30 rounded-lg border border-primary-100 dark:border-primary-900">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary-600 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-sm text-primary-900 dark:text-primary-100 mb-1">{t('personalizePrompt')}</h3>
                        <p className="text-xs text-primary-700 dark:text-primary-300 mb-3 leading-relaxed">{t('personalizeDescription')}</p>
                        <Button size="sm" onClick={optIn} className="w-full sm:w-auto text-xs">{t('enablePersonalization')}</Button>
                    </div>
                </div>
            </div>
        );
    }

    // If opted in, we show a compact summary that expands into settings
    return (
        <div className="border rounded-lg bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
            {!isOpen ? (
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{t('enablePersonalization')}</p>
                            <p className="text-xs text-neutral-500">
                                {context.ageGroup ? t(`ageGroups.${context.ageGroup}`) : t('ageGroup')} • {context.identities.length} tags
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>Edit</Button>
                </div>
            ) : (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="p-4 space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-lg">{t('personalizePrompt')}</h4>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><X className="w-4 h-4" /></Button>
                    </div>

                    <section>
                        <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">{t('ageGroup')}</h4>
                        <div className="flex flex-wrap gap-2">
                            {AGE_GROUPS.map((group) => (
                                <Button
                                    key={group}
                                    variant={context.ageGroup === group ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => updateAgeGroup(group)}
                                    className={cn(
                                        context.ageGroup === group ? "bg-primary-600 hover:bg-primary-700" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    )}
                                >
                                    {t(`ageGroups.${group}`)}
                                </Button>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h4 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">{t('identities')}</h4>
                        <div className="flex flex-wrap gap-2">
                            {IDENTITY_OPTIONS.map((id) => (
                                <Button
                                    key={id}
                                    variant={context.identities.includes(id) ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => toggleIdentity(id)}
                                    className={cn(
                                        context.identities.includes(id)
                                            ? "bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white"
                                            : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    )}
                                >
                                    {t(`identityTags.${id}`)}
                                </Button>
                            ))}
                        </div>
                    </section>

                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => { optOut(); setIsOpen(false); }}>
                            {t('clearProfile')}
                        </Button>
                        <Button onClick={() => setIsOpen(false)} size="sm">Done</Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
