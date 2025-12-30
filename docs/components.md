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
