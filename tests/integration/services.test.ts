import { describe, it, expect, vi, beforeEach } from 'vitest';
import { claimService } from '../../lib/services';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Mock Logger to avoid noise
vi.mock('../../lib/logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe('claimService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully claim an unclaimed service', async () => {
        const mockIs = vi.fn().mockResolvedValue({ error: null });
        const mockEq = vi.fn().mockReturnValue({ is: mockIs });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

        (supabase.from as any).mockReturnValue({
            update: mockUpdate,
        });

        const result = await claimService('service-123', 'org-456');

        expect(result.success).toBe(true);
        expect(supabase.from).toHaveBeenCalledWith('services');
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
            org_id: 'org-456',
            verification_status: 'L1'
        }));
        expect(mockEq).toHaveBeenCalledWith('id', 'service-123');
        expect(mockIs).toHaveBeenCalledWith('org_id', null);
    });

    it('should return error if update fails', async () => {
        const mockIs = vi.fn().mockResolvedValue({ error: { message: 'Database error' } });
        const mockEq = vi.fn().mockReturnValue({ is: mockIs });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

        (supabase.from as any).mockReturnValue({
            update: mockUpdate,
        });

        const result = await claimService('service-123', 'org-456');

        expect(result.error).toBe('Database error');
    });

    it('should handle unexpected exceptions', async () => {
        (supabase.from as any).mockImplementation(() => {
            throw new Error('Explosion');
        });

        const result = await claimService('service-123', 'org-456');

        expect(result.error).toBe('An unexpected error occurred');
    });
});
