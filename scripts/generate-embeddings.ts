#!/usr/bin/env npx tsx
import { pipeline } from "@xenova/transformers"
import { readFileSync, writeFileSync } from "fs"
import path from "path"

import type { Service } from "../types/service"

const MODEL = "Xenova/all-MiniLM-L6-v2"
const DATA_DIR = path.join(process.cwd(), "data")

async function main() {
  console.log("🧠 Loading embedding model...")
  // feature-extraction task
  const embedder = await pipeline("feature-extraction", MODEL)

  const services = JSON.parse(readFileSync(path.join(DATA_DIR, "services.json"), "utf-8")) as Service[]
  const embeddings: Record<string, number[]> = {}

  console.log(`Generating embeddings for ${services.length} services...`)

  for (const service of services) {
    // Combine fields for semantic search
    const text = `${service.name} ${service.description} ${service.synthetic_queries?.join(" ") || ""}`

    // Generate embedding
    const result = await embedder(text, { pooling: "mean", normalize: true })

    // Store as plain array
    embeddings[service.id] = Array.from(result.data as Float32Array)
    process.stdout.write(".")
  }

  writeFileSync(path.join(DATA_DIR, "embeddings.json"), JSON.stringify(embeddings))
  console.log(`\n✅ Generated embeddings for ${services.length} services.`)
}

main().catch(console.error)
