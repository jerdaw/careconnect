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
import ServiceCard from '@/components/ServiceCard';

<ServiceCard
  service={service}
  score={result.score}
  matchReasons={result.matchReasons}
/>
```

### ServiceCardSkeleton
Loading placeholder for ServiceCard.

```tsx
import ServiceCardSkeleton from '@/components/ServiceCardSkeleton';

<ServiceCardSkeleton />
```

### ErrorBoundary
Catches React errors and displays a fallback UI with error ID for support.

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary
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
import { AsyncErrorBoundary } from '@/components/AsyncErrorBoundary';

<AsyncErrorBoundary componentName="ServiceList">
  <Suspense fallback={<Loading />}>
    <ServiceList />
  </Suspense>
</AsyncErrorBoundary>
```

### AnalyticsCard
Displays analytics metrics in a card format.

```tsx
import AnalyticsCard from '@/components/AnalyticsCard';

<AnalyticsCard
  title="Total Searches"
  value={1234}
  change={+12.5}
/>
```

### EditServiceForm
Form for creating/editing services with validation.

```tsx
import EditServiceForm from '@/components/EditServiceForm';

<EditServiceForm
  service={existingService}
  onSubmit={async (data) => { /* save */ }}
/>
```

---

## Provider Components

### AuthProvider
Provides authentication context throughout the app.

```tsx
import { AuthProvider, useAuth } from '@/components/AuthProvider';

// Wrap app
<AuthProvider>
  <App />
</AuthProvider>

// Use in components
const { user, signOut } = useAuth();
```

### BetaBanner
Displays a beta warning banner at the top of the app.

```tsx
import BetaBanner from '@/components/BetaBanner';

<BetaBanner />
```

---

### DashboardSidebar
Navigation sidebar for partner dashboard.

```tsx
import DashboardSidebar from '@/components/DashboardSidebar';

<DashboardSidebar />
```

### ServiceDetailPage
Dedicated public route for detailed service information, contact details, and claiming.

```tsx
// Route: /service/[id]
import ServiceDetailPage from '@/app/[locale]/service/[id]/page.tsx';
```

---

## Layout Components

### Tooltip
Accessible tooltip component.

```tsx
import { Tooltip } from '@/components/Tooltip';

<Tooltip content="Helpful info">
  <button>Hover me</button>
</Tooltip>
```
