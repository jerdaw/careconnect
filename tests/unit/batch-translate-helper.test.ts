
import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'

import { generateTranslationPrompts, parseTranslationResponse, validateTranslationBatch } from '../../scripts/batch-translate-helper'

// Mock fs to avoid file system operations
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(),
  }
}))

describe('Translation Helper Script', () => {
  const mockBatch = {
    services: [
      { id: '1', access_script: 'Call us.' },
      { id: '2', access_script: 'Visit website.' }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockBatch))
  })

  describe('generateTranslationPrompts', () => {
    it('should generate a markdown prompt with service details', () => {
      const prompt = generateTranslationPrompts('mock-input.json')
      
      expect(prompt).toContain('# French Translation Request')
      expect(prompt).toContain('## Service 1 (ID: 1)')
      expect(prompt).toContain('**English:**\nCall us.')
      expect(prompt).toContain('## Service 2 (ID: 2)')
      expect(prompt).toContain('**English:**\nVisit website.')
    })
  })

  describe('parseTranslationResponse', () => {
    it('should parse valid AI response into batch', () => {
      const mockResponse = `
Here are the translations:

## Service 1 (ID: 1)
**French Translation:**
Appelez-nous.

---

## Service 2 (ID: 2)
**French Translation:**
Visitez le site web.
`
      const result = parseTranslationResponse('mock-input.json', mockResponse)
      
      expect(result.services).toHaveLength(2)
      expect(result.services[0]!.access_script_fr).toBe('Appelez-nous.')
      expect(result.services[1]!.access_script_fr).toBe('Visitez le site web.')
    })

    it('should handle empty or missing translations gracefully', () => {
      const mockResponse = `
## Service 1 (ID: 1)
**French Translation:**
Appelez-nous.
`
      const result = parseTranslationResponse('mock-input.json', mockResponse)
      
      expect(result.services[0]!.access_script_fr).toBe('Appelez-nous.')
      expect(result.services[1]!.access_script_fr).toBe('') // Missing
    })
  })

  describe('validateTranslationBatch', () => {
    it('should pass valid batch', () => {
      const validBatch = {
        services: [
          { id: '1', access_script: 'Call.', access_script_fr: 'Appelez maintenant.' }
        ]
      }
      const result = validateTranslationBatch(validBatch)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail if translation is missing', () => {
      const invalidBatch = {
        services: [
          { id: '1', access_script: 'Call.', access_script_fr: '' }
        ]
      }
      const result = validateTranslationBatch(invalidBatch)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Service 1 (1): Missing French translation')
    })

    it('should fail if translation is too short', () => {
      const invalidBatch = {
        services: [
          { id: '1', access_script: 'Call.', access_script_fr: 'Oui.' }
        ]
      }
      const result = validateTranslationBatch(invalidBatch)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Service 1 (1): French translation too short')
    })

    it('should warn if untranslated English words found', () => {
       const warningBatch = {
        services: [
          { id: '1', access_script: 'Call.', access_script_fr: 'Envoyez un email svp.' }
        ]
      }
      const result = validateTranslationBatch(warningBatch)
      // Should still be valid but have errors/warnings in list
      expect(result.valid).toBe(false) 
      expect(result.errors[0]).toContain('WARNING - May contain untranslated English words')
    })
  })
})
