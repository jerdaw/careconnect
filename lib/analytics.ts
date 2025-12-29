import { supabase } from './supabase';

export type EventType = 'view_detail' | 'click_website' | 'click_call';

/**
 * Tracks a privacy-preserving analytic event.
 * No user identifiers or IPs are sent to Supabase by this function.
 */
export async function trackEvent(serviceId: string, eventType: EventType) {
    try {
        await supabase.from('analytics_events').insert({
            service_id: serviceId,
            event_type: eventType,
        });
    } catch (error) {
        // Analytics should fail silently to not disrupt user experience
        console.warn('Analytics error:', error);
    }
}

export type ServiceStats = {
    serviceId: string;
    totalViews: number;
    recentViews: number;
    change?: number;
};

/**
 * Fetches aggregated stats for a list of services.
 * Currently does client-side aggregation suitable for small-medium scale.
 * For larger scale, replace with an RPC or materialized view.
 */
export async function getAnalyticsForServices(serviceIds: string[]): Promise<Record<string, ServiceStats>> {
    if (serviceIds.length === 0) return {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data, error } = await supabase
        .from('analytics_events')
        .select('service_id, created_at')
        .in('service_id', serviceIds);

    if (error || !data) {
        console.error('Error fetching analytics:', error);
        return {};
    }

    const stats: Record<string, ServiceStats> = {};
    const previousPeriodStats: Record<string, number> = {};

    // Initialize default stats
    serviceIds.forEach(id => {
        stats[id] = { serviceId: id, totalViews: 0, recentViews: 0 };
        previousPeriodStats[id] = 0;
    });

    // Aggregate
    data.forEach(event => {
        const eventDate = new Date(event.created_at);
        if (stats[event.service_id]) {
            stats[event.service_id]!.totalViews++;

            if (eventDate > thirtyDaysAgo) {
                stats[event.service_id]!.recentViews++;
            } else if (eventDate > sixtyDaysAgo && previousPeriodStats[event.service_id] !== undefined) {
                previousPeriodStats[event.service_id]!++;
            }
        }
    });

    // Calculate Change
    Object.keys(stats).forEach(id => {
        const recent = stats[id]!.recentViews;
        const previous = previousPeriodStats[id] || 0;

        if (previous > 0) {
            stats[id]!.change = Math.round(((recent - previous) / previous) * 100);
        } else if (recent > 0) {
            stats[id]!.change = 100; // Growth from zero
        } else {
            stats[id]!.change = 0; // Usage remained zero
        }
    });

    return stats;
}
