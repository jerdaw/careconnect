
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hours: any // JSON object from DB
  fees: string | null
  eligibility: string | null
  application_process: string | null
  languages: string[] | null
  bus_routes: string[] | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessibility: Record<string, boolean> | any | null
  last_verified: string | null
  verification_status: string | null
  category: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tags: any // JSON array
  created_at: string
}
