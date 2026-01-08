#!/usr/bin/env npx tsx
/**
 * Prospector - Generate prompt for service discovery
 * 
 * This script generates a prompt that you copy/paste into 
 * Gemini or ChatGPT web interface. No API key needed.
 * 
 * Usage:
 *   npx tsx scripts/ingest/prospector.ts --vertical=crisis --count=5
 * 
 * Then copy the output, paste into gemini.google.com or chatgpt.com,
 * and paste the response into: npx tsx scripts/ingest/import-response.ts
 */
import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';

const PROMPT_PATH = path.join(process.cwd(), 'data/prompts/discover-services.md');

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    vertical: { type: 'string' },
    count: { type: 'string', default: '5' },
  },
});

function main() {
  const vertical = values.vertical;
  const count = parseInt(values.count || '5', 10);

  if (!vertical) {
    console.error('Usage: npx tsx scripts/ingest/prospector.ts --vertical=crisis [--count=5]');
    console.error('\nVerticals: crisis, health, legal, food, housing, wellness, financial, employment, education, transport, community, indigenous');
    process.exit(1);
  }

  // Load and populate prompt template
  const promptTemplate = fs.readFileSync(PROMPT_PATH, 'utf-8');
  const prompt = promptTemplate
    .replace(/\{\{count\}\}/g, count.toString())
    .replace(/\{\{vertical\}\}/g, vertical);

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  COPY THE PROMPT BELOW AND PASTE INTO GEMINI OR CHATGPT       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(prompt);
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  AFTER GETTING THE RESPONSE, RUN:                             ║');
  console.log(`║  npx tsx scripts/ingest/import-response.ts --vertical=${vertical.padEnd(8)}  ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');
}

main();
