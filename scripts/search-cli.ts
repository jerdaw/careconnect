
import { searchServices } from '../lib/search';

const query = process.argv[2];

if (!query) {
    console.error('Please provide a search query.');
    process.exit(1);
}

(async () => {
    console.log(`\n🔍 Searching for: "${query}"\n`);
    const startTime = performance.now();

    // Now we can await properly inside this async block
    const results = await searchServices(query);

    const endTime = performance.now();

    if (results.length === 0) {
        console.log('No results found.');
    } else {
        console.log(`Found ${results.length} results in ${(endTime - startTime).toFixed(2)}ms:\n`);
        results.slice(0, 5).forEach((r, i) => {
            console.log(`${i + 1}. [${r.score.toFixed(1)}] ${r.service.name}`);
            console.log(`   Reasons: ${r.matchReasons.join(' | ')}\n`);
        });
    }
})();
