import type { UserContext, EligibilityCriteria, EligibilityStatus } from '@/types/user-context';
import type { Service } from '@/types/service';

const AGE_MAP: Record<string, { min: number; max: number }> = {
    youth: { min: 0, max: 29 },
    adult: { min: 18, max: 64 },
    senior: { min: 55, max: 120 },
};

export function parseEligibility(notes: string): EligibilityCriteria {
    const criteria: EligibilityCriteria = {};
    // Pattern: "Ages 18-29" or "Must be Indigenous"
    const ageMatch = notes.match(/Ages?\s*(\d+)(?:\s*[-–]\s*(\d+))?/i);
    if (ageMatch && ageMatch[1]) {
        criteria.minAge = parseInt(ageMatch[1], 10);
        if (ageMatch[2]) {
            criteria.maxAge = parseInt(ageMatch[2], 10);
        }
    } else {
        // Fallback: Keyword matching for common age groups
        if (/youth|jeune/i.test(notes)) {
            criteria.maxAge = 29;
        }
        if (/senior|aîné|elder/i.test(notes)) {
            criteria.minAge = 55;
        }
    }

    // Identity keywords
    if (/indigenous|first nations|metis|inuit/i.test(notes)) criteria.requiredIdentities = ['indigenous'];
    if (/newcomer|immigrant|refugee/i.test(notes)) criteria.requiredIdentities = ['newcomer'];
    if (/2slgbtqi\+|lgbtq|trans|queer/i.test(notes)) criteria.requiredIdentities = ['2slgbtqi+'];
    if (/veteran|military/i.test(notes)) criteria.requiredIdentities = ['veteran'];
    if (/disability|disabled/i.test(notes)) criteria.requiredIdentities = ['disability'];

    return criteria;
}

export function checkEligibility(
    service: Service,
    context: UserContext
): EligibilityStatus {
    // If user hasn't opted in, or service is L1 verified but has no notes, we can't judge.
    // HOWEVER, the goal is to show "You likely qualify".
    if (!context.hasOptedIn || !service.eligibility_notes) return 'unknown';

    const criteria = parseEligibility(service.eligibility_notes);
    const userAge = context.ageGroup ? AGE_MAP[context.ageGroup] : null;

    // Age check
    if (criteria.minAge && userAge && userAge.max < criteria.minAge) return 'ineligible';
    if (criteria.maxAge && userAge && userAge.min > criteria.maxAge) return 'ineligible';

    // Identity check
    if (criteria.requiredIdentities?.length) {
        const hasRequired = criteria.requiredIdentities.some((tag) =>
            context.identities.includes(tag)
        );
        if (!hasRequired) return 'ineligible';
    }

    return 'eligible';
}
