import { Service, VerificationLevel } from '../types/service';
import servicesData from '../data/services.json';
import embeddingsData from '../data/embeddings.json';

// CAST: Ensure strict typing for the imported JSON data
const services: Service[] = servicesData as unknown as Service[];
const embeddings: Record<string, number[]> = embeddingsData as unknown as Record<string, number[]>;

export interface SearchResult {
    service: Service;
    score: number;
    matchReasons: string[];
}

interface ScoringWeights {
    vector: number;
    syntheticQuery: number;
    name: number;
    identityTag: number;
    description: number;
}

const WEIGHTS: ScoringWeights = {
    vector: 100, // Semantic match is the gold standard
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

// --- VECTOR MATH ---

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i]! * vecB[i]!;
        normA += vecA[i]! * vecA[i]!;
        normB += vecB[i]! * vecB[i]!;
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const fetchQueryEmbedding = async (query: string): Promise<number[] | null> => {
    try {
        const res = await fetch('/api/search/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        if (!res.ok) return null;

        const data = await res.json() as { embedding: number[] };
        return data.embedding;
    } catch (e) {
        console.warn("Vector embedding fetch failed", e);
        return null; // Fallback to keyword only
    }
};

// --- SCORING ---

/**
 * Calculates a match score for a single service against a normalized query tokens.
 */
const scoreServiceKeyword = (service: Service, tokens: string[]): { score: number, reasons: string[] } => {
    let score = 0;
    const matchReasons: string[] = [];

    // 1. Check Synthetic Queries (High Impact)
    for (const query of service.synthetic_queries) {
        const queryText = normalize(query);
        let queryMatches = 0;

        for (const token of tokens) {
            if (queryText.includes(token)) {
                queryMatches++;
            }
        }

        if (queryMatches > 0) {
            const points = WEIGHTS.syntheticQuery * queryMatches;
            score += points;
            matchReasons.push(`Matched intent: "${query}" (+${points})`);
            break;
        }
    }

    // 2. Check Name (Medium Impact)
    const nameText = normalize(service.name);
    for (const token of tokens) {
        if (nameText.includes(token)) {
            score += WEIGHTS.name;
            matchReasons.push(`Matched name: "${service.name}" (+${WEIGHTS.name})`);
        }
    }

    // 3. Check Identity Tags (Boost)
    for (const identity of service.identity_tags) {
        const tagText = normalize(identity.tag);
        for (const token of tokens) {
            if (tagText.includes(token)) {
                score += WEIGHTS.identityTag;
                matchReasons.push(`Matched tag: "${identity.tag}" (+${WEIGHTS.identityTag})`);
            }
        }
    }

    // 4. Check Description (Low Impact / Catch-all)
    const descText = normalize(service.description);
    let descScore = 0;

    for (const token of tokens) {
        if (descText.includes(token)) {
            descScore += WEIGHTS.description;
        }
    }

    if (descScore > 0) {
        score += descScore;
        matchReasons.push(`Matched description (+${descScore})`);
    }

    return { score, reasons: matchReasons };
};

/**
 * Main Hybrid Search Function (Optimized for Cost)
 * Strategy: "Lazy Semantic"
 * 1. fast Keyword Search first (Free).
 * 2. If good matches found (> threshold), return immediately. Ssaves API cost.
 * 3. Only fetch Vector (Paid) if keywords fail to find relevant results.
 */
export const searchServices = async (query: string, vectorOverride?: number[]): Promise<SearchResult[]> => {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];

    // 1. First Pass: Keyword Only (Zero Cost)
    const results: SearchResult[] = [];

    for (const service of services) {
        if (service.verification_level === VerificationLevel.L0) continue;

        const keywordResult = scoreServiceKeyword(service, tokens);
        if (keywordResult.score > 0) {
            results.push({ service, score: keywordResult.score, matchReasons: keywordResult.reasons });
        }
    }

    // Sort by Keyword Score
    results.sort((a, b) => b.score - a.score);

    let queryVector: number[] | null = vectorOverride || null;

    // 2. Cost Optimization Check (Only if no override provided)
    if (!vectorOverride) {
        // 30 points = Name Match. 50 points = Intent Match.
        const KEYWORD_CONFIDENCE_THRESHOLD = 40;
        const bestScore = results.length > 0 ? results[0]!.score : 0;

        if (bestScore >= KEYWORD_CONFIDENCE_THRESHOLD) {
            // High confidence! Skip expensive vector search.
            return results;
        }

        // 3. Low Confidence? Pay for Vector Search (Semantic Fallback)
        // Only fetch if keyword search was weak or empty.
        queryVector = await fetchQueryEmbedding(query);
    }

    if (!queryVector) {
        return results; // Fallback if API fails/no key
    }

    // We need to re-score or add semantic matches that weren't found by keywords
    // Re-build results map to handle merging
    const resultsMap = new Map<string, SearchResult>();
    results.forEach(r => resultsMap.set(r.service.id, r));

    for (const service of services) {
        if (service.verification_level === VerificationLevel.L0) continue;
        if (!embeddings[service.id]) continue;

        const similarity = cosineSimilarity(queryVector, embeddings[service.id]!);

        // Semantic Threshold
        if (similarity > 0.01) {
            const vectorPoints = similarity * WEIGHTS.vector;

            if (vectorPoints > 0) {
                const existing = resultsMap.get(service.id);

                if (existing) {
                    // Boost existing result
                    existing.score += vectorPoints;
                    if (vectorPoints > 30) {
                        existing.matchReasons.push(`Semantic Boost (${Math.round(similarity * 100)}%)`);
                    }
                } else {
                    // New Semantic-only result
                    // Only add if it's a decent match to avoid noise
                    if (vectorPoints > 35) {
                        resultsMap.set(service.id, {
                            service,
                            score: vectorPoints,
                            matchReasons: [`Semantic Rescue (${Math.round(similarity * 100)}%)`]
                        });
                    }
                }
            }
        }
    }

    // Convert back to array and re-sort
    return Array.from(resultsMap.values()).sort((a, b) => b.score - a.score);
};
