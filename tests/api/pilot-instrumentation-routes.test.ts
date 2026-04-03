/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthorizationError } from "@/lib/api-utils"
import { createMockRequest } from "@/tests/utils/api-test-utils"
import { POST as postConnection } from "@/app/api/v1/pilot/events/connection/route"
import { POST as postPilotScopeService } from "@/app/api/v1/pilot/scope/services/route"
import { POST as postServiceStatus } from "@/app/api/v1/pilot/events/service-status/route"
import { POST as postDataDecayAudit } from "@/app/api/v1/pilot/events/data-decay-audit/route"
import { POST as postPreferenceFit } from "@/app/api/v1/pilot/events/preference-fit/route"
import { requireAuthenticatedUser } from "@/lib/pilot/auth"
import { assertPermission } from "@/lib/auth/authorization"
import {
  insertConnectionEvent,
  insertPilotDataDecayAudit,
  insertPilotPreferenceFitEvent,
  insertServiceOperationalStatusEvent,
  upsertPilotScopeService,
} from "@/lib/pilot/storage"

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  generateErrorId: vi.fn(() => "req-test"),
}))

vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn(() => "127.0.0.1"),
  checkRateLimit: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock("@/lib/pilot/auth", () => ({
  requireAuthenticatedUser: vi.fn(),
}))

vi.mock("@/lib/auth/authorization", () => ({
  assertPermission: vi.fn(),
}))

vi.mock("@/lib/pilot/storage", () => ({
  insertConnectionEvent: vi.fn(),
  upsertPilotScopeService: vi.fn(),
  insertServiceOperationalStatusEvent: vi.fn(),
  insertPilotDataDecayAudit: vi.fn(),
  insertPilotPreferenceFitEvent: vi.fn(),
}))

const baseOrgId = "3e4f36f6-2b92-4fa8-af31-c7c5d75a3f5e"

