import { useState, useEffect } from 'react';
import { searchServices, SearchResult } from '@/lib/search';

export function useSearch(initialQuery = '') {
    const [query, setQuery] = useState(initialQuery);
    const [category, setCategory] = useState<string | undefined>(undefined);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [isLocating, setIsLocating] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [savedSearches, setSavedSearches] = useState<string[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const saved = localStorage.getItem('kcc_saved_searches');
            if (saved) {
                try {
                    setSavedSearches(JSON.parse(saved) as string[]);
                } catch (e) {
                    console.error("Failed to parse saved searches", e);
                }
            }
        }
    }, []);

    const handleSaveSearch = () => {
        if (!query) return;
        const newSaved = Array.from(new Set([query, ...savedSearches])).slice(0, 5);
        setSavedSearches(newSaved);
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('kcc_saved_searches', JSON.stringify(newSaved));
        }
    };

    const removeSavedSearch = (term: string) => {
        const newSaved = savedSearches.filter(s => s !== term);
        setSavedSearches(newSaved);
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('kcc_saved_searches', JSON.stringify(newSaved));
        }
    };

    const toggleLocation = () => {
        if (userLocation) {
            setUserLocation(undefined);
            return;
        }

        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setIsLocating(false);
                },
                (error) => {
                    console.error("Geo error:", error);
                    setIsLocating(false);
                    alert("Could not get your location. Please check browser permissions.");
                }
            );
        } else {
            setIsLocating(false);
            alert("Geolocation is not supported by this browser.");
        }
    };

    return {
        query,
        setQuery,
        category,
        setCategory,
        userLocation,
        toggleLocation,
        isLocating,
        results,
        setResults,
        hasSearched,
        setHasSearched,
        isLoading,
        setIsLoading,
        savedSearches,
        handleSaveSearch,
        removeSavedSearch
    };
}
