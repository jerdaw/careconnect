/** @vitest-environment node */
import fs from "fs/promises"
import os from "os"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

const { mockOrder, mockEq, mockSelect, mockFrom, mockCreateClient } = vi.hoisted(() => ({
  mockOrder: vi.fn(),
  mockEq: vi.fn(),
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
  mockCreateClient: vi.fn(),
}))

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}))

import {
  buildPilotReadinessReport,
  loadPilotScopeEntriesFromFile,
  loadPilotScopeEntriesFromSupabase,
  renderPilotReadinessCsv,
  renderPilotReadinessMarkdown,
} from "@/lib/pilot/readiness-audit"
import type { Service } from "@/types/service"

function mockScopeQuery(result: unknown) {
  mockOrder.mockResolvedValue(result)
  mockEq.mockReturnValue({ eq: mockEq, order: mockOrder })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockFrom.mockReturnValue({ select: mockSelect })
  mockCreateClient.mockReturnValue({ from: mockFrom })
}

describe("pilot readiness audit", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("loads scope entries from a scope file", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hb-scope-"))
    const filePath = path.join(tempDir, "scope.json")
    await fs.writeFile(filePath, JSON.stringify([{ service_id: "svc-1", sla_tier: "crisis" }], null, 2), "utf-8")

    const entries = await loadPilotScopeEntriesFromFile(filePath)
    expect(entries).toEqual([{ service_id: "svc-1", sla_tier: "crisis" }])
  })

  it("rejects invalid scope file entries without echoing raw values", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hb-scope-"))
    const filePath = path.join(tempDir, "scope.json")
    await fs.writeFile(
      filePath,
      JSON.stringify(
        {
          services: [
            {
              service_id: "svc-1",
              sla_tier: "gold",
              notes: "raw partner note that should not be echoed",
            },
          ],
        },
        null,
        2
      ),
      "utf-8"
    )

    await expect(loadPilotScopeEntriesFromFile(filePath)).rejects.toThrow(
      "Invalid pilot scope file entries: entry 1 sla_tier, entry 1 value"
    )

    try {
      await loadPilotScopeEntriesFromFile(filePath)
    } catch (error) {
      expect(String(error)).not.toContain("gold")
      expect(String(error)).not.toContain("raw partner note")
    }
  })

  it("rejects malformed scope file shapes", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hb-scope-"))
    const filePath = path.join(tempDir, "scope.json")
    await fs.writeFile(filePath, JSON.stringify({ records: [] }, null, 2), "utf-8")

    await expect(loadPilotScopeEntriesFromFile(filePath)).rejects.toThrow(
      "Invalid pilot scope file: expected an array or an object with a services array"
    )
  })

  it("rejects duplicate scope identities without echoing raw values", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hb-scope-"))
    const filePath = path.join(tempDir, "scope.json")
    await fs.writeFile(
      filePath,
      JSON.stringify(
        [
          { service_id: "svc-sensitive", sla_tier: "standard" },
          { service_id: "svc-sensitive", sla_tier: "standard" },
        ],
        null,
        2
      ),
      "utf-8"
    )

    try {
      await loadPilotScopeEntriesFromFile(filePath)
      throw new Error("Expected duplicate scope entry")
    } catch (error) {
      expect(String(error)).toContain("Invalid pilot scope file entries: entry 2 duplicates entry 1")
      expect(String(error)).not.toContain("svc-sensitive")
    }
  })

  it("allows the same scoped service under distinct org identities", async () => {
    const firstOrgId = "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e"
    const secondOrgId = "5002d45c-0b0c-4c8c-bf37-a270034471ca"
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hb-scope-"))
    const filePath = path.join(tempDir, "scope.json")
    await fs.writeFile(
      filePath,
      JSON.stringify(
        [
          { service_id: "svc-1", sla_tier: "standard", org_id: firstOrgId },
          { service_id: "svc-1", sla_tier: "standard", org_id: secondOrgId },
        ],
        null,
        2
      ),
      "utf-8"
    )

    const entries = await loadPilotScopeEntriesFromFile(filePath)

    expect(entries).toHaveLength(2)
    expect(entries.map((entry) => entry.org_id)).toEqual([firstOrgId, secondOrgId])
  })

  it("loads scope entries from Supabase in pilot-cycle mode", async () => {
    const orgId = "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e"
    mockScopeQuery({
      data: [{ pilot_cycle_id: "v22-cycle-1", org_id: orgId, service_id: "svc-1", sla_tier: "standard" }],
      error: null,
    })

    const entries = await loadPilotScopeEntriesFromSupabase({
      supabaseUrl: "https://example.supabase.co",
      supabaseKey: "service-key",
      pilotCycleId: "v22-cycle-1",
      orgId,
    })

    expect(entries).toEqual([
      {
        pilot_cycle_id: "v22-cycle-1",
        org_id: orgId,
        service_id: "svc-1",
        sla_tier: "standard",
      },
    ])
  })

  it("sanitizes Supabase scope load errors", async () => {
    mockScopeQuery({
      data: null,
      error: {
        code: "42501",
        message: "permission denied for partner-owned pilot scope with internal details",
      },
    })

    try {
      await loadPilotScopeEntriesFromSupabase({
        supabaseUrl: "https://example.supabase.co",
        supabaseKey: "service-key",
        pilotCycleId: "v22-cycle-1",
      })
      throw new Error("Expected Supabase load failure")
    } catch (error) {
      expect(String(error)).toContain("Failed to load pilot scope from Supabase (42501)")
      expect(String(error)).not.toContain("permission denied")
      expect(String(error)).not.toContain("partner-owned")
    }
  })

  it("rejects invalid Supabase scope rows without echoing raw values", async () => {
    mockScopeQuery({
      data: [{ pilot_cycle_id: "v22-cycle-1", org_id: "not-a-uuid", service_id: "svc-1", sla_tier: "urgent" }],
      error: null,
    })

    try {
      await loadPilotScopeEntriesFromSupabase({
        supabaseUrl: "https://example.supabase.co",
        supabaseKey: "service-key",
        pilotCycleId: "v22-cycle-1",
      })
      throw new Error("Expected invalid Supabase scope row")
    } catch (error) {
      expect(String(error)).toContain("Invalid pilot scope Supabase entries: entry 1 sla_tier, entry 1 org_id")
      expect(String(error)).not.toContain("urgent")
      expect(String(error)).not.toContain("not-a-uuid")
    }
  })

  it("rejects invalid direct report scope entries", () => {
    try {
      buildPilotReadinessReport([], [{ service_id: "svc-1", sla_tier: "gold" as never }])
      throw new Error("Expected invalid report scope entry")
    } catch (error) {
      expect(String(error)).toContain("Invalid pilot scope report entries: entry 1 sla_tier")
      expect(String(error)).not.toContain("gold")
    }
  })

  it("builds a scoped readiness report and renders markdown/csv", () => {
    const services = [
      {
        id: "svc-1",
        name: "Kingston Food Support",
        description: "Food support",
        url: "https://example.com",
        verification_level: "L1",
        intent_category: "Food",
        provenance: {
          verified_by: "tester",
          verified_at: "2025-08-01T00:00:00.000Z",
          evidence_url: "https://example.com",
          method: "web",
        },
        identity_tags: [],
        synthetic_queries: [],
        scope: "kingston",
        virtual_delivery: false,
        published: true,
        address: "",
      },
      {
        id: "svc-2",
        name: "Crisis Line",
        description: "Crisis support",
        url: "https://example.org",
        verification_level: "L2",
        intent_category: "Crisis",
        provenance: {
          verified_by: "tester",
          verified_at: "2026-03-01T00:00:00.000Z",
          evidence_url: "https://example.org",
          method: "phone",
        },
        identity_tags: [],
        synthetic_queries: [],
        scope: "kingston",
        virtual_delivery: true,
        published: true,
        email: "contact@example.org",
        access_script: "Call us",
        hours_text: "24/7",
      },
    ] as unknown as Service[]

    const report = buildPilotReadinessReport(services, [
      { service_id: "svc-1", sla_tier: "standard" },
      { service_id: "svc-2", sla_tier: "crisis" },
      { service_id: "missing", sla_tier: "high_demand" },
    ])

    expect(report.total_scoped_services).toBe(3)
    expect(report.matched_services).toBe(2)
    expect(report.missing_service_records).toEqual(["missing"])
    expect(report.gap_counts.missing_required_coordinates).toBe(1)
    expect(report.gap_counts.missing_email).toBe(1)
    expect(report.sla_tier_distribution.high_demand).toBe(1)

    const markdown = renderPilotReadinessMarkdown(report)
    const csv = renderPilotReadinessCsv(report)

    expect(markdown).toContain("# Pilot Readiness Audit")
    expect(markdown).toContain("Missing email: 1")
    expect(csv.split("\n")[0]).toContain("service_id,name,category")
    expect(csv).toContain("svc-1")
    expect(csv).toContain("verification_action")
  })

  it("neutralizes spreadsheet formula prefixes in the readiness CSV", () => {
    const services = [
      {
        id: "svc-formula",
        name: '=HYPERLINK("https://example.test")',
        description: "Food support",
        url: "https://example.com",
        verification_level: "L1",
        intent_category: "Food",
        provenance: {
          verified_by: "tester",
          verified_at: "2026-03-01T00:00:00.000Z",
          evidence_url: "https://example.com",
          method: "web",
        },
        identity_tags: [],
        synthetic_queries: [],
        scope: "kingston",
        virtual_delivery: true,
        published: true,
      },
    ] as unknown as Service[]

    const report = buildPilotReadinessReport(services, [{ service_id: "svc-formula", sla_tier: "standard" }])
    const csv = renderPilotReadinessCsv(report)
    const row = csv.split("\n")[1]

    expect(row).toContain("\"'" + '=HYPERLINK(""https://example.test"")"')
    expect(row).not.toContain("svc-formula,=HYPERLINK")
  })
})
