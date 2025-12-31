import { Search, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
    query: string;
    setQuery: (query: string) => void;
    handleSaveSearch: () => void;
    placeholder: string;
    label: string;
    onFocus?: () => void;
    onBlur?: () => void;
}

export default function SearchBar({
    query,
    setQuery,
    handleSaveSearch,
    placeholder,
    label,
    onFocus,
    onBlur
}: SearchBarProps) {
    return (
        <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                <Search className="h-6 w-6 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
                type="text"
                className="block w-full rounded-2xl border-0 bg-transparent py-4 pl-14 pr-14 text-neutral-900 placeholder:text-neutral-400 focus:ring-0 focus:outline-none outline-none sm:text-lg sm:leading-6 dark:text-white"
                placeholder={placeholder}
                aria-label={label}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {query.length > 0 && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveSearch}
                    className="absolute inset-y-0 right-12 my-auto h-10 w-10 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Save this search"
                    aria-label="Save this search"
                >
                    <Heart className="h-5 w-5" />
                </Button>
            )}
            <VoiceSearchButton onResult={(text) => setQuery(text)} />
        </div>
    );
}

import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils"

function VoiceSearchButton({ onResult }: { onResult: (text: string) => void }) {
    const t = useTranslations('VoiceInput');
    const { state, isSupported, startListening, stopListening, error } = useVoiceInput(onResult);

    if (!isSupported) return null;

    const isActive = state === 'listening';
    const isProcessing = state === 'processing';

    const getTooltip = () => {
        if (error) return error;
        if (isActive) return t('stop');
        return t('start');
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={isActive ? stopListening : startListening}
            className={cn(
                "absolute inset-y-0 right-2 my-auto h-10 w-10 transition-colors",
                isActive ? "text-red-600 bg-red-50 dark:bg-red-900/20 animate-pulse" : "text-neutral-400 hover:text-primary-500",
                isProcessing && "animate-spin text-primary-500"
            )}
            title={getTooltip()}
            aria-label={getTooltip()}
        >
            {isProcessing ? (
                <Loader2 className="h-5 w-5" />
            ) : isActive ? (
                <Mic className="h-5 w-5" />
            ) : (
                <MicOff className="h-5 w-5" />
            )}
        </Button>
    )
}
