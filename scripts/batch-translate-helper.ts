/**
 * Translation Helper Script
 *
 * Assists with manual French translation workflow:
 * 1. Reads input batches
 * 2. Generates translation prompts
 * 3. Validates output format
 * 4. Helps merge results
 */

import fs from 'fs'
import path from 'path'

interface TranslationBatch {
  services: Array<{
    id: string
    access_script: string
    access_script_fr?: string
  }>
}

/**
 * Generate translation prompts for AI services
 */
export function generateTranslationPrompts(batchPath: string): string {
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8')) as TranslationBatch

  let prompt = `# French Translation Request\n\n`
  prompt += `Please translate the following English "access_script" fields to French.\n\n`
  prompt += `**Guidelines:**\n`
  prompt += `- Maintain the same level of detail\n`
  prompt += `- Preserve meaning, no new claims\n`
  prompt += `- Use natural, conversational Canadian French\n`
  prompt += `- Keep technical terms appropriate (e.g., "email" → "courriel")\n\n`
  prompt += `**Format:** For each service, provide the French translation.\n\n`
  prompt += `---\n\n`

  batch.services.forEach((service, idx) => {
    prompt += `## Service ${idx + 1} (ID: ${service.id})\n\n`
    prompt += `**English:**\n${service.access_script}\n\n`
    prompt += `**French Translation:**\n[YOUR TRANSLATION HERE]\n\n`
    prompt += `---\n\n`
  })

  return prompt
}

/**
 * Parse AI response and create output batch
 */
export function parseTranslationResponse(
  inputBatchPath: string,
  translationText: string
): TranslationBatch {
  const inputBatch = JSON.parse(
    fs.readFileSync(inputBatchPath, 'utf-8')
  ) as TranslationBatch

  // Parse translation text (expects service IDs as markers)
  // Simple regex-based parsing
  const translations = new Map<string, string>()

  const servicePattern = /## Service \d+ \(ID: (.+?)\)[\s\S]*?\*\*French Translation:\*\*\s*\n([\s\S]*?)(?=\n---|\n##|$)/g

  let match
  while ((match = servicePattern.exec(translationText)) !== null) {
    const id = match[1]!
    const translation = match[2]!
    translations.set(id.trim(), translation.trim())
  }

  // Merge translations into output batch
  const outputBatch: TranslationBatch = {
    services: inputBatch.services.map(service => ({
      ...service,
      access_script_fr: translations.get(service.id) || '',
    }))
  }

  return outputBatch
}

/**
 * Validate output batch
 */
export function validateTranslationBatch(batch: TranslationBatch): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  batch.services.forEach((service, idx) => {
    if (!service.access_script_fr) {
      errors.push(`Service ${idx + 1} (${service.id}): Missing French translation`)
    }

    if (service.access_script_fr && service.access_script_fr.length < 10) {
      errors.push(`Service ${idx + 1} (${service.id}): French translation too short`)
    }

    // Check for obvious copy-paste errors (EN text in FR field)
    const enWords = ['email', 'phone', 'website', 'click', 'online']
    const hasEnglishWords = enWords.some(word =>
      service.access_script_fr?.toLowerCase().includes(word)
    )

    if (hasEnglishWords) {
      errors.push(`Service ${idx + 1} (${service.id}): WARNING - May contain untranslated English words`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]

  switch (command) {
    case 'generate-prompt': {
      const batchPath = process.argv[3]
      if (!batchPath) {
        console.error('Usage: tsx scripts/batch-translate-helper.ts generate-prompt <batch-path>')
        process.exit(1)
      }
      const prompt = generateTranslationPrompts(batchPath)
      console.log(prompt)

      // Save to file
      const outputPath = batchPath.replace('/input/', '/prompts/').replace('.json', '-prompt.md')
      try {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true })
        fs.writeFileSync(outputPath, prompt)
        console.error(`\n✅ Prompt saved to: ${outputPath}`)
      } catch (_e) {
         console.error(`\n⚠️ Could not save to file (path might not exist), but output to stdout.`)
      }
      break
    }

    case 'parse-response': {
      const inputBatchPath = process.argv[3]
      const responseFile = process.argv[4]

      if (!inputBatchPath || !responseFile) {
        console.error('Usage: tsx scripts/batch-translate-helper.ts parse-response <input-batch> <response-file>')
        process.exit(1)
      }

      const translationText = fs.readFileSync(responseFile, 'utf-8')
      const outputBatch = parseTranslationResponse(inputBatchPath, translationText)

      // Validate
      const validation = validateTranslationBatch(outputBatch)
      if (!validation.valid) {
        console.error('❌ Validation errors:')
        validation.errors.forEach(err => console.error(`  - ${err}`))
      }

      // Save output
      const outputPath = inputBatchPath.replace('/input/', '/output/')
      try {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true })
        fs.writeFileSync(outputPath, JSON.stringify(outputBatch, null, 2))
        console.log(`✅ Output saved to: ${outputPath}`)
      } catch (_e) {
         console.error(`\n⚠️ Could not save to file: ${outputPath}`)
         console.log(JSON.stringify(outputBatch, null, 2))
      }

      if (validation.valid) {
        console.log('✅ Validation passed')
      }
      break
    }

    case 'validate': {
      const batchPath = process.argv[3]
      if (!batchPath) {
        console.error('Usage: tsx scripts/batch-translate-helper.ts validate <batch-path>')
        process.exit(1)
      }

      const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8')) as TranslationBatch
      const validation = validateTranslationBatch(batch)

      if (validation.valid) {
        console.log('✅ Validation passed')
        console.log('\n📌 NEXT STEP: Merge this batch into the main database:')
        console.log(`   npm run merge-ai-enrichment -- ${batchPath}`)
      } else {
        console.error('❌ Validation errors:')
        validation.errors.forEach(err => console.error(`  - ${err}`))
        process.exit(1)
      }
      break
    }

    default:
      console.error('Unknown command. Available commands:')
      console.error('  - generate-prompt <batch-path>')
      console.error('  - parse-response <input-batch> <response-file>')
      console.error('  - validate <batch-path>')
      process.exit(1)
  }
}
