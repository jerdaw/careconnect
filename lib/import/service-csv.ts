import Papa from "papaparse"
import { normalizeCSVHeaders } from "@/lib/schemas/service-csv-import"

const EXTRA_FIELDS_KEY = "__parsed_extra"

export function parseServiceImportCSV(text: string, maxRows: number = 100): Record<string, string>[] {
  const parseResult = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => normalizeCSVHeaders([header])[0] ?? header.trim(),
    transform: (value) => value.trim(),
  })

  if (parseResult.errors.length > 0) {
    throw new Error(parseResult.errors[0]?.message ?? "Failed to parse CSV")
  }

  return parseResult.data.slice(0, maxRows).map((row) => {
    return Object.fromEntries(
      Object.entries(row)
        .filter(([key]) => key.trim().length > 0 && key !== EXTRA_FIELDS_KEY)
        .map(([key, value]) => [key, value ?? ""])
    )
  })
}
