import { describe, it, expect } from 'vitest';
import { searchServices } from '../lib/search';

describe('Search Algorithm', () => {

    it('should return Food Banks for "hungry"', () => {
        const results = searchServices('I am hungry');
        expect(results.length).toBeGreaterThan(0);
        const topResult = results[0];
        // Expecting one of the food banks
        expect(['ams-food-bank-queens', 'partners-in-mission-food-bank', 'marthas-table-kingston']).toContain(topResult.service.id);
        expect(topResult.score).toBeGreaterThan(0);
    });

    it('should return Crisis Lines for "kill myself"', () => {
        const results = searchServices('I want to kill myself');
        expect(results.length).toBeGreaterThan(0);
        // AMHS-KFLA should be top for suicide intent
        const crisisLine = results.find(r => r.service.id === 'amhs-kfla-crisis-line');
        expect(crisisLine).toBeDefined();
        // It shoudl be in the top 3
        const index = results.findIndex(r => r.service.id === 'amhs-kfla-crisis-line');
        expect(index).toBeLessThan(3);
    });

    it('should return Housing options for "sleep"', () => {
        const results = searchServices('Where can I sleep tonight');
        expect(results.length).toBeGreaterThan(0);
        const shelter = results.find(r => r.service.id === 'kingston-youth-shelter');
        expect(shelter).toBeDefined();
    });

    it('should return Queen\'s specific services for "queens"', () => {
        const results = searchServices('Queen\'s');
        expect(results.length).toBeGreaterThan(0);
        // Should find AMS Food Bank, QSWS, etc.
        const qsService = results.find(r => r.service.name.includes("Queen's"));
        expect(qsService).toBeDefined();
    });

    it('should return nothing for nonsense queries', () => {
        const results = searchServices('xyz123foobar');
        // It might match nothing, or very low score.
        // Our algorithm doesn't filter out low scores yet, but it should return empty if no tokens match.
        // However, if the nonsense contains no stop words and no matches, score is 0.
        // And searchServices filters score > 0.
        expect(results.length).toBe(0);
    });
});
