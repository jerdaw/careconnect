/** @vitest-environment node */
import { beforeEach, describe, expect, it } from "vitest"

import {
  syncBotIssue,
  type BotIssueClient,
  type BotIssueSyncConfig,
  type GitHubIssueSummary,
  type UpdateIssueInput,
} from "@/lib/github/bot-issue-sync"

class FakeBotIssueClient implements BotIssueClient {
  constructor(readonly issues: GitHubIssueSummary[]) {}

  readonly created: Array<{ title: string; body: string; labels: string[] }> = []
  readonly updates: Array<{ issueNumber: number; input: UpdateIssueInput }> = []

  async listIssues(requiredLabels: string[]): Promise<GitHubIssueSummary[]> {
    return this.issues
      .filter((issue) => requiredLabels.every((label) => issue.labels.includes(label)))
      .map((issue) => ({ ...issue, labels: [...issue.labels] }))
  }

  async createIssue(input: { title: string; body: string; labels: string[] }): Promise<GitHubIssueSummary> {
    this.created.push(input)

    const issue: GitHubIssueSummary = {
      number: Math.max(0, ...this.issues.map((candidate) => candidate.number)) + 1,
      title: input.title,
      body: input.body,
      state: "open",
      labels: [...input.labels],
      authorLogin: "github-actions[bot]",
      createdAt: "2026-04-20T12:00:00.000Z",
      updatedAt: "2026-04-20T12:00:00.000Z",
      url: `https://example.test/issues/${Math.max(0, ...this.issues.map((candidate) => candidate.number)) + 1}`,
    }

    this.issues.unshift(issue)
    return { ...issue, labels: [...issue.labels] }
  }

  async updateIssue(issueNumber: number, input: UpdateIssueInput): Promise<GitHubIssueSummary> {
    this.updates.push({ issueNumber, input })

    const issue = this.issues.find((candidate) => candidate.number === issueNumber)
    if (!issue) {
      throw new Error(`Issue ${issueNumber} not found`)
    }

    if (input.title !== undefined) {
      issue.title = input.title
    }

    if (input.body !== undefined) {
      issue.body = input.body
    }

    if (input.state !== undefined) {
      issue.state = input.state
    }

    if (input.labels !== undefined) {
      issue.labels = [...input.labels]
    }

    issue.updatedAt = "2026-04-20T13:00:00.000Z"
    return { ...issue, labels: [...issue.labels] }
  }
}

function makeIssue(overrides: Partial<GitHubIssueSummary> = {}): GitHubIssueSummary {
  return {
    number: overrides.number ?? 1,
    title: overrides.title ?? "📞 Monthly Crisis Service Verification - April 2026",
    body:
      overrides.body ??
      "## Crisis Service Verification Checklist\n\n---\n*Automatically created by verification reminder workflow.*\n",
    state: overrides.state ?? "open",
    labels: overrides.labels ?? ["verification", "crisis-services", "monthly"],
    authorLogin: overrides.authorLogin ?? "github-actions[bot]",
    createdAt: overrides.createdAt ?? "2026-04-01T14:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-04-01T14:00:00.000Z",
    url: overrides.url ?? `https://example.test/issues/${overrides.number ?? 1}`,
  }
}

function makeConfig(overrides: Partial<BotIssueSyncConfig> = {}): BotIssueSyncConfig {
  return {
    marker: "careconnect-crisis-reminder",
    labels: ["verification", "crisis-services", "monthly"],
    title: "📞 Monthly Crisis Service Verification - April 2026",
    body: "## Crisis Service Verification Checklist\n\nCurrent cycle checklist.",
    legacy_matchers: [{ title_includes: "Monthly Crisis Service Verification", labels: ["verification", "monthly"] }],
    ...overrides,
  }
}

