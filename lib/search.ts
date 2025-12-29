import { Service, VerificationLevel } from '../types/service';
import servicesData from '../data/services.json';

// CAST: Ensure strict typing for the imported JSON data
const services: Service[] = servicesData as unknown as Service[];

export interface SearchResult {
    service: Service;
    score: number;
    matchReasons: string[];
}

interface ScoringWeights {
    syntheticQuery: number;
    name: number;
    identityTag: number;
    description: number;
}

const WEIGHTS: ScoringWeights = {
    syntheticQuery: 50,
    name: 30,
    identityTag: 20,
    description: 10,
};

/**
 * Normalizes text for comparison: lowercases and removes punctuation.
 */
const normalize = (text: string): string => {
    return text.toLowerCase().replace(/[^\w\s]/g, '');
};

/**
 * Tokenizes a query string into an array of words, removing common stop words.
 */
const tokenize = (query: string): string[] => {
    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'is', 'are', 'i', 'need', 'help', 'want', 'where', 'can', 'get']);
    return normalize(query)
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stopWords.has(word)); // Filter short words and stop words
};

/**
 * Calculates a match score for a single service against a normalized query tokens.
 */
const scoreService = (service: Service, tokens: string[]): SearchResult | null => {
    let score = 0;
    const matchReasons: string[] = [];
    const matchedTokens = new Set<string>();

    // 1. Check Synthetic Queries (High Impact)
    // We check if ANY synthetic query contains ANY of the search tokens.
    // Ideally, we'd want phrase matching, but token matching is a good v1.
    for (const query of service.synthetic_queries) {
        const queryText = normalize(query);
        let queryMatches = 0;

        for (const token of tokens) {
            if (queryText.includes(token)) {
                queryMatches++;
                matchedTokens.add(token);
            }
        }

        if (queryMatches > 0) {
            // Bonus: If multiple tokens match the same synthetic query, it's a stronger signal.
            const points = WEIGHTS.syntheticQuery * queryMatches;
            score += points;
            matchReasons.push(`Matched intent: "${query}" (+${points})`);
            break; // Optimization: Only score the best matching synthetic query to avoid double counting too much? 
            // actually, let's break to treat "synthetic_queries" as a single "field" hit.
        }
    }

    // 2. Check Name (Medium Impact)
    const nameText = normalize(service.name);
    for (const token of tokens) {
        if (nameText.includes(token)) {
            score += WEIGHTS.name;
            matchReasons.push(`Matched name: "${service.name}" (+${WEIGHTS.name})`);
            matchedTokens.add(token);
        }
    }

    // 3. Check Identity Tags (Boost)
    for (const identity of service.identity_tags) {
        const tagText = normalize(identity.tag);
        for (const token of tokens) {
            if (tagText.includes(token)) {
                score += WEIGHTS.identityTag;
                matchReasons.push(`Matched tag: "${identity.tag}" (+${WEIGHTS.identityTag})`);
                matchedTokens.add(token);
            }
        }
    }

    // 4. Check Description (Low Impact / Catch-all)
    const descText = normalize(service.description);
    let descScore = 0;

    for (const token of tokens) {
        if (descText.includes(token)) {
            descScore += WEIGHTS.description;
            matchedTokens.add(token);
        }
    }

    if (descScore > 0) {
        score += descScore;
        matchReasons.push(`Matched description (+${descScore})`);
    }

    // Filter: Must match distinct tokens to be relevant? 
    // For now, if score > 0, it's a candidate.

    if (score > 0) {
        return { service, score, matchReasons };
    }
    return null;
};

/**
 * Main Search Function
 */
export const searchServices = (query: string): SearchResult[] => {
    const tokens = tokenize(query);

    if (tokens.length === 0) return [];

    const results: SearchResult[] = [];

    for (const service of services) {
        // Hard Filter: Only show L1 or higher
        if (service.verification_level === VerificationLevel.L0) continue;

        const result = scoreService(service, tokens);
        if (result) {
            results.push(result);
        }
    }

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
};
