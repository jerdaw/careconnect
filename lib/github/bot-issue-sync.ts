export interface GitHubIssueSummary {
  number: number
  title: string
  body: string
  state: "open" | "closed"
  labels: string[]
  authorLogin: string
  createdAt: string
  updatedAt: string
  url?: string
}

export interface LegacyIssueMatcher {
  title_includes?: string
  body_includes?: string
  labels?: string[]
}

export interface BotIssueSyncConfig {
  marker: string
  labels: string[]
  title: string
  body: string
  legacy_matchers?: LegacyIssueMatcher[]
  close_when_resolved?: boolean
  history_limit?: number
  dry_run?: boolean
}

export interface UpdateIssueInput {
  title?: string
  body?: string
  labels?: string[]
  state?: "open" | "closed"
}

export interface BotIssueClient {
  listIssues(requiredLabels: string[]): Promise<GitHubIssueSummary[]>
  createIssue(input: { title: string; body: string; labels: string[] }): Promise<GitHubIssueSummary>
  updateIssue(issueNumber: number, input: UpdateIssueInput): Promise<GitHubIssueSummary>
}

export interface BotIssueSyncResult {
  action: "created" | "updated" | "reopened" | "closed" | "noop"
  dryRun: boolean
  canonicalIssueNumber?: number
  canonicalIssueUrl?: string
  duplicateIssueNumbers: number[]
  historyEntries: string[]
}

interface GitHubApiIssue {
  number: number
  title: string
  body?: string | null
  state: "open" | "closed"
  labels: Array<{ name?: string | null }>
  user?: { login?: string | null }
  created_at: string
  updated_at: string
  html_url?: string
  pull_request?: unknown
}

const BOT_AUTHOR_LOGIN = "github-actions[bot]"
const HISTORY_START = "<!-- careconnect-bot-issue-history:start -->"
const HISTORY_END = "<!-- careconnect-bot-issue-history:end -->"

function markerComment(marker: string): string {
  return `<!-- ${marker} -->`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function hasAllLabels(issue: GitHubIssueSummary, labels: string[]): boolean {
  return labels.every((label) => issue.labels.includes(label))
}

function issueMatchesLegacy(issue: GitHubIssueSummary, matchers: LegacyIssueMatcher[] | undefined): boolean {
  if (!matchers || matchers.length === 0) {
    return false
  }

  return matchers.some((matcher) => {
    if (matcher.title_includes && !issue.title.includes(matcher.title_includes)) {
      return false
    }

    if (matcher.body_includes && !issue.body.includes(matcher.body_includes)) {
      return false
    }

    if (matcher.labels && !matcher.labels.every((label) => issue.labels.includes(label))) {
      return false
    }

    return true
  })
}

function issueMatchesConfig(issue: GitHubIssueSummary, config: BotIssueSyncConfig): boolean {
  if (issue.authorLogin !== BOT_AUTHOR_LOGIN) {
    return false
  }

  const marker = markerComment(config.marker)
  if (issue.body.includes(marker)) {
    return true
  }

  if (!hasAllLabels(issue, config.labels)) {
    return false
  }

  return issueMatchesLegacy(issue, config.legacy_matchers)
}

function compareIssueRecency(left: GitHubIssueSummary, right: GitHubIssueSummary): number {
  const leftCreated = new Date(left.createdAt).getTime()
  const rightCreated = new Date(right.createdAt).getTime()

  if (leftCreated !== rightCreated) {
    return rightCreated - leftCreated
  }

  return right.number - left.number
}

function mergeLabels(existing: string[], required: string[]): string[] {
  return Array.from(new Set([...existing, ...required])).sort((left, right) => left.localeCompare(right))
}

function stripHistorySection(body: string): string {
  const historyPattern = new RegExp(`${escapeRegExp(HISTORY_START)}[\\s\\S]*?${escapeRegExp(HISTORY_END)}`, "g")
  return body.replace(historyPattern, "").trim()
}

function stripMarker(body: string, marker: string): string {
  const markerPattern = new RegExp(`^${escapeRegExp(markerComment(marker))}\\s*`, "m")
  return body.replace(markerPattern, "").trim()
}

function normalizeBaseBody(body: string, marker: string): string {
  return stripHistorySection(stripMarker(body, marker)).trim()
}

function extractHistoryEntries(body: string): string[] {
  const historyPattern = new RegExp(`${escapeRegExp(HISTORY_START)}([\\s\\S]*?)${escapeRegExp(HISTORY_END)}`)
  const match = body.match(historyPattern)

  if (!match) {
    return []
  }

  const historyBlock = match[1] ?? ""

  return historyBlock
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2))
}

function dedupePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>()
  const deduped: string[] = []

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue
    }

    seen.add(value)
    deduped.push(value)
  }

  return deduped
}

function buildHistoryEntries(
  config: BotIssueSyncConfig,
  canonicalIssue: GitHubIssueSummary | undefined,
  matches: GitHubIssueSummary[]
): string[] {
  if (!config.history_limit || config.history_limit <= 0) {
    return []
  }

  const sortedMatches = [...matches].sort(compareIssueRecency)
  const carriedTitles: string[] = []

  if (canonicalIssue && canonicalIssue.title !== config.title) {
    carriedTitles.push(canonicalIssue.title)
  }

  for (const issue of sortedMatches) {
    if (canonicalIssue && issue.number === canonicalIssue.number) {
      continue
    }

    carriedTitles.push(issue.title)
  }

  const existingEntries = canonicalIssue ? extractHistoryEntries(canonicalIssue.body) : []
  const combined = dedupePreserveOrder([...carriedTitles, ...existingEntries]).filter((entry) => entry !== config.title)

  return combined.slice(0, config.history_limit)
}

function buildManagedBody(config: BotIssueSyncConfig, historyEntries: string[]): string {
  const sections = [markerComment(config.marker), normalizeBaseBody(config.body, config.marker)]

  if (historyEntries.length > 0) {
    sections.push(
      [HISTORY_START, "## Recent Cycles", "", ...historyEntries.map((entry) => `- ${entry}`), HISTORY_END].join("\n")
    )
  }

  return sections
    .filter((section) => section.trim().length > 0)
    .join("\n\n")
    .trim()
}

function hasMeaningfulBody(body: string): boolean {
  return body.trim().length > 0
}

function determineAction(
  issue: GitHubIssueSummary | undefined,
  desiredBody: string,
  desiredTitle: string,
  desiredLabels: string[],
  duplicateIssueNumbers: number[],
  closeWhenResolved: boolean
): BotIssueSyncResult["action"] {
  if (!issue) {
    return hasMeaningfulBody(desiredBody) ? "created" : "noop"
  }

  if (!hasMeaningfulBody(desiredBody) && closeWhenResolved) {
    return issue.state === "open" ? "closed" : duplicateIssueNumbers.length > 0 ? "closed" : "noop"
  }

  const labelsChanged = issue.labels.join(",") !== desiredLabels.join(",")
  const titleChanged = issue.title !== desiredTitle
  const bodyChanged = issue.body !== desiredBody
  const stateChanged = issue.state !== "open"

  if (stateChanged) {
    return "reopened"
  }

  if (titleChanged || bodyChanged || labelsChanged || duplicateIssueNumbers.length > 0) {
    return "updated"
  }

  return "noop"
}

