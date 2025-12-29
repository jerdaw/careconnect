/**
 * Search Quality Assurance Test Script
 * 
 * Run: npx tsx scripts/search-qa.ts
 * 
 * This script tests the search algorithm against a curated set of 
 * user scenarios to ensure the tuning is correct.
 */

import { searchServices } from '../lib/search';

interface TestScenario {
    query: string;
    expectedServiceNames: string[]; // At least one of these should appear in top 3
    description: string;
}

const SCENARIOS: TestScenario[] = [
    // === CRISIS / MENTAL HEALTH ===
    {
        query: "I'm sad",
        expectedServiceNames: ["AMHS-KFLA 24/7 Crisis Line", "Good2Talk", "Telephone Aid Line Kingston (TALK)", "AMS Peer Support Centre (PSC)"],
        description: "Emotional distress, should surface crisis/support services"
    },
    {
        query: "I want to talk to someone",
        expectedServiceNames: ["Good2Talk", "Telephone Aid Line Kingston (TALK)", "AMS Peer Support Centre (PSC)"],
        description: "Need for human connection, should find peer support"
    },
    {
        query: "I feel empty",
        expectedServiceNames: ["AMHS-KFLA 24/7 Crisis Line", "Good2Talk", "AMS Peer Support Centre (PSC)"],
        description: "Depressive language, semantic match required"
    },
    {
        query: "suicidal thoughts",
        expectedServiceNames: ["AMHS-KFLA 24/7 Crisis Line", "Kids Help Phone", "Good2Talk"],
        description: "High-urgency crisis query"
    },

    // === FOOD ===
    {
        query: "I'm hungry",
        expectedServiceNames: ["AMS Food Bank", "Martha's Table", "Partners in Mission Food Bank"],
        description: "Basic food need"
    },
    {
        query: "free food",
        expectedServiceNames: ["Martha's Table", "Lunch by George", "AMS Food Bank"],
        description: "Direct food request"
    },
    {
        query: "groceries help",
        expectedServiceNames: ["Partners in Mission Food Bank", "The Good Food Box", "St. Vincent de Paul Society (WearHouse & Pantry)"],
        description: "Food assistance"
    },

    // === HOUSING ===
    {
        query: "I'm homeless",
        expectedServiceNames: ["Kingston Youth Shelter", "Ryandale Shelter", "Home Base Housing"],
        description: "Emergency shelter need"
    },
    {
        query: "where can I sleep tonight",
        expectedServiceNames: ["Kingston Youth Shelter", "Ryandale Shelter", "Dawn House"],
        description: "Immediate housing need"
    },
    {
        query: "need a place to stay",
        expectedServiceNames: ["Kingston Home Base Housing", "Kingston Youth Shelter", "Elizabeth Fry Society (Housing Support)"],
        description: "Transitional housing"
    },

    // === HEALTH ===
    {
        query: "I need a doctor",
        expectedServiceNames: ["CDK Family Medicine Walk-In Clinic", "Street Health Centre", "Kingston Community Health Centres (KCHC) - Weller Clinic"],
        description: "Primary care access"
    },
    {
        query: "STI testing",
        expectedServiceNames: ["KFL&A Public Health: Sexual Health Clinic", "Street Health Centre"],
        description: "Sexual health services"
    },
    {
        query: "free dental",
        expectedServiceNames: ["KFL&A Public Health Dental Services"],
        description: "Dental care for low-income"
    },

    // === IDENTITY / EQUITY ===
    {
        query: "trans healthcare",
        expectedServiceNames: ["KCHC Transgender Health Care", "Trellis HIV & Community Care"],
        description: "Gender-affirming care"
    },
    {
        query: "Indigenous student support",
        expectedServiceNames: ["Four Directions Indigenous Student Centre", "Hope for Wellness Helpline"],
        description: "Indigenous-specific services"
    },
    {
        query: "sexual assault help",
        expectedServiceNames: ["Sexual Assault Centre Kingston (SACK)", "Sexual Violence Prevention & Response Coordinator (SVPRC)"],
        description: "Trauma support"
    },

    // === FINANCIAL / LEGAL ===
    {
        query: "I need money for rent",
        expectedServiceNames: ["Ontario Works Kingston", "Queen's Financial Aid & Awards (OSAP)"],
        description: "Financial assistance"
    },
    {
        query: "legal help with landlord",
        expectedServiceNames: ["Queen's Legal Aid", "Kingston Community Legal Clinic"],
        description: "Tenant rights support"
    }
];

async function runTests() {
    console.log("🧪 Search Quality Assurance Test Suite\n");
    console.log("=".repeat(60));

    let passed = 0;
    let failed = 0;

    for (const scenario of SCENARIOS) {
        const results = await searchServices(scenario.query);
        const topNames = results.slice(0, 5).map(r => r.service.name);

        // Check if ANY expected service is in top 5
        const hit = scenario.expectedServiceNames.some(name => topNames.includes(name));

        if (hit) {
            passed++;
            console.log(`✅ PASS: "${scenario.query}"`);
            console.log(`   Top Match: ${topNames[0] || 'N/A'}`);
        } else {
            failed++;
            console.log(`❌ FAIL: "${scenario.query}"`);
            console.log(`   Expected one of: ${scenario.expectedServiceNames.slice(0, 2).join(', ')}`);
            console.log(`   Got: ${topNames.slice(0, 3).join(', ') || 'No results'}`);
        }
        console.log(`   [${scenario.description}]\n`);
    }

    console.log("=".repeat(60));
    console.log(`\n📊 Results: ${passed}/${SCENARIOS.length} passed (${Math.round(passed / SCENARIOS.length * 100)}%)`);

    if (failed > 0) {
        console.log(`\n⚠️  ${failed} scenarios need attention.`);
        process.exit(1);
    } else {
        console.log(`\n🎉 All scenarios passed!`);
    }
}

runTests();
