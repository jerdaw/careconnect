import { describe, it, expect } from 'vitest'
import { scoreServicesServer } from '@/lib/search/server-scoring'
import { ServicePublic } from '@/types/service-public'

describe('Server-Side Scoring', () => {
  // Mock basic service
  const baseService: ServicePublic = {
    id: 'test-1',
    name: 'Test Service',
    description: 'Test description',
    url: 'https://test.com',
    verification_status: 'L1', // basic
    last_verified: new Date().toISOString(), // fresh
    authority_tier: 'community',
    resource_indicators: {},
    coordinates: null,
    // Add required fields with nulls/defaults
    name_fr: null, description_fr: null, address: null, address_fr: null,
    phone: null, email: null, hours: null, fees: null, eligibility: null,
    eligibility_notes: null, eligibility_notes_fr: null,
    application_process: null, languages: null, bus_routes: null,
    accessibility: null, category: null, tags: null, scope: null,
    virtual_delivery: false, primary_phone_label: null, created_at: new Date().toISOString()
  }

  it('should rank higher authority tiers above lower ones', () => {
    const govService = { 
      ...baseService, 
      id: 'gov', 
      authority_tier: 'government', 
      name: 'Gov Service' 
    }
    const commService = { 
      ...baseService, 
      id: 'comm', 
      authority_tier: 'community', 
      name: 'Comm Service' 
    }

    const results = scoreServicesServer([commService, govService], 'test')
    
    expect(results[0]?.service.id).toBe('gov')
    expect(results[1]?.service.id).toBe('comm')
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score)
  })

  it('should boost services with complete data', () => {
    const completeService = {
      ...baseService,
      id: 'complete',
      phone: '555-1234',
      address: '123 Main St',
      hours: { open: '9am' }, // just needs to be present
      eligibility: 'Everyone',
      application_process: 'Call',
      accessibility: { wheelchair: true }
    }
    const sparseService = {
      ...baseService,
      id: 'sparse'
    }

    const results = scoreServicesServer([sparseService, completeService], 'test')
    
    expect(results[0]?.service.id).toBe('complete')
    expect(results[0]?.score).toBeGreaterThan(100)
    // Check match reasons contain completeness details
    expect(results[0]?.matchReasons.some(r => r.includes('Complete Data'))).toBe(true)
  })

  it('should apply proximity decay when location is provided', () => {
    const nearService = {
      ...baseService,
      id: 'near',
      coordinates: { lat: 44.2312, lng: -76.4860 } // Kingston
    }
    const farService = {
      ...baseService,
      id: 'far',
      coordinates: { lat: 45.4215, lng: -75.6972 } // Ottawa (~150km away)
    }

    const location = { lat: 44.2334, lng: -76.5000 } // Nearby Kingston location

    const results = scoreServicesServer(
      [farService, nearService], 
      'test', 
      { location }
    )

    expect(results[0]?.service.id).toBe('near')
    expect(results[1]?.service.id).toBe('far')
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score)
  })

  it('should not decay virtual services', () => {
    const virtualService = {
      ...baseService,
      id: 'virtual',
      coordinates: { lat: 45.4215, lng: -75.6972 }, // Far away
      virtual_delivery: true
    }
    const physicalFarService = {
      ...baseService,
      id: 'physical_far',
      coordinates: { lat: 45.4215, lng: -75.6972 }, // Same location
      virtual_delivery: false
    }

    const location = { lat: 44.2312, lng: -76.4860 } // Kingston

    const results = scoreServicesServer(
      [physicalFarService, virtualService], 
      'test', 
      { location }
    )

    expect(results[0]?.service.id).toBe('virtual')
    // Virtual service should preserve base score (approx 100 or boosted by freshness/verification)
    // Physical far service should be penalized
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score)
  })

  it('should apply intent targeting boost', () => {
    const intentService = {
      ...baseService,
      id: 'intent',
      synthetic_queries: ['help with depression', 'low mood']
    }
    const otherService = {
      ...baseService,
      id: 'other'
    }

    const results = scoreServicesServer(
      [otherService, intentService], 
      'depression'
    )

    expect(results[0]?.service.id).toBe('intent')
    expect(results[0]?.matchReasons.some(r => r.includes('Intent'))).toBe(true)
  })

  it('should apply resource capacity boost', () => {
    const largeService = {
      ...baseService,
      id: 'large',
      resource_indicators: { staff_size: 'large' as const, annual_budget: 'large' as const }
    }
    const smallService = {
      ...baseService,
      id: 'small',
      resource_indicators: { staff_size: 'small' as const }
    }

    const results = scoreServicesServer(
      [smallService, largeService], 
      'test'
    )

    expect(results[0]?.service.id).toBe('large')
    expect(results[0]?.matchReasons.some(r => r.includes('Resource'))).toBe(true)
  })
})