export async function syncBotIssue(client: BotIssueClient, config: BotIssueSyncConfig): Promise<BotIssueSyncResult> {
  const issues = await client.listIssues([])
  const matches = issues.filter((issue) => issueMatchesConfig(issue, config)).sort(compareIssueRecency)
  const canonicalIssue = matches[0]
  const duplicateIssues = matches.slice(1)
  const duplicateOpenIssues = duplicateIssues.filter((issue) => issue.state === "open")
  const historyEntries = buildHistoryEntries(config, canonicalIssue, matches)
  const desiredBody = hasMeaningfulBody(config.body) ? buildManagedBody(config, historyEntries) : ""
  const desiredLabels = mergeLabels(canonicalIssue?.labels ?? [], config.labels)
  const duplicateIssueNumbers = duplicateOpenIssues.map((issue) => issue.number)
  const action = determineAction(
    canonicalIssue,
    desiredBody,
    config.title,
    desiredLabels,
    duplicateIssueNumbers,
    config.close_when_resolved ?? false
  )

  if (!hasMeaningfulBody(config.body) && !(config.close_when_resolved ?? false)) {
    throw new Error("Bot issue sync received an empty body without close_when_resolved enabled.")
  }

  if (!canonicalIssue && !hasMeaningfulBody(config.body)) {
    return {
      action: "noop",
      dryRun: config.dry_run ?? false,
      duplicateIssueNumbers,
      historyEntries,
    }
  }

  if (config.dry_run) {
    return {
      action,
      dryRun: true,
      canonicalIssueNumber: canonicalIssue?.number,
      canonicalIssueUrl: canonicalIssue?.url,
      duplicateIssueNumbers,
      historyEntries,
    }
  }

  let activeCanonical = canonicalIssue

  if (!canonicalIssue && hasMeaningfulBody(config.body)) {
    activeCanonical = await client.createIssue({
      title: config.title,
      body: desiredBody,
      labels: config.labels,
    })
  } else if (canonicalIssue && !hasMeaningfulBody(config.body) && (config.close_when_resolved ?? false)) {
    if (canonicalIssue.state === "open") {
      activeCanonical = await client.updateIssue(canonicalIssue.number, { state: "closed" })
    }
  } else if (canonicalIssue && hasMeaningfulBody(config.body)) {
    const updateInput: UpdateIssueInput = {}

    if (canonicalIssue.title !== config.title) {
      updateInput.title = config.title
    }

    if (canonicalIssue.body !== desiredBody) {
      updateInput.body = desiredBody
    }

    if (canonicalIssue.state !== "open") {
      updateInput.state = "open"
    }

    const currentLabels = canonicalIssue.labels.join(",")
    const nextLabels = desiredLabels.join(",")
    if (currentLabels !== nextLabels) {
      updateInput.labels = desiredLabels
    }

    if (Object.keys(updateInput).length > 0) {
      activeCanonical = await client.updateIssue(canonicalIssue.number, updateInput)
    }
  }

  for (const duplicateIssue of duplicateOpenIssues) {
    await client.updateIssue(duplicateIssue.number, { state: "closed" })
  }

  return {
    action,
    dryRun: false,
    canonicalIssueNumber: activeCanonical?.number,
    canonicalIssueUrl: activeCanonical?.url,
    duplicateIssueNumbers,
    historyEntries,
  }
}

function mapApiIssue(issue: GitHubApiIssue): GitHubIssueSummary {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body ?? "",
    state: issue.state,
    labels: issue.labels.flatMap((label) => (label.name ? [label.name] : [])),
    authorLogin: issue.user?.login ?? "",
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    url: issue.html_url,
  }
}

export class GitHubRestBotIssueClient implements BotIssueClient {
  constructor(
    private readonly owner: string,
    private readonly repo: string,
    private readonly token: string,
    private readonly apiBaseUrl = "https://api.github.com"
  ) {}

  async listIssues(requiredLabels: string[]): Promise<GitHubIssueSummary[]> {
    const issues: GitHubIssueSummary[] = []
    let page = 1

    while (true) {
      const params = new URLSearchParams({
        state: "all",
        per_page: "100",
        page: String(page),
        sort: "created",
        direction: "desc",
      })

      if (requiredLabels.length > 0) {
        params.set("labels", requiredLabels.join(","))
      }

      const data = await this.request<GitHubApiIssue[]>(
        `/repos/${this.owner}/${this.repo}/issues?${params.toString()}`,
        { method: "GET" }
      )
      const issuePage = data.filter((issue) => !issue.pull_request).map(mapApiIssue)
      issues.push(...issuePage)

      if (data.length < 100) {
        break
      }

      page += 1
    }

    return issues
  }

  async createIssue(input: { title: string; body: string; labels: string[] }): Promise<GitHubIssueSummary> {
    const issue = await this.request<GitHubApiIssue>(`/repos/${this.owner}/${this.repo}/issues`, {
      method: "POST",
      body: JSON.stringify(input),
    })

    return mapApiIssue(issue)
  }

  async updateIssue(issueNumber: number, input: UpdateIssueInput): Promise<GitHubIssueSummary> {
    const issue = await this.request<GitHubApiIssue>(`/repos/${this.owner}/${this.repo}/issues/${issueNumber}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    })

    return mapApiIssue(issue)
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "User-Agent": "CareConnect-BotIssueSync/1.0",
      },
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`GitHub API request failed (${response.status} ${response.statusText}): ${body}`)
    }

    return (await response.json()) as T
  }
}
