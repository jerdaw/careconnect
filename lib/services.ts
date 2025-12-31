import { supabase } from './supabase';
import { logger } from './logger';
import { Service } from '@/types/service';

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

/**
 * Fetches a service by ID and maps it to the Service type.
 */
export async function getServiceById(id: string): Promise<Service | null> {
    try {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // Not found code
                logger.error('Error fetching service by ID', error, { id });
            }
            return null;
        }

        if (!data) return null;

        // Map database fields to Service type
        const service: Service = {
            ...data,
            embedding: typeof data.embedding === 'string' ? JSON.parse(data.embedding) : data.embedding,
            identity_tags: typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags,
            intent_category: data.category,
            verification_level: data.verification_status,
            // Ensure optional fields are handled if missing in DB but required in type (adjust as needed)
        } as unknown as Service;

        return service;
    } catch (error) {
        logger.error('Unexpected error in getServiceById', error as Error, { id });
        return null;
    }
}
/**
 * Updates an existing service record.
 */
export async function updateService(id: string, updates: Partial<Service>) {
    try {
        const { error } = await supabase
            .from('services')
            .update({
                name: updates.name,
                description: updates.description,
                address: updates.address,
                phone: updates.phone,
                url: updates.url,
                email: updates.email,
                hours: typeof updates.hours === 'object' ? JSON.stringify(updates.hours) : updates.hours,
                fees: updates.fees,
                eligibility: updates.eligibility_notes, // Note: DB uses 'eligibility' for 'eligibility_notes' in JSON mappings sometimes
                application_process: updates.application_process,
                category: updates.intent_category,
                tags: updates.identity_tags,
                last_verified: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            logger.error('Failed to update service', error, { id, updates });
            return { error: error.message };
        }

        return { success: true };
    } catch (err) {
        logger.error('Unexpected error in updateService', err as Error, { id, updates });
        return { error: 'An unexpected error occurred' };
    }
}