describe("syncBotIssue", () => {
  let client: FakeBotIssueClient

  beforeEach(() => {
    client = new FakeBotIssueClient([])
  })

  it("creates a managed issue when none exists", async () => {
    const result = await syncBotIssue(client, makeConfig())

    expect(result.action).toBe("created")
    expect(client.created).toHaveLength(1)
    expect(client.created[0]!.body).toContain("<!-- careconnect-crisis-reminder -->")
    expect(client.created[0]!.labels).toEqual(["verification", "crisis-services", "monthly"])
  })

  it("updates an existing open issue matched through legacy rules", async () => {
    client = new FakeBotIssueClient([makeIssue({ labels: ["verification", "crisis-services", "monthly", "triage"] })])

    const result = await syncBotIssue(
      client,
      makeConfig({ body: "## Crisis Service Verification Checklist\n\nUpdated." })
    )

    expect(result.action).toBe("updated")
    expect(client.updates).toHaveLength(1)
    expect(client.updates[0]!.input.body).toContain("<!-- careconnect-crisis-reminder -->")
    expect(client.updates[0]!.input.labels).toEqual(["crisis-services", "monthly", "triage", "verification"])
  })

  it("reopens a closed matching issue instead of creating a new one", async () => {
    client = new FakeBotIssueClient([makeIssue({ state: "closed" })])

    const result = await syncBotIssue(client, makeConfig())

    expect(result.action).toBe("reopened")
    expect(client.created).toHaveLength(0)
    expect(client.updates).toHaveLength(1)
    expect(client.updates[0]!.input.state).toBe("open")
  })

  it("closes older duplicate open issues while keeping the newest canonical issue", async () => {
    client = new FakeBotIssueClient([
      makeIssue({ number: 13, createdAt: "2026-04-01T14:00:00.000Z", body: "legacy current" }),
      makeIssue({
        number: 8,
        createdAt: "2026-03-01T14:00:00.000Z",
        title: "📞 Monthly Crisis Service Verification - March 2026",
      }),
    ])

    const result = await syncBotIssue(client, makeConfig())

    expect(result.action).toBe("updated")
    expect(result.duplicateIssueNumbers).toEqual([8])
    expect(client.updates.some((update) => update.issueNumber === 8 && update.input.state === "closed")).toBe(true)
  })

  it("auto-closes a finding issue when the condition is resolved", async () => {
    client = new FakeBotIssueClient([
      makeIssue({
        number: 21,
        title: "🔗 Monthly Health Check: Broken URLs Detected",
        body: "<!-- careconnect-health-check -->\n\nBroken URLs still open.",
        labels: ["automated", "data-quality"],
      }),
    ])

    const result = await syncBotIssue(client, {
      marker: "careconnect-health-check",
      labels: ["automated", "data-quality"],
      title: "🔗 Monthly Health Check: Broken URLs Detected",
      body: "",
      legacy_matchers: [{ title_includes: "Monthly Health Check" }],
      close_when_resolved: true,
    })

    expect(result.action).toBe("closed")
    expect(client.updates).toEqual([{ issueNumber: 21, input: { state: "closed" } }])
  })

  it("maintains compact cycle history and trims to the configured limit", async () => {
    client = new FakeBotIssueClient([
      makeIssue({
        number: 13,
        title: "📞 Monthly Crisis Service Verification - April 2026",
        body: "<!-- careconnect-crisis-reminder -->\n\n## Crisis Service Verification Checklist\n\nApril checklist.",
        createdAt: "2026-04-01T14:00:00.000Z",
      }),
      makeIssue({
        number: 8,
        title: "📞 Monthly Crisis Service Verification - March 2026",
        createdAt: "2026-03-01T14:00:00.000Z",
        state: "closed",
      }),
      makeIssue({
        number: 1,
        title: "📞 Monthly Crisis Service Verification - February 2026",
        createdAt: "2026-02-01T14:00:00.000Z",
        state: "closed",
      }),
    ])

    const result = await syncBotIssue(
      client,
      makeConfig({
        title: "📞 Monthly Crisis Service Verification - May 2026",
        history_limit: 2,
      })
    )

    expect(result.historyEntries).toEqual([
      "📞 Monthly Crisis Service Verification - April 2026",
      "📞 Monthly Crisis Service Verification - March 2026",
    ])
    expect(client.updates[0]!.input.body).toContain("## Recent Cycles")
    expect(client.updates[0]!.input.body).toContain("- 📞 Monthly Crisis Service Verification - April 2026")
    expect(client.updates[0]!.input.body).toContain("- 📞 Monthly Crisis Service Verification - March 2026")
    expect(client.updates[0]!.input.body).not.toContain("February 2026")
  })
})
