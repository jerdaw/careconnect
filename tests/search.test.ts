import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { searchServices } from '../lib/search';

describe('Search Algorithm', () => {

    // Mock fetch to prevent API calls and Invalid URL errors in Node environment
    const originalFetch = global.fetch;
    beforeAll(() => {
        global.fetch = vi.fn(() => Promise.resolve({
            ok: false, // Simulate failure to default to keyword search
            json: () => Promise.resolve({})
        } as Response));
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('should return Food Banks for "hungry"', async () => {
        const results = await searchServices('I am hungry');
        expect(results.length).toBeGreaterThan(0);
        const topResult = results[0];
        // Expecting one of the food banks
        // Note: The ID might be undefined if we don't access it correctly or if types match.
        // But assuming searchServices returns SearchResult[]
        if (!topResult) throw new Error('No result found');
        expect(['ams-food-bank-queens', 'partners-in-mission-food-bank', 'marthas-table-kingston', 'lunch-by-george']).toContain(topResult.service.id);
        expect(topResult.score).toBeGreaterThan(0);
    });

    it('should return Crisis Lines for "kill myself"', async () => {
        const results = await searchServices('I want to kill myself');
        expect(results.length).toBeGreaterThan(0);
        // AMHS-KFLA should be top for suicide intent
        const crisisLine = results.find(r => r.service.id === 'amhs-kfla-crisis-line');
        expect(crisisLine).toBeDefined();
        // It shoudl be in the top 3
        const index = results.findIndex(r => r.service.id === 'amhs-kfla-crisis-line');
        expect(index).toBeLessThan(3);
    });

    it('should return Housing options for "sleep"', async () => {
        const results = await searchServices('Where can I sleep tonight');
        expect(results.length).toBeGreaterThan(0);
        const shelter = results.find(r => r.service.id === 'kingston-youth-shelter');
        expect(shelter).toBeDefined();
    });

    it('should return Queen\'s specific services for "queens"', async () => {
        const results = await searchServices('Queen\'s');
        expect(results.length).toBeGreaterThan(0);
        // Should find AMS Food Bank, QSWS, etc.
        const qsService = results.find(r => r.service.name.includes("Queen's"));
        expect(qsService).toBeDefined();
    });

    it('should return nothing for nonsense queries', async () => {
        const results = await searchServices('xyz123foobar');
        expect(results.length).toBe(0);
    });
});
