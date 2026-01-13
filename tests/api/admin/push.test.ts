/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/admin/push/route';
import { NextRequest } from 'next/server';

// Mock env
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-key',
    NEXT_PUBLIC_ONESIGNAL_APP_ID: 'test-app-id',
    ONESIGNAL_REST_API_KEY: 'test-rest-key'
  }
}));

// Mock Supabase Auth
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin1' } } })
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'audit123' }, error: null })
        }))
      }))
    }))
  }))
}));

// Mock Fetch for OneSignal
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ id: 'push123' })
});
global.fetch = mockFetch;

describe('Push API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send push notification and return success', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/push', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test push',
        message: 'Body of push',
        type: 'service_update'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json() as { success: boolean; notificationId: string };
    expect(data.success).toBe(true);
    expect(data.notificationId).toBe('push123');
    expect(mockFetch).toHaveBeenCalledWith("https://onesignal.com/api/v1/notifications", expect.anything());
  });

  it('should return 400 for missing fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/push', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test push'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
