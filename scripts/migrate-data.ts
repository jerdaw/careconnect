import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { Service } from '../types/service';
import { Database } from '../types/supabase';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local');
    process.exit(1);
}

// Admin client with ability to write to DB
const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    console.log('🚀 Starting migration...');

    // Read JSON
    const dataPath = path.join(__dirname, '../data/services.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const services = JSON.parse(rawData) as Service[];

    console.log(`📦 Found ${services.length} services to migrate.`);

    // Read Embeddings
    const embeddingsPath = path.join(__dirname, '../data/embeddings.json');
    const embeddingsRaw = fs.readFileSync(embeddingsPath, 'utf-8');
    const embeddings = JSON.parse(embeddingsRaw) as Record<string, number[]>;

    console.log(`📦 Found ${Object.keys(embeddings).length} embeddings to merge.`);

    let successCount = 0;
    let errorCount = 0;

    for (const service of services) {
        // Map JSON structure to DB Columns
        const dbRow = {
            id: service.id, // Keeping ID for stability
            name: service.name,
            description: service.description,
            address: service.address,
            phone: service.phone,
            url: service.url,
            email: service.email,
            hours: service.hours,
            fees: service.fees,
            eligibility: service.eligibility,
            application_process: service.application_process,
            languages: service.languages,
            bus_routes: service.bus_routes,
            accessibility: service.accessibility,
            last_verified: service.last_verified,
            verification_status: service.verification_level, // approximate mapping

            // French
            name_fr: service.name_fr,
            description_fr: service.description_fr,
            address_fr: service.address_fr,

            // Search/Tags
            category: service.intent_category,
            tags: service.identity_tags as any, // Cast to Json compatible

            // Embedding
            // Lookup from embeddings file if not present on service object
            embedding: JSON.stringify(service.embedding || embeddings[service.id]) as any
        };

        const { error } = await supabase
            .from('services')
            .upsert(dbRow as any, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Error migrating ${service.name}:`, error.message);
            errorCount++;
        } else {
            // console.log(`✅ Migrated: ${service.name}`);
            successCount++;
        }
    }

    console.log(`\n🎉 Migration Complete!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
}

migrate();
