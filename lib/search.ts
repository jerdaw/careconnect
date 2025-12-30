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
        const hasCredentials = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

        if (hasCredentials) {
            const { data, error } = await supabase
                .from('services')
                .select('*');

            if (!error && data && data.length > 0) {
                // Parse embedding strings if they come back as strings (pgvector behavior pending client version)
                // mappedData ensures types match Service interface
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedData: Service[] = data.map((row: any) => {
                    // Find static metadata from services.json to overlay (AI metadata)
                    const staticService = fallbackServices.find(s => s.id === row.id);

                    return {
                        ...row,
                        // Parse embedding if it's a string, or keep if array, or undefined
                        embedding: typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding,
                        // Cast jsonb fields
                        identity_tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
                        intent_category: row.category, // Map DB column back to TS property
                        verification_level: row.verification_status,
                        // Overlay rich metadata if missing in DB
                        synthetic_queries: staticService?.synthetic_queries || [],
                        // If tags are missing in DB, use static
                        ...(!row.tags && staticService?.identity_tags ? { identity_tags: staticService.identity_tags } : {})
                    };
                });

                dataCache = { services: mappedData };

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

// --- GEOLOCATION MATH (Haversine) ---

const toRad = (value: number) => (value * Math.PI) / 180;

const calculateDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Radius of Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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

export interface SearchOptions {
    category?: string;
    location?: { lat: number; lng: number };
    vectorOverride?: number[];
}

/**
 * Main Hybrid Search Function (Optimized for Cost)
 * Strategy: "Lazy Semantic"
 * 1. fast Keyword Search first (Free).
 * 2. If good matches found (> threshold), return immediately. Ssaves API cost.
 * 3. Only fetch Vector (Paid) if keywords fail to find relevant results.
 */
export const searchServices = async (query: string, options: SearchOptions = {}): Promise<SearchResult[]> => {
    const services = await loadServices();
    const tokens = tokenize(query);

    // Category Filter (Hard filter)
    const filteredServices = options.category
        ? services.filter(s => s.intent_category === options.category)
        : services;

    // Special Case: Empty Query but Category/Location selected
    if (query.trim().length === 0) {
        if (options.category || options.location) {
            // Return everything matching filter
            let results = filteredServices.map(service => ({
                service,
                score: 1,
                matchReasons: ['Filter Match']
            }));

            // Sort by Distance if available
            if (options.location) {
                results = results.map(r => {
                    if (r.service.coordinates) {
                        const dist = calculateDistanceKm(
                            options.location!.lat, options.location!.lng,
                            r.service.coordinates.lat, r.service.coordinates.lng
                        );
                        return { ...r, distance: dist };
                    }
                    return { ...r, distance: Infinity };
                }).sort((a, b) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const distA = (a as any).distance ?? Infinity;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const distB = (b as any).distance ?? Infinity;
                    return distA - distB;
                });
            }
            return results;
        }
        return [];
    }

    if (tokens.length === 0) return [];

    // 1. First Pass: Keyword Only (Zero Cost)
    const results: SearchResult[] = [];

    for (const service of filteredServices) {
        if (service.verification_level === VerificationLevel.L0) continue;

        const keywordResult = scoreServiceKeyword(service, tokens);
        if (keywordResult.score > 0) {
            results.push({ service, score: keywordResult.score, matchReasons: keywordResult.reasons });
        }
    }

    // Sort by Keyword Score
    results.sort((a, b) => b.score - a.score);

    let queryVector: number[] | null = options.vectorOverride || null;

    // 2. Cost Optimization Check (Only if no override provided)
    if (!options.vectorOverride) {
        // 30 points = Name Match. 50 points = Intent Match.
        const KEYWORD_CONFIDENCE_THRESHOLD = 40;
        const bestScore = results.length > 0 ? results[0]!.score : 0;

        if (bestScore >= KEYWORD_CONFIDENCE_THRESHOLD) {
            // High confidence! Skip expensive vector search.
            // Apply Geo Sort if needed
            if (options.location) {
                // If scores are similar (within 20%), prefer closer result
                // This is a simple re-rank
                return resortByDistance(results, options.location);
            }
            return results;
        }

        // 3. Low Confidence? Pay for Vector Search (Semantic Fallback)
        // Only fetch if keyword search was weak or empty.
        queryVector = await fetchQueryEmbedding(query);
    }

    if (!queryVector) {
        return options.location ? resortByDistance(results, options.location) : results; // Fallback
    }

    // We need to re-score or add semantic matches that weren't found by keywords
    // Re-build results map to handle merging
    const resultsMap = new Map<string, SearchResult>();
    results.forEach(r => resultsMap.set(r.service.id, r));

    for (const service of filteredServices) {
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

    // Convert back to array
    let finalResults = Array.from(resultsMap.values());

    // Sort
    if (options.location) {
        finalResults = resortByDistance(finalResults, options.location);
    } else {
        finalResults.sort((a, b) => b.score - a.score);
    }

    return finalResults;
};

// Helper: Hybrid re-ranking for Geolocation
const resortByDistance = (results: SearchResult[], userLoc: { lat: number, lng: number }) => {
    return results.sort((a, b) => {
        // Calculate distances
        const distA = a.service.coordinates
            ? calculateDistanceKm(userLoc.lat, userLoc.lng, a.service.coordinates.lat, a.service.coordinates.lng)
            : Infinity;
        const distB = b.service.coordinates
            ? calculateDistanceKm(userLoc.lat, userLoc.lng, b.service.coordinates.lat, b.service.coordinates.lng)
            : Infinity;

        // Bucket scores: if relevance is significantly different (> 50 points), respect relevance.
        // Otherwise, prioritize distance.
        if (Math.abs(a.score - b.score) > 50) {
            return b.score - a.score;
        }

        return distA - distB;
    });
}

/**
 * Simple Levenshtein distance for fuzzy matching
 */
const levenshteinDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () =>
        Array.from({ length: b.length + 1 }, (_, i) => i)
    );
    for (let i = 0; i <= a.length; i++) matrix[i]![0] = i;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i]![j] = Math.min(
                matrix[i - 1]![j]! + 1,
                matrix[i]![j - 1]! + 1,
                matrix[i - 1]![j - 1]! + cost
            );
        }
    }
    return matrix[a.length]![b.length]!;
};

const DICTIONARY = [
    'food', 'shelter', 'housing', 'health', 'mental health', 'crisis',
    'financial', 'employment', 'legal', 'youth', 'senior', 'disability',
    'transportation', 'addiction', 'clothing', 'education', 'immigrant',
    'refugee', 'family', 'parenting', 'childcare', 'elderly',
    'harm reduction', 'outreach', 'drop-in'
];

/**
 * Returns a suggested query if the current query seems to have a typo
 */
export const getSuggestion = (query: string): string | null => {
    if (!query || query.length < 3) return null;

    const words = query.toLowerCase().split(/\s+/);
    let changed = false;

    const suggestedWords = words.map(word => {
        // Only try to correct words that are at least 3 chars and not purely numeric
        if (word.length < 3 || /^\d+$/.test(word)) return word;
        if (DICTIONARY.includes(word)) return word;

        let bestMatch = word;
        let minDistance = 2; // Threshold for suggestion (1 char diff for small words)

        for (const term of DICTIONARY) {
            const dist = levenshteinDistance(word, term);
            if (dist < minDistance) {
                minDistance = dist;
                bestMatch = term;
            }
        }

        if (bestMatch !== word) {
            changed = true;
        }
        return bestMatch;
    });

    return changed ? suggestedWords.join(' ') : null;
};
