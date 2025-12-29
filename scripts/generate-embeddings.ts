
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from '@xenova/transformers';
import { Service } from '../types/service';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateEmbeddings() {
    const dataPath = path.join(__dirname, '../data/services.json');
    const outPath = path.join(__dirname, '../data/embeddings.json');

    try {
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const services = JSON.parse(rawData) as Service[];

        console.log(`🧠 Loading 'all-MiniLM-L6-v2' model...`);
        // Use the feature-extraction pipeline
        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

        console.log(`🚀 Generating embeddings for ${services.length} services locally...`);

        const embeddings: Record<string, number[]> = {};

        for (const service of services) {
            const semanticText = `
            Service: ${service.name}
            Category: ${service.intent_category}
            Description: ${service.description}
            Tags: ${service.identity_tags.map(t => t.tag).join(', ')}
            Queries: ${service.synthetic_queries.join(', ')}
            Notes: ${service.eligibility_notes || ''}
            `.trim().replace(/\s+/g, ' ');

            console.log(`   - Embedding: ${service.name}...`);

            // Generate embedding
            const output = await extractor(semanticText, { pooling: 'mean', normalize: true });

            // Extract the data from the Tensor
            // @ts-ignore - The types for Tensor are a bit tricky, but this works
            const embedding = Array.from(output.data);

            embeddings[service.id] = embedding;
        }

        fs.writeFileSync(outPath, JSON.stringify(embeddings, null, 2));
        console.log(`✅ Success! Local embeddings saved to ${outPath}`);

    } catch (error) {
        console.error("❌ Error generating embeddings:", error);
        process.exit(1);
    }
}

generateEmbeddings();
