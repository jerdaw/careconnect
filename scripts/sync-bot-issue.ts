#!/usr/bin/env node --import tsx
import { appendFileSync, readFileSync } from "fs"
import path from "path"

import { z } from "zod"

import {
  GitHubRestBotIssueClient,
  syncBotIssue,
  type BotIssueSyncConfig,
  type LegacyIssueMatcher,
} from "../lib/github/bot-issue-sync"
import { logger } from "../lib/logger"

const legacyMatcherSchema = z.object({
  title_includes: z.string().min(1).optional(),
  body_includes: z.string().min(1).optional(),
  labels: z.array(z.string().min(1)).optional(),
})

const configSchema = z.object({
  marker: z.string().min(1),
  labels: z.array(z.string().min(1)).min(1),
  title: z.string().min(1),
  body: z.string(),
  legacy_matchers: z.array(legacyMatcherSchema).optional(),
  close_when_resolved: z.boolean().optional(),
  history_limit: z.number().int().positive().optional(),
  dry_run: z.boolean().optional(),
})

function setGitHubOutput(name: string, value: string | number | boolean): void {
  if (!process.env.GITHUB_OUTPUT) {
    return
  }

  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value)}\n`)
}

function parseRepository(): { owner: string; repo: string } {
  const repository = process.env.GITHUB_REPOSITORY

  if (!repository || !repository.includes("/")) {
    throw new Error("GITHUB_REPOSITORY must be set to owner/repo for bot issue sync.")
  }

  const [owner, repo] = repository.split("/")
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY value: ${repository}`)
  }

  return { owner, repo }
}

function parseConfig(configPath: string): BotIssueSyncConfig {
  const rawConfig = JSON.parse(readFileSync(configPath, "utf-8")) as {
    legacy_matchers?: LegacyIssueMatcher[]
  }

  return configSchema.parse(rawConfig)
}

async function main(): Promise<void> {
  logger.setContext({ component: "scripts/sync-bot-issue" })

  const configArg = process.argv[2]
  if (!configArg) {
    throw new Error("Usage: node --import tsx scripts/sync-bot-issue.ts <config-path>")
  }

  const configPath = path.resolve(process.cwd(), configArg)
  const config = parseConfig(configPath)
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

  if (!token) {
    throw new Error("GITHUB_TOKEN or GH_TOKEN must be set for bot issue sync.")
  }

  const { owner, repo } = parseRepository()
  const client = new GitHubRestBotIssueClient(owner, repo, token)
  const result = await syncBotIssue(client, config)

  logger.info("Bot issue sync completed", result)

  setGitHubOutput("action", result.action)
  setGitHubOutput("dry_run", result.dryRun)

  if (result.canonicalIssueNumber) {
    setGitHubOutput("canonical_issue_number", result.canonicalIssueNumber)
  }

  if (result.canonicalIssueUrl) {
    setGitHubOutput("canonical_issue_url", result.canonicalIssueUrl)
  }

  setGitHubOutput("duplicate_issue_numbers", result.duplicateIssueNumbers.join(","))
}

main().catch((error) => {
  logger.error("Bot issue sync failed", error)
  process.exit(1)
})
