'use client';

import { useState, useCallback } from 'react';

export interface GeolocationState {
    coordinates: { lat: number; lng: number } | null;
    isLocating: boolean;
    error: string | null;
}

export interface UseGeolocationReturn extends GeolocationState {
    requestLocation: () => void;
    clearLocation: () => void;
}

/**
 * A hook for accessing the browser's Geolocation API with loading and error states.
 * @param options Optional PositionOptions for geolocation
 * @returns Geolocation state and control functions
 */
export function useGeolocation(
    options?: PositionOptions
): UseGeolocationReturn {
    const [state, setState] = useState<GeolocationState>({
        coordinates: null,
        isLocating: false,
        error: null,
    });

    const requestLocation = useCallback(() => {
        // Check if geolocation is supported
        if (typeof window === 'undefined' || !navigator.geolocation) {
            setState(prev => ({
                ...prev,
                error: 'Geolocation is not supported by this browser.',
                isLocating: false,
            }));
            return;
        }

        setState(prev => ({ ...prev, isLocating: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    coordinates: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    },
                    isLocating: false,
                    error: null,
                });
            },
            (error) => {
                let errorMessage = 'Failed to get location.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please check browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }
                setState({
                    coordinates: null,
                    isLocating: false,
                    error: errorMessage,
                });
            },
            options || { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
    }, [options]);

    const clearLocation = useCallback(() => {
        setState({
            coordinates: null,
            isLocating: false,
            error: null,
        });
    }, []);

    return {
        ...state,
        requestLocation,
        clearLocation,
    };
}
