import { Service, VerificationLevel } from '../types/service';
import servicesData from '../data/services.json';
import embeddingsData from '../data/embeddings.json';
import { supabase } from './supabase';

// Helper to ensure strict typing for the fallback JSON data
const fallbackServices: Service[] = servicesData as unknown as Service[];
const fallbackEmbeddings: Record<string, number[]> = embeddingsData as unknown as Record<string, number[]>;

// In-memory cache for the server instance
let dataCache: { services: Service[] } | null = null;

/**
 * Loads services from Supabase (if configured) or falls back to local JSON.
 * Implements Stale-While-Revalidate or simple caching strategy.
 */
const loadServices = async (): Promise<Service[]> => {
    // Return cache if available
    if (dataCache) return dataCache.services;

    try {
        // Check if we have credentials to attempt DB fetch
        const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (hasCredentials) {
            const { data, error } = await supabase
                .from('services')
                .select('*');

            if (!error && data && data.length > 0) {
                // Parse embedding strings if they come back as strings (pgvector behavior pending client version)
                // mappedData ensures types match Service interface
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedData: Service[] = data.map((row: any) => ({
                    ...row,
                    // Parse embedding if it's a string, or keep if array, or undefined
                    embedding: typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding,
                    // Cast jsonb fields
                    identity_tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
                    intent_category: row.category, // Map DB column back to TS property
                    verification_level: row.verification_status,
                }));

                dataCache = { services: mappedData };
                // console.log(`Distribution: Fetched ${mappedData.length} records from Supabase.`);
                return mappedData;
            } else if (error) {
                console.warn("Supabase fetch error (falling back to JSON):", error.message);
            }
        }
    } catch (err) {
        console.warn("Data load failed (falling back to JSON):", err);
    }

    // Fallback to local JSON
    dataCache = { services: fallbackServices };
    return fallbackServices;
};

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
 * Tokenizes a query string into an array of words, removing common stop words (English & French).
 */
const tokenize = (query: string): string[] => {
    const stopWords = new Set([
        // English
        'a', 'an', 'the', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'is', 'are', 'i', 'need', 'help', 'want', 'where', 'can', 'get',
        // French
        'le', 'la', 'les', 'un', 'une', 'de', 'des', 'en', 'et', 'est', 'a', 'il', 'elle', 'je', 'tu', 'nous', 'vous', 'ils', 'pour', 'sur', 'dans', 'avec', 'qui', 'que', 'si', 'ou'
    ]);
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

    // 1. Check Synthetic Queries (High Impact) - Currently English Only
    if (service.synthetic_queries) {
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
    }

    // 2. Check Name (Medium Impact) - English & French
    const nameText = normalize(service.name);
    const nameFrText = service.name_fr ? normalize(service.name_fr) : '';

    for (const token of tokens) {
        if (nameText.includes(token)) {
            score += WEIGHTS.name;
            matchReasons.push(`Matched name: "${service.name}" (+${WEIGHTS.name})`);
        } else if (nameFrText && nameFrText.includes(token)) {
            score += WEIGHTS.name;
            matchReasons.push(`Matched name (FR): "${service.name_fr}" (+${WEIGHTS.name})`);
        }
    }

    // 3. Check Identity Tags (Boost)
    if (service.identity_tags) {
        for (const identity of service.identity_tags) {
            const tagText = normalize(identity.tag);
            for (const token of tokens) {
                if (tagText.includes(token)) {
                    score += WEIGHTS.identityTag;
                    matchReasons.push(`Matched tag: "${identity.tag}" (+${WEIGHTS.identityTag})`);
                }
            }
        }
    }

    // 4. Check Description (Low Impact / Catch-all) - English & French
    const descText = normalize(service.description);
    const descFrText = service.description_fr ? normalize(service.description_fr) : '';
    let descScore = 0;

    for (const token of tokens) {
        if (descText.includes(token)) {
            descScore += WEIGHTS.description;
        } else if (descFrText && descFrText.includes(token)) {
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
    const services = await loadServices();
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

        // Use embedding from DB (on service object) OR fallback to local JSON
        const serviceVector = service.embedding || fallbackEmbeddings[service.id];
        if (!serviceVector) continue;

        const similarity = cosineSimilarity(queryVector, serviceVector);

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
                    if (vectorPoints > 25) {
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
