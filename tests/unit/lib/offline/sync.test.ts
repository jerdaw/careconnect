import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncOfflineData } from '@/lib/offline/sync';
import * as db from '@/lib/offline/db';

// Mock DB
vi.mock('@/lib/offline/db', () => ({
  getMeta: vi.fn(),
  setMeta: vi.fn(),
  saveAllServices: vi.fn(),
  saveAllEmbeddings: vi.fn(),
  getAllServices: vi.fn(),
}));

// Mock Fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console log/error to keep test output clean
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Offline Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip sync if recent and local data exists', async () => {
    const recentDate = new Date().toISOString();
    vi.mocked(db.getMeta).mockResolvedValue(recentDate);
    vi.mocked(db.getAllServices).mockResolvedValue([{ id: '1' }] as any);

    const result = await syncOfflineData();

    expect(result.status).toBe('up-to-date');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should perform full sync if no local data exists', async () => {
    vi.mocked(db.getMeta).mockResolvedValue(undefined);
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        version: 'v1',
        count: 1,
        services: [{ id: 's1' }],
        embeddings: [{ id: 's1', embedding: [0.1] }]
      }),
    });

    const result = await syncOfflineData();

    expect(result.status).toBe('synced');
    expect(result.count).toBe(1);
    expect(db.saveAllServices).toHaveBeenCalled();
    expect(db.saveAllEmbeddings).toHaveBeenCalled();
    expect(db.setMeta).toHaveBeenCalledWith('lastSync', expect.any(String));
  });

  it('should handle 304 Not Modified', async () => {
    vi.mocked(db.getMeta).mockResolvedValue('2026-01-01');
    mockFetch.mockResolvedValue({
      ok: true,
      status: 304,
    });

    const result = await syncOfflineData(true); // force

    expect(result.status).toBe('up-to-date');
    expect(db.saveAllServices).not.toHaveBeenCalled();
    expect(db.setMeta).toHaveBeenCalledWith('lastSync', expect.any(String));
  });

  it('should retry on failure', async () => {
    vi.mocked(db.getMeta).mockResolvedValue(undefined);
    
    // First two fail, third succeeds
    mockFetch
      .mockRejectedValueOnce(new Error('Network Fail'))
      .mockRejectedValueOnce(new Error('Network Fail'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          version: 'v1',
          count: 1,
          services: [{ id: 's1' }],
          embeddings: []
        }),
      });

    // Mock setTimeout to resolve immediately
    vi.stubGlobal('setTimeout', vi.fn((cb) => cb()));

    const result = await syncOfflineData();

    expect(result.status).toBe('synced');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should return error status after max retries', async () => {
    vi.mocked(db.getMeta).mockResolvedValue(undefined);
    mockFetch.mockRejectedValue(new Error('Permanent Failure'));
    
    vi.stubGlobal('setTimeout', vi.fn((cb) => cb()));

    const result = await syncOfflineData();

    expect(result.status).toBe('error');
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});
