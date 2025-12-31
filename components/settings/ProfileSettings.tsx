'use client';

import { useUserContext } from '@/hooks/useUserContext';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { User, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

const AGE_GROUPS = ['youth', 'adult', 'senior'] as const;
const IDENTITY_OPTIONS = ['indigenous', 'newcomer', '2slgbtqi+', 'veteran', 'disability'] as const;

export function ProfileSettings() {
    const t = useTranslations('Settings');
    const { context, updateAgeGroup, toggleIdentity, optIn, optOut } = useUserContext();
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <div className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full transition-colors",
                        context.hasOptedIn ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                    )}>
                        {context.hasOptedIn ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <span className="hidden sm:inline-block font-medium">
                        {context.hasOptedIn ? t('personalizePrompt') : t('enablePersonalization')}
                    </span>
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
                {!context.hasOptedIn ? (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                                <ShieldCheck className="w-8 h-8 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-primary-900 dark:text-white mb-1">{t('personalizePrompt')}</h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                                    {t('personalizeDescription')}
                                </p>
                                <Button onClick={optIn} className="w-full shadow-lg shadow-primary-500/20">
                                    {t('enablePersonalization')}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 space-y-5">
                        <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
                            <h4 className="font-semibold text-sm">{t('personalizePrompt')}</h4>
                            <span className="text-xs text-neutral-400">{context.identities.length} tags active</span>
                        </div>

                        <section>
                            <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-3">{t('ageGroup')}</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {AGE_GROUPS.map((group) => (
                                    <Button
                                        key={group}
                                        variant={context.ageGroup === group ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => updateAgeGroup(group)}
                                        className={cn(
                                            "h-8 text-xs",
                                            context.ageGroup === group ? "bg-primary-600 hover:bg-primary-700" : "hover:bg-neutral-50 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                        )}
                                    >
                                        {t(`ageGroups.${group}`).split(' ')[0]}
                                    </Button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-3">{t('identities')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {IDENTITY_OPTIONS.map((id) => (
                                    <Button
                                        key={id}
                                        variant={context.identities.includes(id) ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => toggleIdentity(id)}
                                        className={cn(
                                            "h-7 text-xs px-2.5",
                                            context.identities.includes(id)
                                                ? "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
                                                : "hover:bg-neutral-50 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                        )}
                                    >
                                        {t(`identityTags.${id}`)}
                                    </Button>
                                ))}
                            </div>
                        </section>

                        <div className="pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 text-xs"
                                onClick={() => { optOut(); setOpen(false); }}
                            >
                                {t('clearProfile')}
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
