#!/usr/bin/env npx tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Bulk Import Drafts - Auto-approve all drafts into services.json
 * 
 * This script merges draft files from a directory into services.json,
 * avoiding duplicates by checking existing service IDs.
 * 
 * Usage:
 *   npx tsx scripts/ingest/bulk-import.ts --input=data/drafts/ontario/crisis/
 */
import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';

const SERVICES_PATH = path.join(process.cwd(), 'data/services.json');

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    input: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
});

function main() {
  const inputPath = values.input;
  const dryRun = values['dry-run'];

  if (!inputPath) {
    console.error('Usage: npx tsx scripts/ingest/bulk-import.ts --input=data/drafts/ontario/crisis/');
    process.exit(1);
  }

  // Load existing services
  const services = JSON.parse(fs.readFileSync(SERVICES_PATH, 'utf-8')) as Record<string, unknown>[];
  const existingIds = new Set(services.map((s: Record<string, unknown>) => s.id));

  console.log(`📚 Loaded ${services.length} existing services.`);

  // Find draft files
  const draftsDir = path.resolve(inputPath);
  const draftFiles = fs.readdirSync(draftsDir)
    .filter(f => f.endsWith('.json') && !f.startsWith('.'));

  console.log(`📂 Found ${draftFiles.length} draft files in ${draftsDir}\n`);

  let added = 0;
  let skipped = 0;
  const newServices: any[] = [];

  for (const file of draftFiles) {
    const filePath = path.join(draftsDir, file);
    const draft = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Check for duplicate by ID
    if (draft.id && existingIds.has(draft.id)) {
      console.log(`⏭️  Skipped (duplicate ID): ${draft.name} (${draft.id})`);
      skipped++;
      continue;
    }

    // Check for duplicate by phone number
    const phoneMatch = services.find(s => s.phone === draft.phone);
    if (phoneMatch) {
      console.log(`⏭️  Skipped (same phone): ${draft.name} matches ${phoneMatch.name}`);
      skipped++;
      continue;
    }

    // Clean up draft metadata for production
    const service = { ...draft };
    delete service._meta; // Remove draft metadata
    service.verification_level = 'L1'; // Mark as AI-verified
    service.status = 'Active';

    newServices.push(service);
    console.log(`✅ Added: ${draft.name}`);
    added++;
  }

  if (dryRun) {
    console.log(`\n🔍 DRY RUN: Would add ${added} services, skip ${skipped}.`);
    return;
  }

  // Merge and save
  const merged = [...services, ...newServices];
  fs.writeFileSync(SERVICES_PATH, JSON.stringify(merged, null, 2));

  console.log(`\n✅ Import complete!`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total services: ${merged.length}`);
}

main();
