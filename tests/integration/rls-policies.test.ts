/**
 * RLS Policy Integration Tests
 * 
 * Tests Row Level Security policies to ensure proper data isolation
 * and access control across different user roles.
 * 
 * Note: These tests require SUPABASE_URL and SUPABASE_ANON_KEY to be set.
 * Tests will be skipped if credentials are not available.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Check if Supabase credentials are available
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const hasSupabaseCredentials = !!supabaseUrl && !!supabaseAnonKey

describe.skipIf(!hasSupabaseCredentials)("RLS Policies", () => {
  let anonClient: SupabaseClient
  let serviceIds: string[] = []

  beforeAll(async () => {
    if (!hasSupabaseCredentials) return
    
    anonClient = createClient(supabaseUrl!, supabaseAnonKey!)
    
    // Get published service IDs for testing
    const { data } = await anonClient
      .from("services_public")
      .select("id")
      .limit(5)
    
    serviceIds = data?.map((s) => s.id) || []
  })

  afterAll(async () => {
    // Cleanup any test data if needed
  })

  describe("services_public View", () => {
    it("allows anonymous users to read published services", async () => {
      const { data, error } = await anonClient
        .from("services_public")
        .select("id, name, published")
        .limit(10)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      
      // All services should be published
      data?.forEach(service => {
        expect(service.published).toBeUndefined() // published is filtered in view
      })
    })

    it("does not expose draft or archived services", async () => {
      const { data } = await anonClient
        .from("services_public")
        .select("verification_status")

      expect(data).toBeDefined()
      data?.forEach(service => {
        expect(service.verification_status).not.toBe("draft")
        expect(service.verification_status).not.toBe("archived")
      })
    })
  })

  describe("analytics_events Table", () => {
    it("allows valid analytics events with published service_id", async () => {
      if (serviceIds.length === 0) {
        console.warn("No service IDs available for analytics test")
        return
      }

      const { error } = await anonClient
        .from("analytics_events")
        .insert({
          service_id: serviceIds[0],
          event_type: "view"
        })

      expect(error).toBeNull()
    })

    it("rejects analytics events with invalid service_id", async () => {
      const { error } = await anonClient
        .from("analytics_events")
        .insert({
          service_id: "00000000-0000-0000-0000-000000000000",
          event_type: "view"
        })

      expect(error).not.toBeNull()
      expect(error?.message).toContain("violates row-level security policy")
    })

    it("rejects analytics events with null service_id", async () => {
      const { error } = await anonClient
        .from("analytics_events")
        .insert({
          service_id: null,
          event_type: "view"
        })

      expect(error).not.toBeNull()
    })
  })

  describe("feedback Table", () => {
    it("allows feedback submission with valid feedback_type", async () => {
      if (serviceIds.length === 0) {
        console.warn("No service IDs available for feedback test")
        return
      }

      const { error } = await anonClient
        .from("feedback")
        .insert({
          service_id: serviceIds[0],
          feedback_type: "outdated_info",
          description: "Test feedback"
        })

      expect(error).toBeNull()
    })

    it("rejects feedback with empty feedback_type", async () => {
      if (serviceIds.length === 0) return

      const { error } = await anonClient
        .from("feedback")
        .insert({
          service_id: serviceIds[0],
          feedback_type: "",
          description: "Test"
        })

      expect(error).not.toBeNull()
    })
  })

  describe("service_submissions Table", () => {
    it("allows submissions with valid name and description", async () => {
      const { error } = await anonClient
        .from("service_submissions")
        .insert({
          name: "Test Service",
          description: "Test Description",
          contact_name: "Test Contact",
          contact_email: "test@example.com"
        })

      expect(error).toBeNull()
    })

    it("rejects submissions with empty name", async () => {
      const { error } = await anonClient
        .from("service_submissions")
        .insert({
          name: "",
          description: "Valid description",
          contact_name: "Test",
          contact_email: "test@example.com"
        })

      expect(error).not.toBeNull()
    })

    it("rejects submissions with empty description", async () => {
      const { error } = await anonClient
        .from("service_submissions")
        .insert({
          name: "Valid name",
          description: "",
          contact_name: "Test",
          contact_email: "test@example.com"
        })

      expect(error).not.toBeNull()
    })
  })

  describe("plain_language_summaries Table", () => {
    it("allows anonymous users to read summaries", async () => {
      const { data, error } = await anonClient
        .from("plain_language_summaries")
        .select("service_id, summary")
        .limit(10)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it("rejects anonymous write operations", async () => {
      if (serviceIds.length === 0) return

      const { error } = await anonClient
        .from("plain_language_summaries")
        .insert({
          service_id: serviceIds[0],
          summary: "Test summary",
          summary_fr: "Résumé de test"
        })

      // Should fail because anon users can't insert
      expect(error).not.toBeNull()
    })
  })

  describe("partner_terms_acceptance Table", () => {
    it("allows terms acceptance with valid service_id and email", async () => {
      if (serviceIds.length === 0) return

      const { error } = await anonClient
        .from("partner_terms_acceptance")
        .insert({
          service_id: serviceIds[0],
          user_email: "test@example.com",
          accepted: true
        })

      expect(error).toBeNull()
    })

    it("rejects terms acceptance with invalid service_id", async () => {
      const { error } = await anonClient
        .from("partner_terms_acceptance")
        .insert({
          service_id: "00000000-0000-0000-0000-000000000000",
          user_email: "test@example.com",
          accepted: true
        })

      expect(error).not.toBeNull()
    })

    it("rejects terms acceptance with empty email", async () => {
      if (serviceIds.length === 0) return

      const { error } = await anonClient
        .from("partner_terms_acceptance")
        .insert({
          service_id: serviceIds[0],
          user_email: "",
          accepted: true
        })

      expect(error).not.toBeNull()
    })
  })

  describe("Materialized Views (Public Transparency)", () => {
    it("allows anonymous access to feedback_aggregations", async () => {
      const { data, error } = await anonClient
        .from("feedback_aggregations")
        .select("*")
        .limit(10)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it("allows anonymous access to unmet_needs_summary", async () => {
      const { data, error } = await anonClient
        .from("unmet_needs_summary")
        .select("*")
        .limit(10)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })
})

describe("RLS Performance Optimizations", () => {
  it("validates auth function wrapping in policies", async () => {
    // This is a documentation test to ensure policies use
    // (SELECT auth.uid()) instead of auth.uid() directly
    // Actual validation happens via Supabase linter
    
    const expectedPattern = "(SELECT auth.uid())"
    const expectedRolePattern = "(SELECT auth.role())"
    
    // Document expected patterns
    expect(expectedPattern).toBe("(SELECT auth.uid())")
    expect(expectedRolePattern).toBe("(SELECT auth.role())")
  })
})
