import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchChipsProps {
  savedSearches: string[]
  removeSavedSearch: (term: string) => void
  startSearch: (term: string) => void
}

export default function SearchChips({ savedSearches, removeSavedSearch, startSearch }: SearchChipsProps) {
  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          <div className="w-full text-center text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Saved
          </div>
          {savedSearches.map((s) => (
            <div
              key={s}
              className="group flex items-center gap-1 rounded-full bg-blue-50 py-1 pr-1 pl-3 text-xs font-medium text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800"
            >
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-blue-700 dark:text-blue-300"
                onClick={() => startSearch(s)}
              >
                {s}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-blue-400 hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation()
                  removeSavedSearch(s)
                }}
                aria-label={`Remove saved search ${s}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
