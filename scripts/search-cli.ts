import { searchServices } from '../lib/search';

const query = process.argv.slice(2).join(' ');

if (!query) {
    console.log('Usage: npm run search "<your query>"');
    process.exit(1);
}

console.log(`\n🔍 Searching for: "${query}"\n`);
const startTime = performance.now();
const results = searchServices(query);
const endTime = performance.now();

if (results.length === 0) {
    console.log('No results found.');
} else {
    console.log(`Found ${results.length} results in ${(endTime - startTime).toFixed(2)}ms:\n`);

    // Show Top 5
    results.slice(0, 5).forEach((result, index) => {
        console.log(`${index + 1}. [Score: ${result.score}] ${result.service.name}`);
        console.log(`   Category: ${result.service.intent_category} | Level: ${result.service.verification_level}`);
        console.log(`   Reasons: ${result.matchReasons.join(', ')}`);
        console.log(`   Description: ${result.service.description.substring(0, 100)}...`);
        console.log('');
    });
}
