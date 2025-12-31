import { ScoringWeights } from './types';
import { Service } from '@/types/service';
import { normalize } from './utils';

export const WEIGHTS: ScoringWeights = {
    vector: 100, // Semantic match is the gold standard
    syntheticQuery: 50,
    name: 30,
    identityTag: 20,
    description: 10,
};

export interface ScoringOptions {
    weights?: {
        textMatch?: number;
        categoryMatch?: number;
        distance?: number;
        openNow?: number;
        emergency?: number;
    };
    userContext?: import('@/types/user-context').UserContext;
}

export function calculateScore(
    service: Service,
    query: string,
    categoryFilter?: string,
    options: ScoringOptions = {}
): number {
    // const {
    //     textMatch = 0.4,
    //     categoryMatch = 0.3,
    //     distance = 0.3,
    //     openNow = 0.1, // Bonus for being open
    //     emergency = 0.5 // Huge bonus for emergency services
    // } = options.weights || {};

    let score = 0;

    // This function is new and its full implementation is not provided in the prompt.
    // The prompt only provides the signature and initial weight destructuring.
    // The existing logic from scoreServiceKeyword is not meant to be moved here.
    // For now, returning a placeholder score.
    // A full implementation would involve combining various scoring factors.

    // Example of how userContext might be used for identity boosting (conceptual):


    // 6. Identity Match Boost (Personalization)
    if (options.userContext?.identities.length && service.identity_tags) {
        const matchingTags = service.identity_tags.filter((tag) =>
            options.userContext!.identities.includes(tag.tag.toLowerCase() as any)
        );
        if (matchingTags.length > 0) {
            // 10% boost per matching tag, capped at 30%
            const boostMultiplier = 1 + Math.min(0.3, matchingTags.length * 0.1);
            score *= boostMultiplier;
        }
    }

    return score;
}

/**
 * Calculates a match score for a single service against a normalized query tokens.
 */
export const scoreServiceKeyword = (
    service: Service,
    tokens: string[],
    categoryFilter?: string,
    options: ScoringOptions = {}
): { score: number, reasons: string[] } => {
    let score = 0;
    const matchReasons: string[] = [];

    // 1a. Check Synthetic Queries (English) - High Impact
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

    // 1b. Check Synthetic Queries (French) - High Impact
    if (service.synthetic_queries_fr) {
        for (const query of service.synthetic_queries_fr) {
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
                matchReasons.push(`Matched intent (FR): "${query}" (+${points})`);
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

    // 5. Identity Match Boost (Personalization)
    if (options.userContext?.identities.length && service.identity_tags) {
        const matchingTags = service.identity_tags.filter((tag) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options.userContext!.identities.includes(tag.tag.toLowerCase() as any)
        );
        if (matchingTags.length > 0) {
            // 10% boost per matching tag, capped at 30%
            const boostMultiplier = 1 + Math.min(0.3, matchingTags.length * 0.1);
            score *= boostMultiplier;
            matchReasons.push(`Identity Boost (+${Math.round((boostMultiplier - 1) * 100)}%)`);
        }
    }

    return { score, reasons: matchReasons };
};
