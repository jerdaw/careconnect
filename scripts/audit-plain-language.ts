#!/usr/bin/env tsx
/**
 * Plain Language Audit Script
 *
 * Analyzes service descriptions using Flesch Reading Ease scoring.
 * Marks services with accessible language (score > 60).
 *
 * Usage: npx tsx scripts/audit-plain-language.ts
 */

import fs from "fs/promises"
import path from "path"

interface Service {
  id: string
  name: string
  description?: string
  plain_language_available?: boolean
}

/**
 * Calculate Flesch Reading Ease score
 * Score interpretation:
 * 90-100: Very Easy (5th grade)
 * 80-89: Easy (6th grade)
 * 70-79: Fairly Easy (7th grade)
 * 60-69: Standard (8th-9th grade)
 * 50-59: Fairly Difficult (10th-12th grade)
 * 30-49: Difficult (College)
 * 0-29: Very Difficult (College graduate)
 */
function calculateFleschScore(text: string): number {
  // Remove extra whitespace
  const cleanText = text.replace(/\s+/g, " ").trim()

  if (!cleanText) return 0

  // Count sentences (periods, exclamation marks, question marks)
  const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const sentenceCount = sentences.length || 1

  // Count words
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0)
  const wordCount = words.length

  if (wordCount === 0) return 0

  // Count syllables (simplified algorithm)
  let syllableCount = 0
  for (const word of words) {
    syllableCount += countSyllables(word)
  }

  // Flesch Reading Ease formula
  // 206.835 - 1.015 × (total words / total sentences) - 84.6 × (total syllables / total words)
  const wordsPerSentence = wordCount / sentenceCount
  const syllablesPerWord = syllableCount / wordCount

  const score = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord

  return Math.max(0, Math.min(100, score))
}

/**
 * Count syllables in a word (simplified)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase()

  // Remove non-alphabetic characters
  word = word.replace(/[^a-z]/g, "")

  if (word.length <= 3) return 1

  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g)
  let count = vowelGroups ? vowelGroups.length : 0

  // Adjust for silent e
  if (word.endsWith("e")) {
    count--
  }

  // Ensure at least 1 syllable
  return Math.max(1, count)
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Very Easy (5th grade)"
  if (score >= 80) return "Easy (6th grade)"
  if (score >= 70) return "Fairly Easy (7th grade)"
  if (score >= 60) return "Standard (8th-9th grade)"
  if (score >= 50) return "Fairly Difficult (10th-12th grade)"
  if (score >= 30) return "Difficult (College)"
  return "Very Difficult (Graduate)"
}

async function loadServices(): Promise<Service[]> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const data = await fs.readFile(servicesPath, "utf-8")
  return JSON.parse(data)
}

async function saveServices(services: Service[]): Promise<void> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  await fs.writeFile(servicesPath, JSON.stringify(services, null, 2) + "\n", "utf-8")
}

async function main() {
  console.log("📚 Plain Language Audit")
  console.log("═".repeat(60))
  console.log("")

  const services = await loadServices()

  let accessible = 0
  let notAccessible = 0
  let noDescription = 0
  let updated = 0

  const results: Array<{ name: string; score: number; label: string }> = []

  for (const service of services) {
    if (!service.description) {
      noDescription++
      service.plain_language_available = false
      continue
    }

    const score = calculateFleschScore(service.description)
    const label = getScoreLabel(score)
    const isAccessible = score >= 60

    results.push({ name: service.name, score, label })

    // Update service
    const oldValue = service.plain_language_available
    service.plain_language_available = isAccessible

    if (oldValue !== isAccessible) {
      updated++
    }

    if (isAccessible) {
      accessible++
    } else {
      notAccessible++
    }
  }

  await saveServices(services)

  console.log("📊 Results:")
  console.log(`  Accessible (score ≥ 60): ${accessible}`)
  console.log(`  Not accessible: ${notAccessible}`)
  console.log(`  No description: ${noDescription}`)
  console.log(`  Updated flags: ${updated}`)
  console.log("")

  // Show services that need improvement
  const needsImprovement = results
    .filter((r) => r.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 10)

  if (needsImprovement.length > 0) {
    console.log("⚠️  Top 10 Services Needing Simpler Language:")
    needsImprovement.forEach(({ name, score, label }) => {
      console.log(`  ${score.toFixed(1)} - ${name}`)
      console.log(`       (${label})`)
    })
    console.log("")
  }

  // Show most accessible
  const mostAccessible = results
    .filter((r) => r.score >= 60)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  if (mostAccessible.length > 0) {
    console.log("✅ Most Accessible Services:")
    mostAccessible.forEach(({ name, score, label }) => {
      console.log(`  ${score.toFixed(1)} - ${name}`)
      console.log(`       (${label})`)
    })
    console.log("")
  }

  console.log("═".repeat(60))
  console.log("✅ Plain language audit complete")
  console.log("")
  console.log("💡 Tip: Aim for Flesch score ≥ 60 (8th-9th grade level)")
  console.log("   - Use shorter sentences")
  console.log("   - Choose simple words")
  console.log("   - Break up complex ideas")
}

main().catch((error) => {
  console.error("Error running audit:", error)
  process.exit(1)
})
