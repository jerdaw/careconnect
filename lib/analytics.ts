import { IntentCategory, Service } from '../types/service';

/**
 * Privacy-First Analytics Module ("The Quiet Logger")
 * 
 * POLICY:
 * 1. SENSITIVE INTENTS (Crisis, Legal, Health-Sensitive) are NEVER logged with raw query or specific intent.
 *    We only log a generic "Safety Intercept" event to track volume of high-risk needs.
 * 2. SAFE INTENTS (Food, Housing, etc.) are logged with Category and Result Count.
 *    We do NOT log the raw user query text to persistent storage, only the inferred category.
 */

type LogEvent =
    | { event: 'safety_intercept'; timestamp: number }
    | { event: 'search_intent'; category: string; result_count: number; timestamp: number }
    | { event: 'search_general'; result_count: number; timestamp: number };

// In a real app, this would be PostHog or Plausible.
// For the Pilot, we simulate a secure console logger.
const logToSecureConsole = (event: LogEvent) => {
    // In production, we would filter out console logs.
    // Here we print to demonstrate the logic is working.
    console.groupCollapsed(`[Analytics] Event: ${event.event}`);
    console.log(event);
    console.groupEnd();
};

export const logSearchEvent = (query: string, results: Service[]) => {
    if (!results || results.length === 0) {
        logToSecureConsole({
            event: 'search_general',
            result_count: 0,
            timestamp: Date.now()
        });
        return;
    }

    const topResult = results[0];
    if (!topResult) return;

    const category = topResult.intent_category;

    // SENSITIVE CATEGORIES BLOCKLIST
    // If the top result is in these categories, we DROP the intent info.
    const SENSITIVE_CATEGORIES = [
        IntentCategory.Crisis,
        IntentCategory.Legal, // Often sensitive (eviction, criminal)
        IntentCategory.Health, // Can be sensitive (sexual health, addiction)
        IntentCategory.Wellness // Can be sensitive (mental health)
    ];

    if (SENSITIVE_CATEGORIES.includes(category)) {
        // Redact everything. Just log that a safety/sensitive search occurred.
        logToSecureConsole({
            event: 'safety_intercept',
            timestamp: Date.now()
        });
    } else {
        // Safe to log the Category (e.g. "Food") and count.
        // Still NOT logging the raw query string.
        logToSecureConsole({
            event: 'search_intent',
            category: category,
            result_count: results.length,
            timestamp: Date.now()
        });
    }
};
