#!/usr/bin/env npx tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import inquirer from 'inquirer';
import { spawn } from 'child_process';

// Configuration
const DRAFT_BASE_PATH = path.join(process.cwd(), 'data/drafts');
const SERVICES_PATH = path.join(process.cwd(), 'data/services.json');
const REJECTED_PATH = path.join(process.cwd(), 'data/drafts/rejected');

// CLI Arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    input: { type: 'string' },
    output: { type: 'string', default: 'json' },
    'auto-open': { type: 'boolean', default: true },
  },
});

async function main() {
  const inputDir = values.input 
    ? path.resolve(values.input) 
    : path.join(DRAFT_BASE_PATH, 'ontario');
  
  const autoOpen = values['auto-open'];

  if (!fs.existsSync(inputDir)) {
    console.error(`Input directory not found: ${inputDir}`);
    return;
  }

  const files = findFiles(inputDir);
  console.log(`📋 Found ${files.length} drafts pending review in ${inputDir}\n`);

  if (files.length === 0) return;

  // Make sure rejected folder exists
  if (!fs.existsSync(REJECTED_PATH)) {
    fs.mkdirSync(REJECTED_PATH, { recursive: true });
  }

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    await reviewDraft(filePath, i + 1, files.length, autoOpen);
  }

  console.log('\n✨ All drafts reviewed!');
}

async function reviewDraft(filePath: string, index: number, total: number, autoOpen: boolean) {
  const draft = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const filename = path.basename(filePath);

  console.clear();
  console.log(`📋 Reviewing: ${filename} (${index} of ${total})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Name:     ${draft.name}`);
  console.log(`Name FR:  ${draft.name_fr || 'N/A'}`);
  console.log(`Phone:    ${draft.phone || 'N/A'}`);
  console.log(`URL:      ${draft.url || 'N/A'}`);
  console.log(`Scope:    ${draft.scope}`);
  console.log(`Category: ${draft.intent_category}`);
  console.log(`Enriched: ${draft._meta?.enriched ? 'Yes' : 'No'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (autoOpen && draft.url) {
    // Attempt to open URL securely
    // We'll skip actual opening in this script context to avoid side effects during automated run, 
    // but in real use we'd uncomment:
    // try { await import('open').then(o => o.default(draft.url)); } catch (e) {}
    console.log(`(Would open ${draft.url} in browser)`);
  }

  const answer = await inquirer.prompt([
    {
      type: 'expand',
      name: 'action',
      message: 'Action:',
      choices: [
        { key: 'a', name: 'Approve', value: 'approve' },
        { key: 'e', name: 'Edit', value: 'edit' },
        { key: 'r', name: 'Reject', value: 'reject' },
        { key: 's', name: 'Skip', value: 'skip' },
        { key: 'q', name: 'Quit', value: 'quit' },
      ],
    },
  ]);

  switch (answer.action) {
    case 'approve':
      await approveDraft(draft, filePath);
      break;
    case 'reject':
      await rejectDraft(filePath, filename);
      break;
    case 'edit':
      await editDraft(filePath);
      await reviewDraft(filePath, index, total, autoOpen); // Re-review
      break;
    case 'skip':
      console.log('Skipped.');
      break;
    case 'quit':
      process.exit(0);
  }
}

async function approveDraft(draft: any, filePath: string) {
  // 1. Update verification level
  draft.verification_level = 'L1';
  delete draft._meta; // Remove meta before saving to prod if desired, or keep trace? Plan says delete draft file.
  // We remove ingest meta but keep provenance if needed. For now let's clean it.

  // 2. Add to services.json
  // Lock/Read/Write dance
  const servicesRaw = fs.readFileSync(SERVICES_PATH, 'utf-8');
  const services = JSON.parse(servicesRaw);
  
  // Check duplicate ID
  const exists = services.find((s: any) => s.id === draft.id);
  if (exists) {
    console.log('⚠️  Service ID already exists. Overwriting...');
    const idx = services.indexOf(exists);
    services[idx] = draft;
  } else {
    services.push(draft);
  }

  fs.writeFileSync(SERVICES_PATH, JSON.stringify(services, null, 2));

  // 3. Delete draft
  fs.unlinkSync(filePath);
  console.log('✅ Approved and merged.');
  await pause(1000);
}

async function rejectDraft(filePath: string, filename: string) {
  const dest = path.join(REJECTED_PATH, filename);
  fs.renameSync(filePath, dest);
  console.log('❌ Rejected.');
  await pause(1000);
}

async function editDraft(filePath: string) {
  const editor = process.env.EDITOR || 'nano';
  
  return new Promise<void>((resolve) => {
    const child = spawn(editor, [filePath], {
      stdio: 'inherit',
    });

    child.on('exit', () => {
        resolve();
    });
  });
}

function findFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    if (fs.statSync(dir).isFile()) return [dir];
  
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(findFiles(filePath));
      } else if (file.endsWith('.json')) {
        results.push(filePath);
      }
    }
    return results;
  }

function pause(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
