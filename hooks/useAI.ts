"use client";

import { useEffect, useState } from 'react';
import { aiEngine, AIState } from '@/lib/ai/engine';

export function useAI() {
    const [state, setState] = useState<AIState>({
        isLoading: false,
        progress: 0,
        text: 'Waiting...',
        isReady: false,
        error: null
    });

    useEffect(() => {
        const unsubscribe = aiEngine.subscribe(setState);
        return unsubscribe;
    }, []);

    const initAI = () => aiEngine.init();

    const chat = async (
        messages: { role: 'user' | 'assistant' | 'system', content: string }[]
    ) => {
        return aiEngine.chat(messages);
    };

    return {
        ...state,
        initAI,
        chat
    };
}
