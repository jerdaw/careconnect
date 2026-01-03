# Component Usage Guide

## UI Primitives (`components/ui`)

### Button

Standardized button component supporting variants and sizes.

```tsx
import { Button } from '@/components/ui/button';

// Primary
<Button>Click Me</Button>

// Secondary
<Button variant="secondary">Cancel</Button>

// Ghost (for icons)
<Button variant="ghost" size="icon">
  <Icon />
</Button>

// Pill (for chips)
<Button variant="pill">Category</Button>

// Full width
<Button className="w-full">Submit</Button>
```

**Variants:**

- `default`: Primary blue action.
- `destructive`: Red/Warning action.
- `outline`: Bordered, transparent background.
- `secondary`: Light gray background.
- `ghost`: Transparent, hover effect only.
- `link`: Underlined text.
- `pill`: Rounded chip style (white with shadow).

**Sizes:**

- `default`: Standard padding.
- `sm`: Smaller padding.
- `lg`: Larger padding.
- `icon`: Square, for icon-only buttons.
- `pill`: Optimized for chip usage.

---

## Feature Components

### ServiceCard

Displays a service with score, match reasons, and action buttons.

```tsx
import ServiceCard from "@/components/ServiceCard"
;<ServiceCard
  service={service}
  score={result.score}
  matchReasons={result.matchReasons}
  score={result.score}
  matchReasons={result.matchReasons}
/>
```

### SearchBar

Includes integrated voice search capability.

```tsx
import SearchBar from "@/components/home/SearchBar"
;<SearchBar query={query} setQuery={setQuery} placeholder="Search..." />
```

**Sub-components:**

- `VoiceSearchButton`: Manages microphone state and local Whisper transcription.

### ChatAssistant

Local RAG-powered AI chat interface.

```tsx
import ChatAssistant from "@/components/ai/ChatAssistant"

// Must be wrapped in ClientOnly due to WebGPU/WASM
;<ClientOnly>
  <ChatAssistant />
</ClientOnly>
```

### ServiceCardSkeleton

Loading placeholder for ServiceCard.

```tsx
import ServiceCardSkeleton from "@/components/ServiceCardSkeleton"
;<ServiceCardSkeleton />
```

### ErrorBoundary

Catches React errors and displays a fallback UI with error ID for support.

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary"
;<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo, errorId) => {
    // Optional error reporting
  }}
>
  <App />
</ErrorBoundary>
```

### AsyncErrorBoundary

Specialized error boundary for async components and Suspense. Includes a built-in retry mechanism and error ID copy function.

```tsx
import { AsyncErrorBoundary } from "@/components/AsyncErrorBoundary"
;<AsyncErrorBoundary componentName="ServiceList">
  <Suspense fallback={<Loading />}>
    <ServiceList />
  </Suspense>
</AsyncErrorBoundary>
```

### ServiceEditForm (Partner-Focused)

New multi-lingual-aware form for service editing (EN/FR fields). Located in `components/partner/ServiceEditForm.tsx`.

```tsx
import { ServiceEditForm } from "@/components/partner/ServiceEditForm"
;<ServiceEditForm
  service={serviceData}
  onSave={async (data) => {
    // Save logic
  }}
/>
```

### PartnerServiceList

Data table for displaying an organization's services on the dashboard.

```tsx
import { PartnerServiceList } from "@/components/partner/PartnerServiceList"
;<PartnerServiceList partnerId={user.id} />
```

### AnalyticsCard (Advanced)

Visualizes a single metric with trend indicator. Supports glassmorphism styling.

```tsx
import { AnalyticsCard } from "@/components/AnalyticsCard"
;<AnalyticsCard title="Total Views" value={1200} change={5.2} loading={false} />
```

### VoiceSearchButton

See `SearchBar` section.

---

## Provider Components

### AuthProvider

Provides authentication context throughout the app.

```tsx
import { AuthProvider, useAuth } from "@/components/AuthProvider"

// Wrap app
;<AuthProvider>
  <App />
</AuthProvider>

// Use in components
const { user, signOut } = useAuth()
```

### BetaBanner

Displays a beta warning banner at the top of the app.

```tsx
import BetaBanner from "@/components/BetaBanner"
;<BetaBanner />
```

### ThemeProvider

Manages light/dark mode state using `next-themes`.

```tsx
import { ThemeProvider } from "@/components/ThemeProvider"
;<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <App />
</ThemeProvider>
```

---

### DashboardSidebar

Navigation sidebar for partner dashboard.

```tsx
import DashboardSidebar from "@/components/DashboardSidebar"
;<DashboardSidebar />
```

### ServiceDetailPage

Dedicated public route for service information.

```tsx
// Route: /service/[id]
import ServiceDetailPage from "@/app/[locale]/service/[id]/page.tsx"
```

---

## Layout Components

### Header & Footer

Global shell components.

```tsx
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
```

### Tooltip

Accessible tooltip component.

````tsx
import { Tooltip } from "@/components/Tooltip"
;<Tooltip content="Helpful info">
  <button>Hover me</button>
</Tooltip>

### FreshnessBadge

Visual indicator of when service data was last verified.

```tsx
import { FreshnessBadge } from "@/components/ui/FreshnessBadge"

;<FreshnessBadge lastVerified="2024-01-01T00:00:00Z" />
````

### PrintButton

Optimized button for printing search results. Automatically hidden during print.

```tsx
import { PrintButton } from "@/components/ui/PrintButton"
;<PrintButton />
```

```

```
