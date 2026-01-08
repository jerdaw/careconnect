#!/usr/bin/env npx tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Import Response - Parse AI output and save as draft files
 * 
 * After getting a response from Gemini/ChatGPT web interface,
 * paste the JSON array and this script will save each service as a draft.
 * 
 * Usage:
 *   npx tsx scripts/ingest/import-response.ts --vertical=crisis
 */
import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import * as readline from 'readline';

const DRAFT_BASE_PATH = path.join(process.cwd(), 'data/drafts/ontario');

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    vertical: { type: 'string' },
    file: { type: 'string' }, // Optional: read from file instead of stdin
  },
});

async function main() {
  const vertical = values.vertical;
  
  if (!vertical) {
    console.error('Usage: npx tsx scripts/ingest/import-response.ts --vertical=crisis');
    process.exit(1);
  }

  const outputDir = path.join(DRAFT_BASE_PATH, vertical.toLowerCase());
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let input: string;

  if (values.file) {
    // Read from file
    input = fs.readFileSync(values.file, 'utf-8');
  } else {
    // Read from stdin (multiline paste)
    console.log('📋 Paste the JSON response from Gemini/ChatGPT below.');
    console.log('   (Press Ctrl+D when done on Mac/Linux, Ctrl+Z on Windows)\n');
    input = await readStdin();
  }

  // Parse JSON - handle markdown code blocks
  let services: any[];
  try {
    services = parseJsonFromText(input);
  } catch (e) {
    console.error('❌ Failed to parse JSON. Make sure you copied the full response.');
    console.error(e);
    process.exit(1);
  }

  if (!Array.isArray(services)) {
    console.error('❌ Expected a JSON array of services.');
    process.exit(1);
  }

  console.log(`\n✅ Parsed ${services.length} services. Saving drafts...`);

  for (const service of services) {
    // Ensure required fields
    if (!service.id) service.id = `ontario-${slugify(service.name)}`;
    if (!service.scope) service.scope = 'ontario';
    if (!service.intent_category) service.intent_category = capitalize(vertical);
    
    service.verification_level = 'L0';
    service._meta = {
      source: 'Web AI Research',
      researched_at: new Date().toISOString(),
      confidence: service.confidence || 0.9,
      needs_review: true,
      enriched: false
    };

    const filename = `draft-${slugify(service.name)}.json`;
    const filePath = path.join(outputDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(service, null, 2));
    console.log(`  + ${filename}`);
  }

  console.log(`\n🎉 Done! Drafts saved to ${outputDir}`);
  console.log(`   Next: npx tsx scripts/ingest/enrich-prompt.ts --vertical=${vertical}`);
}

async function readStdin(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  const lines: string[] = [];
  for await (const line of rl) {
    lines.push(line);
  }
  return lines.join('\n');
}

function parseJsonFromText(text: string): any[] {
  // Remove markdown code blocks
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) 
    || text.match(/```\n?([\s\S]*?)\n?```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;
  
  const parsed = JSON.parse(jsonStr.trim());
  
  // Handle wrapped objects like { "services": [...] }
  if (Array.isArray(parsed)) return parsed;
  if (parsed.services && Array.isArray(parsed.services)) return parsed.services;
  
  // Try to find first array property
  const arrayProp = Object.values(parsed).find(v => Array.isArray(v));
  if (arrayProp) return arrayProp as any[];
  
  throw new Error('Could not find array in response');
}

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

main().catch(console.error);
