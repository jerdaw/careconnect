
import { ServicePublic } from "@/types/service-public"
import { SearchRequest } from "@/lib/schemas/search"
import { Service } from "@/types/service"

export type SearchMode = "local" | "server"

export function getSearchMode(): SearchMode {
  return (process.env.NEXT_PUBLIC_SEARCH_MODE as SearchMode) || "local"
}

export async function serverSearch(params: SearchRequest): Promise<Service[]> {
  const res = await fetch("/api/v1/search/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`Server search failed: ${res.statusText}`)
  }

  const json = await res.json() as { data: ServicePublic[] }
  const publicServices = json.data

  // Map ServicePublic (View/DB Schema) to Service (App Schema)
  return publicServices.map(s => ({
    ...s,
    // Map mismatched fields (enum string -> enum type requires cast)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    intent_category: s.category as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verification_level: s.verification_status as any,
    identity_tags: s.tags || [],
    
    // Ensure required fields for Service type that might be missing or named differently
    // ServicePublic 'hours' is JSON, Service 'hours' is ServiceHours (compatible)
    // ServicePublic 'accessibility' is JSON, Service 'accessibility' is Record<string, boolean> (compatible)
    synthetic_queries: [], // Not exposed in public view
    provenance: { 
      verified_by: "system", 
      verified_at: s.last_verified || new Date().toISOString(), 
      evidence_url: "", 
      method: "db_view" 
    },
    
    // Remove old keys if strictness required, but Spreading s keeps them (which is fine, extra keys ignored)
  } as unknown as Service))
}
