/**
 * Dictionary of common synonyms and related terms for social services.
 * Used to expand user queries to improve keyword matching recall.
 */
export const SYNONYMS: Record<string, string[]> = {
  // Basic Needs - Food
  food: ["hungry", "meal", "groceries", "starving", "eat", "pantry", "hamper", "nourriture", "manger"],
  hungry: ["food", "meal", "groceries", "starving", "faim"],
  groceries: ["food", "pantry", "supermarket", "market", "épicerie"],
  meal: ["dinner", "lunch", "breakfast", "supper", "repas"],

  // Basic Needs - Housing (expanded)
  housing: ["shelter", "homeless", "apartment", "rent", "eviction", "logement", "abri", "itinerance"],
  shelter: ["bed", "sleep", "homeless", "emergency", "refuge"],
  homeless: ["shelter", "street", "encampment", "couch surfing", "sans-abri"],
  unhoused: ["homeless", "shelter", "street", "rough sleeping", "sans-abri"],
  rent: ["housing", "landlord", "tenant", "lease", "eviction", "loyer"],
  eviction: ["evicted", "landlord", "tenant rights", "housing tribunal", "expulsion"],

  // Health
  health: ["doctor", "nurse", "hospital", "clinic", "medical", "santé", "médecin"],
  healthcare: ["health", "doctor", "nurse", "clinic", "medical", "santé", "médecin"],
  medical: ["health", "healthcare", "doctor", "nurse", "clinic", "santé", "médecin"],
  doctor: ["physician", "md", "gp", "practitioner", "docteur"],
  dental: ["teeth", "tooth", "dentist", "cavity", "pain", "dentaire"],
  therapy: ["counseling", "psychologist", "psychiatrist", "mental health", "talk", "thérapie"],

  // Sexual Health
  std: ["sti", "sexual health", "sexually transmitted", "infection", "testing"],
  sti: ["std", "sexual health", "sexually transmitted", "infection", "testing"],

  // Crisis
  crisis: ["emergency", "danger", "urgent", "suicide", "help", "911", "crise", "urgence"],
  suicide: ["kill", "die", "end life", "hurt", "suicidio"],
  abuse: ["violence", "assault", "harm", "partner", "domestic", "abus", "violence"],

  // Legal & Employment
  legal: ["lawyer", "law", "court", "justice", "rights", "avocat", "juridique"],
  job: ["work", "employment", "career", "hire", "wage", "travail", "emploi"],
  money: ["cash", "finance", "poverty", "low income", "welfare", "argent", "revenu"],

  // Mental Health (expanded)
  anxiety: ["anxious", "panic", "worried", "nervous", "stress", "anxiété"],
  depression: ["depressed", "sad", "hopeless", "suicidal", "dépression", "triste"],
  counseling: ["therapy", "therapist", "counsellor", "psychologist", "conseil"],
  addiction: ["substance", "drugs", "alcohol", "recovery", "rehab", "dépendance"],

  // Youth Services (expanded)
  teen: ["teenager", "adolescent", "youth", "young", "ado", "jeune"],
  child: ["children", "kid", "kids", "minor", "enfant", "enfants"],
  student: ["school", "university", "college", "études", "étudiant"],

  // Financial (expanded)
  welfare: ["ow", "ontario works", "social assistance", "aide sociale"],
  ow: ["ontario works", "welfare", "social assistance"],
  odsp: ["ontario disability", "disability support", "disabled"],
  disability: ["odsp", "disabled", "accessibility", "handicap", "invalidité"],
  income: ["money", "cash", "financial", "low income", "revenu", "argent"],
  cerb: ["ei", "employment insurance", "income support"],
  ei: ["employment insurance", "cerb", "benefits", "assurance-emploi"],
  tax: ["income tax", "tax clinic", "free tax", "impôts"],

  // Practical Needs
  id: ["identification", "birth certificate", "ohip", "health card", "sin card"],
  transportation: ["bus", "transit", "ride", "accessible transit", "transport"],
  childcare: ["daycare", "babysitting", "child care", "garderie"],
  clothing: ["clothes", "winter coat", "donation", "vêtements"],

  // Identities (enhanced)
  indigenous: ["aboriginal", "first nations", "metis", "inuit", "native", "autochtone", "premières nations"],
  lgbt: ["gay", "queer", "trans", "transgender", "2slgbtqi+", "pride", "lgbtq", "fierté"],
  newcomer: ["immigrant", "refugee", "new to canada", "immigrant", "réfugié", "nouvel arrivant"],
  senior: ["elderly", "old", "aged", "retirement", "65+", "aîné", "personne âgée"],
  veteran: ["military", "forces", "army", "vétéran", "militaire"],

  // Seniors (expanded)
  "home care": ["caregiver", "personal support worker", "psw", "soins à domicile"],
  "assisted living": ["nursing home", "long-term care", "retirement home", "résidence"],

  // Common terms
  free: ["no cost", "no charge", "gratuit", "charitable"],
  appointment: ["book", "schedule", "walk-in", "rendez-vous"],
  interpreter: ["translation", "language help", "interprète"],

  // Common misspellings / abbreviations
  er: ["emergency", "hospital", "urgence"],
  doc: ["doctor", "physician", "médecin"],
  apt: ["apartment", "housing", "appartement"],
}

/**
 * Expands a list of query tokens with known synonyms.
 * Returns a new list of unique tokens.
 */
export function expandQuery(tokens: string[]): string[] {
  const expanded = new Set(tokens.map((t) => t.toLowerCase()))

  tokens.forEach((token) => {
    const lowerToken = token.toLowerCase()

    // Check exact match
    if (SYNONYMS[lowerToken]) {
      SYNONYMS[lowerToken].forEach((s) => expanded.add(s))
    }

    // Optional: Check partial matches or stemmed keys?
    // For now, keep it simple/exact to avoid noise.
  })

  return Array.from(expanded)
}
