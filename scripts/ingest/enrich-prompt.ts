#!/usr/bin/env npx tsx
/**
 * Enrich Prompt Generator - Generate prompts for enriching drafts
 * 
 * Reads draft files and generates prompts you can paste into 
 * Gemini/ChatGPT for enrichment (hours, translations, etc.)
 * 
 * Usage:
 *   npx tsx scripts/ingest/enrich-prompt.ts --vertical=crisis
 */
import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';

const PROMPT_PATH = path.join(process.cwd(), 'data/prompts/enrich-service.md');
const DRAFT_BASE_PATH = path.join(process.cwd(), 'data/drafts/ontario');

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    vertical: { type: 'string' },
    file: { type: 'string' }, // Process single file
  },
});

function main() {
  const vertical = values.vertical;
  const singleFile = values.file;

  if (!vertical && !singleFile) {
    console.error('Usage: npx tsx scripts/ingest/enrich-prompt.ts --vertical=crisis');
    console.error('   or: npx tsx scripts/ingest/enrich-prompt.ts --file=path/to/draft.json');
    process.exit(1);
  }

  const promptTemplate = fs.readFileSync(PROMPT_PATH, 'utf-8');

  let files: string[];
  if (singleFile) {
    files = [path.resolve(singleFile)];
  } else {
    const dir = path.join(DRAFT_BASE_PATH, vertical!.toLowerCase());
    files = findDraftFiles(dir).filter(f => {
      const draft = JSON.parse(fs.readFileSync(f, 'utf-8'));
      return !draft._meta?.enriched; // Skip already enriched
    });
  }

  if (files.length === 0) {
    console.log('No unenriched drafts found.');
    return;
  }

  console.log(`Found ${files.length} drafts to enrich.\n`);

  for (const file of files) {
    const draft = JSON.parse(fs.readFileSync(file, 'utf-8'));
    
    console.log('═'.repeat(70));
    console.log(`ENRICHMENT PROMPT FOR: ${draft.name}`);
    console.log(`File: ${path.basename(file)}`);
    console.log('═'.repeat(70));

    const prompt = promptTemplate
      .replace('{{name}}', draft.name)
      .replace('{{url}}', draft.url || 'N/A')
      .replace('{{phone}}', draft.phone || 'N/A')
      .replace('{{description}}', draft.description || 'N/A');

    console.log(prompt);
    console.log('\n' + '─'.repeat(70));
    console.log('After getting response, manually update the draft file with the data.');
    console.log('Set `"_meta": { "enriched": true }` when done.');
    console.log('─'.repeat(70) + '\n\n');
  }
}

function findDraftFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(findDraftFiles(filePath));
    } else if (file.endsWith('.json') && file.startsWith('draft-')) {
      results.push(filePath);
    }
  }
  return results;
}

main();
