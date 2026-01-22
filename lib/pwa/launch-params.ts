import { IntentCategory } from "@/types/service"

type SearchParamsLike = {
  get(name: string): string | null
}

export type PwaLaunchParams = {
  query: string | null
  category: IntentCategory | null
  openNow: boolean | null
}

function parseBooleanParam(value: string | null): boolean | null {
  if (value === null) return null
  const normalized = value.trim().toLowerCase()
  if (normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on") return true
  if (normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") return false
  return null
}

function parseIntentCategory(value: string | null): IntentCategory | null {
  if (value === null) return null

  const normalized = value.trim().toLowerCase()
  for (const category of Object.values(IntentCategory)) {
    if (category.toLowerCase() === normalized) return category
  }

  return null
}

export function parsePwaLaunchParams(searchParams: SearchParamsLike): PwaLaunchParams {
  const queryRaw = searchParams.get("q")
  const query = queryRaw === null ? null : queryRaw

  const category = parseIntentCategory(searchParams.get("category"))
  const openNow = parseBooleanParam(searchParams.get("openNow"))

  return { query, category, openNow }
}
