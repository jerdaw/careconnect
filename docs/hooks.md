# Custom Hooks

## Search Hooks

### useSearch
Manages search state including query, filters, saved searches, and geolocation.

```tsx
import { useSearch } from '@/hooks/useSearch';

const {
  query, setQuery,
  category, setCategory,
  userLocation, toggleLocation, isLocating,
  results, setResults,
  hasSearched, setHasSearched,
  isLoading, setIsLoading,
  suggestion, setSuggestion,
  savedSearches, handleSaveSearch, removeSavedSearch
} = useSearch();
```

**State Details:**
- `suggestion`: `string | null` - A fuzzy-matched query suggestion.
- `setSuggestion`: `(suggestion: string | null) => void` - Updates the suggestion state.

### useServices
Performs search with progressive enhancement (keyword → semantic).

```tsx
import { useServices } from '@/hooks/useServices';

useServices({
  query,
  category,
  userLocation,
  isReady,
  generateEmbedding,
  setResults,
  setIsLoading,
  setHasSearched,
  setSuggestion
});
```

### useSemanticSearch
Web Worker-based semantic search with embedding model.

```tsx
import { useSemanticSearch } from '@/hooks/useSemanticSearch';

const { isReady, progress, generateEmbedding } = useSemanticSearch();
```

---

## Utility Hooks

### useLocalStorage
SSR-safe localStorage hook with JSON serialization.

```tsx
import { useLocalStorage } from '@/hooks/useLocalStorage';

const [value, setValue, removeValue] = useLocalStorage('key', initialValue);

// Update value
setValue('new value');

// Update with callback
setValue(prev => [...prev, 'item']);

// Remove from storage
removeValue();
```

**Features:**
- SSR-safe (no hydration mismatch)
- Automatic JSON serialization
- Functional updates supported
- TypeScript generics

### useGeolocation
Browser Geolocation API hook with loading and error states.

```tsx
import { useGeolocation } from '@/hooks/useGeolocation';

const {
  coordinates,    // { lat, lng } | null
  isLocating,     // boolean
  error,          // string | null
  requestLocation,
  clearLocation
} = useGeolocation();

// Request user's location
requestLocation();

// Clear stored location
clearLocation();
```

**Features:**
- SSR-safe
- Detailed error messages
- Support for PositionOptions
- Loading state