function createRequest(url: string, body: unknown) {
  return createMockRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("pilot instrumentation write routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      error: null,
      supabaseAuth: {} as never,
      user: { id: "user-1" },
    } as never)
    vi.mocked(assertPermission).mockResolvedValue("editor" as never)
  })

  const cases = [
    {
      name: "connection",
      route: postConnection,
      url: "http://localhost/api/v1/pilot/events/connection",
      payload: {
        pilot_cycle_id: "v22-cycle-1",
        org_id: baseOrgId,
        service_id: "svc-1",
        connected_at: "2026-03-08T15:30:00.000Z",
        contact_attempt_event_id: "11111111-1111-1111-1111-111111111111",
      },
      invalidPayload: {
        pilot_cycle_id: "v22-cycle-1",
        org_id: baseOrgId,
        service_id: "svc-1",
        connected_at: "2026-03-08T15:30:00.000Z",
      },
      storageMock: insertConnectionEvent,
      missingTableMessage: "Pilot storage not ready: missing pilot_connection_events table",
    },
    {
      name: "scope service",
      route: postPilotScopeService,
      url: "http://localhost/api/v1/pilot/scope/services",
      payload: {
        pilot_cycle_id: "v22-cycle-1",
        org_id: baseOrgId,
        service_id: "svc-1",
        sla_tier: "high_demand",
      },
      invalidPayload: {
        pilot_cycle_id: "v22-cycle-1",
        org_id: baseOrgId,
        service_id: "svc-1",
        sla_tier: "bad-tier",
      },
      storageMock: upsertPilotScopeService,
      missingTableMessage: "Pilot storage not ready: missing pilot_service_scope table",
    },
    {
      name: "service status",
      route: postServiceStatus,
      url: "http://localhost/api/v1/pilot/events/service-status",
      payload: {
        pilot_cycle_id: "v22-cycle-1",
        org_id: baseOrgId,
        service_id: "svc-1",
        checked_at: "2026-03-08T15:30:00.000Z",
        status_code: "available",
      },
      invalidPayload: {
        pilot_cycle_id: "v22-cycle-1",
        org_id: baseOrgId,
        service_id: "svc-1",
        checked_at: "2026-03-08T15:30:00.000Z",
        status_code: "bad-status",
      },
      storageMock: insertServiceOperationalStatusEvent,
      missingTableMessage: "Pilot storage not ready: missing service_operational_status_events table",
    },
    {
      name: "data decay audit",
      route: postDataDecayAudit,
      url: "http://localhost/api/v1/pilot/events/data-decay-audit",
      payload: {
        pilot_cycle_id: "v22-cycle-1",
        org_id: baseOrgId,
        service_id: "svc-1",
        audited_at: "2026-03-08T15:30:00.000Z",
        is_fatal: true,
        fatal_error_category: "wrong_or_disconnected_phone",
        verification_mode: "web_plus_call",
      },
      invalidPayload: {
        pilot_cycle_id: "v22-cycle-1",
        org_id: baseOrgId,
        service_id: "svc-1",
        audited_at: "2026-03-08T15:30:00.000Z",
        is_fatal: false,
        fatal_error_category: "wrong_or_disconnected_phone",
        verification_mode: "web_plus_call",
      },
      storageMock: insertPilotDataDecayAudit,
      missingTableMessage: "Pilot storage not ready: missing pilot_data_decay_audits table",
    },
    {
      name: "preference fit",
      route: postPreferenceFit,
      url: "http://localhost/api/v1/pilot/events/preference-fit",
      payload: {
        pilot_cycle_id: "v22-cycle-1",
        org_id: baseOrgId,
        cohort_label: "self_serve_mobile",
        recorded_at: "2026-03-08T15:30:00.000Z",
        preferred_via_careconnect: true,
      },
      invalidPayload: {
        pilot_cycle_id: "v22-cycle-1",
        org_id: baseOrgId,
        cohort_label: "",
        recorded_at: "2026-03-08T15:30:00.000Z",
        preferred_via_careconnect: true,
      },
      storageMock: insertPilotPreferenceFitEvent,
      missingTableMessage: "Pilot storage not ready: missing pilot_preference_fit_events table",
    },
  ] as const

  describe.each(cases)("$name route", (testCase) => {
    beforeEach(() => {
      vi.mocked(testCase.storageMock).mockResolvedValue({
        data: {} as never,
        error: null,
        missingTable: false,
      })
    })

    it("returns 401 when auth is missing", async () => {
      vi.mocked(requireAuthenticatedUser).mockResolvedValue({
        error: null,
        supabaseAuth: null,
        user: null,
      } as never)

      const response = await testCase.route(createRequest(testCase.url, testCase.payload))
      expect(response.status).toBe(401)
    })

    it("returns 403 when permission assertion fails", async () => {
      vi.mocked(assertPermission).mockRejectedValue(new AuthorizationError("Access denied"))

      const response = await testCase.route(createRequest(testCase.url, testCase.payload))
      const json = (await response.json()) as any

      expect(response.status).toBe(403)
      expect(json.error.message).toBe("Access denied")
    })

    it("returns 400 for invalid payloads", async () => {
      const response = await testCase.route(createRequest(testCase.url, testCase.invalidPayload))
      expect(response.status).toBe(400)
    })

    it("returns 400 when disallowed privacy fields are present", async () => {
      const response = await testCase.route(
        createRequest(testCase.url, {
          ...testCase.payload,
          query_text: "sensitive text",
        })
      )
      const json = (await response.json()) as any

      expect(response.status).toBe(400)
      expect(JSON.stringify(json.error.details)).toContain("query_text")
    })

    it("returns 501 when backing storage is not ready", async () => {
      vi.mocked(testCase.storageMock).mockResolvedValue({
        data: null,
        error: { message: "relation does not exist" },
        missingTable: true,
      })

      const response = await testCase.route(createRequest(testCase.url, testCase.payload))
      const json = (await response.json()) as any

      expect(response.status).toBe(501)
      expect(json.error.message).toBe(testCase.missingTableMessage)
    })

    it("returns 201 with no-store header on success", async () => {
      const response = await testCase.route(createRequest(testCase.url, testCase.payload))
      const json = (await response.json()) as any

      expect(response.status).toBe(201)
      expect(response.headers.get("cache-control")).toBe("no-store")
      expect(json.data).toEqual({ success: true })
    })
  })
})
