
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/v1/search/services/route'
import { ServicePublic } from '@/types/service-public'
import { supabase } from '@/lib/supabase'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('Search API (Hybrid Scoring)', () => {
  const mockSelect = vi.fn()
  const mockOr = vi.fn()
  const mockEq = vi.fn()
  const mockLimit = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup chainable mock
    // from -> select -> or -> eq -> limit -> { data, error }
    // Note: Hybrid scoring removes DB-side ordering, simply fetches candidates
    
    mockLimit.mockResolvedValue({ 
      data: [], 
      error: null 
    })

    mockEq.mockReturnValue({ limit: mockLimit })
    mockOr.mockReturnValue({ eq: mockEq, limit: mockLimit })
    mockSelect.mockReturnValue({ or: mockOr, eq: mockEq, limit: mockLimit })
    
    const mockChain = { select: mockSelect }
    vi.mocked(supabase.from).mockReturnValue(mockChain as any)
  })

  const createRequest = (body: Record<string, unknown>) => {
    return new NextRequest('http://localhost:3000/api/v1/search/services', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // Helper to create mock service data
  const createMockService = (id: string, overrides: Partial<ServicePublic> = {}): ServicePublic => ({
    id,
    name: `Service ${id}`,
    description: 'Description',
    verification_status: 'L1',
    last_verified: new Date().toISOString(),
    authority_tier: 'community',
    // Default empty fields to avoid TS issues if types are strict
    phone: null, address: null, hours: null,
    scope: 'kingston', virtual_delivery: false,
    created_at: new Date().toISOString(),
    ...overrides
  } as ServicePublic)

  it('should rank higher authority tiers above lower ones', async () => {
    const govService = createMockService('gov', { authority_tier: 'government' })
    const commService = createMockService('comm', { authority_tier: 'community' })

    // Return in reverse order from DB to prove scoring re-orders them
    mockLimit.mockResolvedValue({
      data: [commService, govService],
      error: null
    })

    const req = createRequest({ query: 'test', locale: 'en' })
    const res = await POST(req)
    const json = (await res.json()) as { data: { id: string }[] }

    expect(res.status).toBe(200)
    expect(json.data?.[0]?.id).toBe('gov')
    expect(json.data?.[1]?.id).toBe('comm')
  })

  it('should boost services with complete data', async () => {
    const completeService = createMockService('complete', { 
      phone: '555-1234', address: '123 Main' 
    })
    const sparseService = createMockService('sparse')

    mockLimit.mockResolvedValue({
      data: [sparseService, completeService],
      error: null
    })

    const req = createRequest({ query: 'test', locale: 'en' })
    const res = await POST(req)
    const json = (await res.json()) as { data: { id: string }[] }

    expect(json.data?.[0]?.id).toBe('complete')
  })

  it('should correct rank by proximity if location provided (Kingston vs Ottawa)', async () => {
    const kingstonService = createMockService('kingston', { 
      coordinates: { lat: 44.2312, lng: -76.4860 } 
    })
    const ottawaService = createMockService('ottawa', { 
      coordinates: { lat: 45.4215, lng: -75.6972 } 
    })

    mockLimit.mockResolvedValue({
      data: [ottawaService, kingstonService],
      error: null
    })

    // Search from Kingston
    const req = createRequest({ 
      query: 'test', 
      locale: 'en',
      location: { lat: 44.2334, lng: -76.5000 }
    })
    
    const res = await POST(req)
    const json = (await res.json()) as { data: { id: string }[] }

    expect(json.data?.[0]?.id).toBe('kingston')
  })

  it('should paginate results correctly', async () => {
    // Return 5 services
    const services = Array.from({ length: 5 }, (_, i) => createMockService(`s${i}`))
    
    mockLimit.mockResolvedValue({
      data: services,
      error: null
    })

    // Request page 2 (limit 2, offset 2) -> should return s2, s3 (0-indexed: 2,3)
    const req = createRequest({ 
      query: 'test', 
      locale: 'en',
      options: { limit: 2, offset: 2 }
    })
    
    const res = await POST(req)
    const json = (await res.json()) as { data: { id: string }[], meta: { limit: number, offset: number, total: number } }

    expect(json.data.length).toBe(2)
    expect(json.meta.limit).toBe(2)
    expect(json.meta.offset).toBe(2)
    // Total should reflect the fetched candidate count (5) in this implementation
    expect(json.meta.total).toBe(5) 
  })
})
