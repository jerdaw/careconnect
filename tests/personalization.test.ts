import { checkEligibility, parseEligibility } from '../lib/eligibility/checker';
import { UserContext } from '../types/user-context';
import { Service, VerificationLevel, IntentCategory } from '../types/service';
import { scoreServiceKeyword } from '../lib/search/scoring';

const mockService: Service = {
    id: '1',
    name: 'Test Service',
    description: 'Test Description',
    intent_category: IntentCategory.Health,
    verification_level: VerificationLevel.L1,
    eligibility_notes: 'Ages 18-29',
    identity_tags: [],
    url: 'https://example.com',
    provenance: {
        verified_by: 'manual',
        verified_at: '2025-01-01',
        evidence_url: 'https://example.com',
        method: 'manual'
    },
    synthetic_queries: []
};

const mockUser: UserContext = {
    ageGroup: null,
    identities: [],
    hasOptedIn: true
};

describe('Eligibility Checker', () => {
    test('parses explicit age ranges', () => {
        const criteria = parseEligibility('Ages 18-29');
        expect(criteria.minAge).toBe(18);
        expect(criteria.maxAge).toBe(29);
    });

    test('parses keyword age ranges', () => {
        const criteria = parseEligibility('For Youth programs');
        expect(criteria.maxAge).toBe(29);

        const seniorCriteria = parseEligibility('Seniors only');
        expect(seniorCriteria.minAge).toBe(55);
    });

    test('determines eligibility correctly', () => {
        // Service: 18-29
        // User: Youth (0-29) -> Eligible (Optimistic overlap)
        expect(checkEligibility(mockService, { ...mockUser, ageGroup: 'youth' })).toBe('eligible');

        // User: Senior (55+) -> Ineligible (No overlap)
        expect(checkEligibility(mockService, { ...mockUser, ageGroup: 'senior' })).toBe('ineligible');

        // Service: Senior (55+)
        const seniorService = { ...mockService, eligibility_notes: 'Seniors 55+' };
        expect(checkEligibility(seniorService, { ...mockUser, ageGroup: 'senior' })).toBe('eligible');
        expect(checkEligibility(seniorService, { ...mockUser, ageGroup: 'youth' })).toBe('ineligible');
    });

    test('handles identity requirements', () => {
        const indigenousService = { ...mockService, eligibility_notes: 'Must be Indigenous' };

        expect(checkEligibility(indigenousService, { ...mockUser, identities: [] })).toBe('ineligible');
        expect(checkEligibility(indigenousService, { ...mockUser, identities: ['indigenous'] })).toBe('eligible');
    });
});

describe('Identity-Aware Ranking', () => {
    test('boosts score for matching identity tags', () => {
        const serviceWithTag: Service = {
            ...mockService,
            // Ensure we have a matchable string for base score
            name: 'Indigenous Support Service',
            identity_tags: [{ tag: 'Indigenous', evidence_url: 'http://example.com' }]
        };

        const tokens = ['indigenous'];

        // Base score (no user context)
        const baseResult = scoreServiceKeyword(serviceWithTag, tokens, undefined, {});

        // Boosted score (with matching identity)
        const boostedResult = scoreServiceKeyword(serviceWithTag, tokens, undefined, {
            userContext: { ...mockUser, identities: ['indigenous'] }
        });

        expect(baseResult.score).toBeGreaterThan(0);
        expect(boostedResult.score).toBeGreaterThan(baseResult.score);
        expect(boostedResult.reasons.some(r => r.includes('Identity Boost'))).toBe(true);
    });
});
