import { Service, VerificationLevel } from "@/types/service"

const API_BASE = "https://api.211ontario.ca/v1" // Placeholder URL

interface Raw211Service {
    id: string
    name: string
    description: string
    address: { street: string; city: string; postal: string }
    phone: string
    url: string
    taxonomy: { code: string; name: string }[]
}

// Mock data for when API key is missing
const MOCK_DATA: Raw211Service[] = [
    {
        id: "mock-1",
        name: "Kingston Youth Shelter (Mock)",
        description: "Emergency shelter for youth ages 16-24.",
        address: { street: "234 Brock St", city: "Kingston", postal: "K7K 1A1" },
        phone: "613-555-0199",
        url: "https://youthshelter.mock",
        taxonomy: [{ code: "BH-1800", name: "Homeless Shelter" }]
    },
    {
        id: "mock-2",
        name: "Senior Food Delivery (Mock)",
        description: "Meals on wheels for seniors 65+.",
        address: { street: "100 Princess St", city: "Kingston", postal: "K7L 1A1" },
        phone: "613-555-0200",
        url: "https://seniormeals.mock",
        taxonomy: [{ code: "BD-1800", name: "Food Delivery" }]
    }
];

export async function fetch211Services(region: string = "Kingston"): Promise<Service[]> {
    // If no API key, return mock data to prevent errors during development/testing
    if (!process.env.API_211_KEY) {
        console.warn("⚠️ No API_211_KEY found. using mock data.");
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_DATA.map(mapToService);
    }

    try {
        const res = await fetch(`${API_BASE}/services?region=${region}`, {
            headers: { Authorization: `Bearer ${process.env.API_211_KEY}` },
            next: { revalidate: 86400 }, // 24h cache
        })

        if (!res.ok) throw new Error(`211 API error: ${res.status}`)

        const raw = (await res.json()) as Raw211Service[]
        return raw.map(mapToService)
    } catch (error) {
        console.error("Failed to fetch from 211:", error);
        return [];
    }
}

function mapToService(raw: Raw211Service): Service {
    return {
        id: `211-${raw.id}`,
        name: raw.name,
        description: raw.description,
        phone: raw.phone,
        url: raw.url,
        address: `${raw.address.street}, ${raw.address.city} ${raw.address.postal}`,
        verification_level: VerificationLevel.L2,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        intent_category: mapTaxonomyToCategory(raw.taxonomy) as any,
        provenance: {
            verified_by: "211 Ontario API",
            verified_at: new Date().toISOString(),
            evidence_url: "https://211ontario.ca",
            method: "Automated Sync",
        },
        synthetic_queries: [],
        identity_tags: [],
        last_verified: new Date().toISOString()
    }
}

function mapTaxonomyToCategory(taxonomy: { code: string; name: string }[]): string {
    if (!taxonomy || taxonomy.length === 0) return "Other";

    const categoryMap: Record<string, string> = {
        BD: "Food",
        BH: "Housing",
        RP: "Crisis",
    }

    const firstCode = taxonomy[0]?.code;
    const code = firstCode ? firstCode.substring(0, 2) : "";
    return categoryMap[code] || "Other"
}
