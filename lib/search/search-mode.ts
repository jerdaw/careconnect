import { ServicePublic } from "@/types/service-public"
import { SearchRequest } from "@/lib/schemas/search"
import { Service } from "@/types/service"
import { mapServicePublicToService } from "@/lib/search/map-service-public"

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

  const json = (await res.json()) as { data: ServicePublic[] }
  const publicServices = json.data

  return publicServices.map((service) => mapServicePublicToService(service))
}
