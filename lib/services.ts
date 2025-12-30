import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Claims a service for the current authenticated user's organization.
 * 
 * @param serviceId - The ID of the service to claim
 * @param orgId - The ID of the organization claiming the service
 */
export async function claimService(serviceId: string, orgId: string) {
    try {
        const { error } = await supabase
            .from('services')
            .update({
                org_id: orgId,
                verification_status: 'L1', // Elevate to L1 upon claiming
                last_verified: new Date().toISOString()
            })
            .eq('id', serviceId)
            .is('org_id', null); // Atomic check to ensure it's not already claimed

        if (error) {
            logger.error('Failed to claim service', error, { serviceId, orgId });
            return { error: error.message };
        }

        return { success: true };
    } catch (err) {
        logger.error('Unexpected error in claimService', err as Error, { serviceId, orgId });
        return { error: 'An unexpected error occurred' };
    }
}
