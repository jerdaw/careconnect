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

  it("loads scope entries from Supabase in pilot-cycle mode", async () => {
    mockOrder.mockResolvedValue({
      data: [{ pilot_cycle_id: "v22-cycle-1", org_id: "org-1", service_id: "svc-1", sla_tier: "standard" }],
      error: null,
    })
    mockEq.mockReturnValue({ eq: mockEq, order: mockOrder })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })
    mockCreateClient.mockReturnValue({ from: mockFrom })

    const entries = await loadPilotScopeEntriesFromSupabase({
      supabaseUrl: "https://example.supabase.co",
      supabaseKey: "service-key",
      pilotCycleId: "v22-cycle-1",
      orgId: "org-1",
    })

    expect(entries).toEqual([
      {
        pilot_cycle_id: "v22-cycle-1",
        org_id: "org-1",
        service_id: "svc-1",
        sla_tier: "standard",
      },
    ])
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
})
