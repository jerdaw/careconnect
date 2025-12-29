import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define Enums
const VerificationLevel = z.enum(['L0', 'L1', 'L2', 'L3']);
const IntentCategory = z.enum([
    'Food',
    'Crisis',
    'Housing',
    'Health',
    'Legal',
    'Wellness',
    'Financial',
    'Employment',
]);

// Identify Tag Schema
const IdentityTagSchema = z.object({
    tag: z.string(),
    evidence_url: z.string().url({ message: "Identity tag evidence must be a valid URL" }),
});

// Provenance Schema
const ProvenanceSchema = z.object({
    verified_by: z.string(),
    verified_at: z.string().datetime(),
    evidence_url: z.string().url({ message: "Provenance evidence must be a valid URL" }),
    method: z.string(),
});

// Service Schema
const ServiceSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    url: z.string().url(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    verification_level: VerificationLevel,
    intent_category: IntentCategory,
    provenance: ProvenanceSchema,
    identity_tags: z.array(IdentityTagSchema),
    synthetic_queries: z.array(z.string()),
}).refine((data) => {
    // Logic Check: If L2 or higher, must have rigorous valid provenance (already enforced by schema, but extra check if needed)
    if (['L2', 'L3'].includes(data.verification_level)) {
        // Example: Could enforce specific verification methods here
        return true;
    }
    return true;
});

const ServicesArraySchema = z.array(ServiceSchema);

// Main Validation Function
const validateData = () => {
    const dataPath = path.join(__dirname, '../data/services.json');

    try {
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const json = JSON.parse(rawData) as any;

        console.log(`🔍 Validating ${json.length} records in services.json...`);

        const result = ServicesArraySchema.safeParse(json);

        if (!result.success) {
            console.error('❌ Validation Failed!');
            result.error.errors.forEach((err) => {
                console.error(`   - Path: [${err.path.join(' -> ')}] | Message: ${err.message}`);
            });
            process.exit(1);
        } else {
            console.log('✅ Validation Passed! All records meet the Kingston 150 Governance Standards.');
        }

    } catch (error) {
        console.error('❌ Error reading or parsing file:', error);
        process.exit(1);
    }
};

validateData();
