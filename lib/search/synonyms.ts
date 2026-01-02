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

  // Basic Needs - Housing
  housing: ["shelter", "homeless", "apartment", "rent", "eviction", "logement", "abri", "itinerance"],
  shelter: ["bed", "sleep", "homeless", "emergency", "refuge"],
  homeless: ["shelter", "street", "encampment", "couch surfing", "sans-abri"],
  rent: ["housing", "landlord", "tenant", "lease", "eviction", "loyer"],

  // Health
  health: ["doctor", "nurse", "hospital", "clinic", "medical", "santé", "médecin"],
  doctor: ["physician", "md", "gp", "practitioner", "docteur"],
  dental: ["teeth", "tooth", "dentist", "cavity", "pain", "dentaire"],
  therapy: ["counseling", "psychologist", "psychiatrist", "mental health", "talk", "thérapie"],

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
  disability: ["odsp", "disabled", "accessibility", "handicap", "invalidité"],
  income: ["money", "cash", "financial", "low income", "revenu", "argent"],

  // Identities (enhanced)
  indigenous: ["aboriginal", "first nations", "metis", "inuit", "native", "autochtone", "premières nations"],
  lgbt: ["gay", "queer", "trans", "transgender", "2slgbtqi+", "pride", "lgbtq", "fierté"],
  newcomer: ["immigrant", "refugee", "new to canada", "immigrant", "réfugié", "nouvel arrivant"],
  senior: ["elderly", "old", "aged", "retirement", "65+", "aîné", "personne âgée"],
  veteran: ["military", "forces", "army", "vétéran", "militaire"],

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
