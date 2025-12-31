'use client';

import { useUserContext } from '@/hooks/useUserContext';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { User, ShieldCheck, Bell, BellOff, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { NotificationCategory } from '@/types/notifications';
import { useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

const AGE_GROUPS = ['youth', 'adult', 'senior'] as const;
const IDENTITY_OPTIONS = ['indigenous', 'newcomer', '2slgbtqi+', 'veteran', 'disability'] as const;
const NOTIFICATION_CATEGORIES: NotificationCategory[] = ['crisis', 'food', 'housing', 'health', 'general'];

export function ProfileSettings() {
    const t = useTranslations('Settings');
    const { context, updateAgeGroup, toggleIdentity, optIn, optOut } = useUserContext();
    const { isSupported, isSubscribed, subscribedCategories, isLoading, subscribe, unsubscribe } = usePushNotifications();
    const [open, setOpen] = useState(false);

    const toggleSubscription = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            await subscribe(NOTIFICATION_CATEGORIES); // Subscribe to all by default initially
        }
    };

    const toggleCategory = async (category: NotificationCategory) => {
        if (!isSubscribed) return;

        const newCategories = subscribedCategories.includes(category)
            ? subscribedCategories.filter(c => c !== category)
            : [...subscribedCategories, category];

        // If removing last category, could unsubscribe, but let's keep it simple for now
        // and just update the subscription with the new list
        if (newCategories.length === 0) {
            await unsubscribe();
        } else {
            await subscribe(newCategories);
        }
    };

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
                            <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-3">{t('Notifications.title')}</h4>

                            {/* Master Toggle */}
                            <div className="flex items-center justify-between mb-3 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                <div className="flex items-center gap-2">
                                    {isSubscribed ? <Bell className="w-4 h-4 text-primary-600" /> : <BellOff className="w-4 h-4 text-neutral-500" />}
                                    <span className="text-sm font-medium">{t('Notifications.enable')}</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant={isSubscribed ? "default" : "secondary"}
                                    className="h-7 text-xs"
                                    onClick={toggleSubscription}
                                    disabled={!isSupported || isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : (isSubscribed ? 'On' : 'Off')}
                                </Button>
                            </div>

                            {!isSupported && (
                                <p className="text-xs text-amber-600 mb-2">Push notifications not supported on this browser.</p>
                            )}

                            {/* Categories */}
                            {isSubscribed && (
                                <div className="space-y-1 pl-1">
                                    {NOTIFICATION_CATEGORIES.map((cat) => (
                                        <div key={cat} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`notif-${cat}`}
                                                checked={subscribedCategories.includes(cat)}
                                                onChange={() => toggleCategory(cat)}
                                                className="w-3 h-3 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <label htmlFor={`notif-${cat}`} className="text-sm cursor-pointer select-none">
                                                {t(`Notifications.categories.${cat}`)}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
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
