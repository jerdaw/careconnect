/**
 * Centralized test fixtures for User and Organization objects.
 * Following the roadmap recommendation for improved test maintainability.
 */

// User types
export interface User {
  id: string
  email: string
  name?: string
  role?: string
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: "owner" | "admin" | "editor" | "viewer"
  created_at: string
  updated_at: string
}

// Standard test user
export const mockUser: User = {
  id: "test-user-1",
  email: "test@example.com",
  name: "Test User",
  created_at: new Date("2026-01-01T00:00:00Z").toISOString(),
  updated_at: new Date("2026-01-01T00:00:00Z").toISOString(),
}

// Admin user
export const mockAdminUser: User = {
  id: "admin-user-1",
  email: "admin@example.com",
  name: "Admin User",
  role: "admin",
  created_at: new Date("2025-01-01T00:00:00Z").toISOString(),
  updated_at: new Date("2025-01-01T00:00:00Z").toISOString(),
}

// Partner organization owner
export const mockPartnerUser: User = {
  id: "partner-user-1",
  email: "partner@organization.com",
  name: "Partner User",
  created_at: new Date("2025-06-01T00:00:00Z").toISOString(),
  updated_at: new Date("2025-06-01T00:00:00Z").toISOString(),
}

// Anonymous/unauthenticated user representation
export const mockAnonymousUser: User = {
  id: "anonymous",
  email: "anonymous@example.com",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Standard test organization
export const mockOrganization: Organization = {
  id: "test-org-1",
  name: "Test Community Organization",
  email: "contact@testorg.ca",
  created_at: new Date("2025-01-01T00:00:00Z").toISOString(),
  updated_at: new Date("2026-01-01T00:00:00Z").toISOString(),
}

// Health services organization
export const mockHealthOrganization: Organization = {
  id: "test-org-health",
  name: "Kingston Community Health Centre",
  email: "info@kchc.ca",
  created_at: new Date("2024-01-01T00:00:00Z").toISOString(),
  updated_at: new Date("2026-01-01T00:00:00Z").toISOString(),
}

// Organization membership - Owner role
export const mockOwnerMembership: OrganizationMember = {
  id: "test-membership-owner",
  organization_id: "test-org-1",
  user_id: "test-user-1",
  role: "owner",
  created_at: new Date("2025-01-01T00:00:00Z").toISOString(),
  updated_at: new Date("2025-01-01T00:00:00Z").toISOString(),
}

// Organization membership - Admin role
export const mockAdminMembership: OrganizationMember = {
  id: "test-membership-admin",
  organization_id: "test-org-1",
  user_id: "test-user-2",
  role: "admin",
  created_at: new Date("2025-02-01T00:00:00Z").toISOString(),
  updated_at: new Date("2025-02-01T00:00:00Z").toISOString(),
}

// Organization membership - Editor role
export const mockEditorMembership: OrganizationMember = {
  id: "test-membership-editor",
  organization_id: "test-org-1",
  user_id: "test-user-3",
  role: "editor",
  created_at: new Date("2025-03-01T00:00:00Z").toISOString(),
  updated_at: new Date("2025-03-01T00:00:00Z").toISOString(),
}

// Organization membership - Viewer role
export const mockViewerMembership: OrganizationMember = {
  id: "test-membership-viewer",
  organization_id: "test-org-1",
  user_id: "test-user-4",
  role: "viewer",
  created_at: new Date("2025-04-01T00:00:00Z").toISOString(),
  updated_at: new Date("2025-04-01T00:00:00Z").toISOString(),
}

// Collection of memberships for permission testing
export const mockMemberships: OrganizationMember[] = [
  mockOwnerMembership,
  mockAdminMembership,
  mockEditorMembership,
  mockViewerMembership,
]

// Factory function for creating custom user fixtures
export const createMockUser = (overrides: Partial<User>): User => ({
  ...mockUser,
  id: `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  email: `test${Date.now()}@example.com`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Factory function for creating custom organization fixtures
export const createMockOrganization = (overrides: Partial<Organization>): Organization => ({
  ...mockOrganization,
  id: `test-org-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Factory function for creating custom membership fixtures
export const createMockMembership = (overrides: Partial<OrganizationMember>): OrganizationMember => ({
  ...mockOwnerMembership,
  id: `test-membership-${Date.now()}-${Math.random().toString(36).substring(7)}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// User with specific role for authorization tests
export const mockUserWithRole = (role: "owner" | "admin" | "editor" | "viewer"): User & { role: string } => ({
  ...mockUser,
  id: `test-user-${role}`,
  email: `${role}@example.com`,
  name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
  role,
})
