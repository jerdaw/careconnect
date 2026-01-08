#!/usr/bin/env npx tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Configuration
const PROMPT_PATH = path.join(process.cwd(), 'data/prompts/enrich-service.md');
const DRAFT_BASE_PATH = path.join(process.cwd(), 'data/drafts/ontario');

// CLI Arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    input: { type: 'string' }, // Directory or file
    llm: { type: 'string', default: 'gemini' },
    'batch-size': { type: 'string', default: '1' },
    'skip-verified': { type: 'boolean', default: true },
  },
});

interface ServiceDraft {
  id: string;
  name: string;
  url?: string;
  phone?: string;
  description?: string;
  _meta?: {
    enriched?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

async function main() {
  const inputPath = values.input 
    ? path.resolve(values.input) 
    : DRAFT_BASE_PATH;
  
  const llm = values.llm || 'gemini';
  const batchSize = parseInt(values['batch-size'] || '1', 10);
  const skipVerified = values['skip-verified'];

  console.log(`🧠 Enriching services using ${llm} (Batch size: ${batchSize})...`);
  console.log(`📂 Scanning: ${inputPath}`);

  // Find files
  const files = findFiles(inputPath);
  console.log(`found ${files.length} JSON files.`);

  if (files.length === 0) {
    console.log('No files found.');
    return;
  }

  // Load prompt template
  const promptTemplate = fs.readFileSync(PROMPT_PATH, 'utf-8');

  // Process in batches
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map(file => processFile(file, promptTemplate, llm, skipVerified)));
  }

  console.log('\n✅ Enrichment complete.');
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

async function processFile(filePath: string, promptTemplate: string, llm: string, skipVerified: boolean) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const draft: ServiceDraft = JSON.parse(content);

    if (skipVerified && draft._meta?.enriched) {
      process.stdout.write('.'); // Skip indicator
      return;
    }

    console.log(`\nProcessing: ${draft.name} (${path.basename(filePath)})`);

    const prompt = promptTemplate
      .replace('{{name}}', draft.name)
      .replace('{{url}}', draft.url || 'N/A')
      .replace('{{phone}}', draft.phone || 'N/A')
      .replace('{{description}}', draft.description || 'N/A');

    let enrichedData: any = {};
    if (llm === 'gemini') {
      enrichedData = await callGemini(prompt);
    } else {
      enrichedData = await callOpenAI(prompt);
    }

    // Merge data
    const updatedDraft = {
      ...draft,
      ...enrichedData,
      _meta: {
        ...draft._meta,
        enriched: true,
        enriched_at: new Date().toISOString()
      }
    };

    // Save
    fs.writeFileSync(filePath, JSON.stringify(updatedDraft, null, 2));
    console.log(`  ✅ Enriched`);

  } catch (error) {
    console.error(`  ❌ Failed: ${path.basename(filePath)}`, error);
  }
}

// Reuse LLM logic (simplified duplications for standalone script)
async function callGemini(prompt: string): Promise<any> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is missing');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent(prompt + "\n\nIMPORTANT: Return ONLY valid JSON object.");
  const response = await result.response;
  return parseCodeBlock(response.text());
}

async function callOpenAI(prompt: string): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is missing');
  
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: 'You are a JSON generator.' }, { role: 'user', content: prompt }],
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
    });
  
    const content = completion.choices[0].message.content || '{}';
    return parseCodeBlock(content);
}

function parseCodeBlock(text: string): any {
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse JSON:', jsonStr);
    throw e;
  }
}

main().catch(console.error);
