export type AgeGroup = "youth" | "adult" | "senior"
export type IdentityTag = "indigenous" | "newcomer" | "2slgbtqi+" | "veteran" | "disability"

export interface UserContext {
  ageGroup: AgeGroup | null
  identities: IdentityTag[]
  hasOptedIn: boolean
}

export interface EligibilityCriteria {
  minAge?: number
  maxAge?: number
  requiredIdentities?: IdentityTag[]
  excludedIdentities?: IdentityTag[]
}

export type EligibilityStatus = "eligible" | "ineligible" | "unknown"
