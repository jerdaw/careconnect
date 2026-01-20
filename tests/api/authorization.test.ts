import { describe, test, expect, vi, beforeEach } from 'vitest';
import { assertServiceOwnership, assertOrganizationMembership } from '../../lib/auth/authorization';
import { AuthorizationError } from '../../lib/api-utils';

// Mock Supabase Client
const mockSupabase = {
    auth: {
        getUser: vi.fn()
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
};

describe('Authorization Logic (Unit Specs)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('assertServiceOwnership', () => {
        test('should throw AuthorizationError if service not found', async () => {
            // Mock service lookup returning error
            mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
            
            await expect(assertServiceOwnership(mockSupabase as any, 'user-123', 'service-999'))
                .rejects.toThrow('Service not found');
        });

        test('should throw AuthorizationError if user is not a member of the owning org', async () => {
            // 1. Mock service lookup finding the service belonging to 'org-A'
            mockSupabase.single.mockResolvedValueOnce({ data: { org_id: 'org-A' }, error: null });

            // 2. Mock membership check returning no rows (not a member)
            // The function queries organization_members
            mockSupabase.from.mockImplementation((table) => {
                if (table === 'services') return mockSupabase;
                if (table === 'organization_members') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                    };
                }
                return mockSupabase;
            });

            await expect(assertServiceOwnership(mockSupabase as any, 'user-123', 'service-999'))
                .rejects.toThrow(AuthorizationError);
        });

        test('should succeed if user is an admin of the owning org', async () => {
            // 1. Service belongs to org-A
            mockSupabase.single.mockResolvedValueOnce({ data: { org_id: 'org-A' }, error: null });

            // 2. User is admin of org-A
            const mockMembersQuery = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
            };

            mockSupabase.from.mockImplementation((table) => {
                if (table === 'services') return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { org_id: 'org-A' }, error: null }) };
                if (table === 'organization_members') return mockMembersQuery;
                return mockSupabase;
            });

            await expect(assertServiceOwnership(mockSupabase as any, 'user-123', 'service-999'))
                .resolves.not.toThrow();
        });
    });

    describe('assertOrganizationMembership', () => {
        test('should succeed if user has required role', async () => {
             const mockMembersQuery = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { role: 'owner' }, error: null })
            };
            
            mockSupabase.from.mockReturnValue(mockMembersQuery);

            // Expecting failure because we need 'editor', but have 'viewer'
            await expect(assertOrganizationMembership(mockSupabase as any, 'user-123', 'org-A', ['owner', 'admin']))
                .resolves.not.toThrow();
        });

        test('should throw if user has insufficient role (viewer < editor)', async () => {
             const mockMembersQuery = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { role: 'viewer' }, error: null })
            };
            
            mockSupabase.from.mockReturnValue(mockMembersQuery);

            // Expecting failure because we need 'editor', but have 'viewer'
            await expect(assertOrganizationMembership(mockSupabase as any, 'user-123', 'org-A', ['editor']))
                .rejects.toThrow(AuthorizationError);
        });
    });
});
