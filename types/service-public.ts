import { ResourceIndicators } from "./service"

export interface ServicePublic {
  id: string
  name: string
  name_fr: string | null
  description: string | null
  description_fr: string | null
  address: string | null
  address_fr: string | null
  phone: string | null
  url: string | null
  email: string | null
   
  hours: any // JSON object from DB
  fees: string | null
  eligibility: string | null
  eligibility_notes: string | null
  eligibility_notes_fr: string | null
  application_process: string | null
  languages: string[] | null
  bus_routes: string[] | null
   
  accessibility: Record<string, boolean> | any | null
  last_verified: string | null
  verification_status: string | null
  category: string | null
   
  tags: any // JSON array
  // v11.0: Scope expansion fields
  scope: string | null
  virtual_delivery: boolean | null
  primary_phone_label: string | null
  created_at: string
  // v16.0: Search ranking fields
  synthetic_queries?: string[] | null
  synthetic_queries_fr?: string[] | null
  authority_tier?: string | null
  resource_indicators?: ResourceIndicators | null // JSON object
  coordinates?: { lat: number; lng: number } | null
}

