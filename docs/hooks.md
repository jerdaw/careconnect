# Custom Hooks

## Search Hooks

### useSearch

Manages search state including query, filters, saved searches, and geolocation.

```tsx
import { useSearch } from "@/hooks/useSearch"

const {
  query,
  setQuery,
  category,
  setCategory,
  userLocation,
  toggleLocation,
  isLocating,
  results,
  setResults,
  hasSearched,
  setHasSearched,
  isLoading,
  setIsLoading,
  suggestion,
  setSuggestion,
  savedSearches,
  handleSaveSearch,
  removeSavedSearch,
} = useSearch()
```

**State Details:**

- `suggestion`: `string | null` - A fuzzy-matched query suggestion.
- `setSuggestion`: `(suggestion: string | null) => void` - Updates the suggestion state.

### useServices

Performs search with progressive enhancement (keyword → semantic).

```tsx
import { useServices } from "@/hooks/useServices"

useServices({
  query,
  category,
  userLocation,
  isReady,
  generateEmbedding,
  setResults,
  setIsLoading,
  setHasSearched,
  setSuggestion,
})
```

### useSemanticSearch

Web Worker-based semantic search with embedding model.

```tsx
import { useSemanticSearch } from "@/hooks/useSemanticSearch"

const { isReady, progress, generateEmbedding } = useSemanticSearch()
```

### useAI

Manages the local WebLLM engine state (loading, chat, error handling).

```tsx
import { useAI } from "@/hooks/useAI"

const {
  isReady, // boolean: is model loaded?
  isLoading, // boolean: is downloading?
  progress, // number: 0-1 download progress
  chat, // (messages[]) => Promise<string>
  initAI, // () => void: trigger download
} = useAI()
```

### useVoiceInput

Manages local audio recording and transcription using in-browser Whisper model.

```tsx
import { useVoiceInput } from "@/hooks/useVoiceInput"

const {
  state, // "idle" | "listening" | "processing" | "error"
  startListening,
  stopListening,
  error,
} = useVoiceInput((text) => setQuery(text))
```

---

## Utility Hooks

### usePushNotifications

Manages Web Push API subscription state and permissions.

```tsx
import { usePushNotifications } from "@/hooks/usePushNotifications"

const {
  isSupported, // boolean: is Push API available?
  permission, // "default" | "granted" | "denied"
  isSubscribed, // boolean: is current user subscribed?
  isLoading, // boolean
  subscribe, // (categories: string[]) => Promise<boolean>
  unsubscribe, // () => Promise<boolean>
} = usePushNotifications()
```

### useUserContext

Manages the client-side user profile for privacy-preserving personalization.

```tsx
import { useUserContext } from "@/hooks/useUserContext"

const {
  context, // { ageGroup, identities, hasOptedIn }
  updateAgeGroup, // (age: AgeGroup) => void
  toggleIdentity, // (tag: IdentityTag) => void
  optIn, // () => void
  optOut, // () => void
} = useUserContext()
```

### useLocalStorage

SSR-safe localStorage hook with JSON serialization.

```tsx
import { useLocalStorage } from "@/hooks/useLocalStorage"

const [value, setValue, removeValue] = useLocalStorage("key", initialValue)

// Update value
setValue("new value")

// Update with callback
setValue((prev) => [...prev, "item"])

// Remove from storage
removeValue()
```

**Features:**

- SSR-safe (no hydration mismatch)
- Automatic JSON serialization
- Functional updates supported
- TypeScript generics

### useGeolocation

Browser Geolocation API hook with loading and error states.

```tsx
import { useGeolocation } from "@/hooks/useGeolocation"

const {
  coordinates, // { lat, lng } | null
  isLocating, // boolean
  error, // string | null
  requestLocation,
  clearLocation,
} = useGeolocation()

// Request user's location
requestLocation()

// Clear stored location
clearLocation()
```

**Features:**

- SSR-safe
- Detailed error messages
- Support for PositionOptions
- Loading state
