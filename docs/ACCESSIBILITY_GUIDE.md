# Accessibility Guide

This guide provides best practices for maintaining WCAG 2.1 Level AA accessibility compliance in the HelpBridge platform.

## Table of Contents

- [Image Alt Text Guidelines](#image-alt-text-guidelines)
- [ARIA Best Practices](#aria-best-practices)
- [Keyboard Navigation Patterns](#keyboard-navigation-patterns)
- [Color and Contrast](#color-and-contrast)
- [Form Accessibility](#form-accessibility)

---

## Image Alt Text Guidelines

### When to Use Alt Text

**Every image must have an `alt` attribute**, even if it's empty. The content of the `alt` attribute depends on the image's purpose:

### 1. Decorative Images

If an image is purely decorative and doesn't convey information:

```tsx
<img src="/divider.png" alt="" aria-hidden="true" />
```

**Examples:**

- Background patterns
- Visual dividers
- Decorative borders
- Spacer graphics

### 2. Functional Images (Icons, Buttons)

If an image functions as a button or interactive element, describe its **function**, not its appearance:

```tsx
// Good
<img src="/icon-search.svg" alt="Search" />
<img src="/icon-menu.svg" alt="Open menu" />
<img src="/icon-close.svg" alt="Close dialog" />

// Bad
<img src="/icon-search.svg" alt="magnifying glass icon" />
```

### 3. Informational Images

Describe the **content and meaning** of the image concisely:

```tsx
// Good: Specific and concise
<img src="/service-photo.jpg" alt="Kingston Community Health Center building entrance" />

// Bad: Too vague
<img src="/service-photo.jpg" alt="building" />

// Bad: Too verbose
<img
  src="/service-photo.jpg"
  alt="This is a photo of the brick building where Kingston Community Health Center is located at the corner of Main Street and Princess Street with a blue door and wheelchair ramp"
/>
```

**Alt text should:**

- Be concise (typically under 125 characters)
- Not include "image of" or "picture of" (screen readers announce this automatically)
- Convey the same information as the image
- End with a period if it's a complete sentence

### 4. Complex Images (Charts, Graphs, Maps)

For complex images that require extended descriptions:

```tsx
<figure>
  <img src="/service-distribution-map.png" alt="Map showing distribution of health services across Kingston" />
  <figcaption>
    <details>
      <summary>Detailed service distribution information</summary>
      <p>
        The map shows 15 health services clustered in downtown Kingston, 8 services in the east end near Princess
        Street, and 5 services in the west end near Division Street. Rural areas have 3 services distributed along
        Highway 2.
      </p>
    </details>
  </figcaption>
</figure>
```

### 5. Images in Links

When an image is the only content in a link, the alt text should describe the **link destination**, not just the image:

```tsx
// Good: Describes where the link goes
<Link href="/service/123">
  <img src="/icon-health.svg" alt="View Kingston Community Health Center details" />
</Link>

// Bad: Only describes the image
<Link href="/service/123">
  <img src="/icon-health.svg" alt="health icon" />
</Link>

// Also acceptable if there's visible text
<Link href="/service/123">
  <img src="/icon-health.svg" alt="" aria-hidden="true" />
  <span>View Health Services</span>
</Link>
```

### 6. Logo Images

Logos should use the organization name:

```tsx
// Good
<img src="/logo.svg" alt="HelpBridge Logo" />
<img src="/partner-logo.svg" alt={`${partner.name} Logo`} />

// Bad
<img src="/logo.svg" alt="Logo" />
```

### 7. Dynamic Images

For user-generated or dynamic content:

```tsx
// Service provider photos
<img
  src={service.imageUrl}
  alt={service.imageAlt || `${service.name} service location`}
/>

// User avatars
<img
  src={user.avatarUrl}
  alt={`${user.name}'s profile picture`}
/>
```

---

## ARIA Best Practices

### When to Use ARIA

**First rule of ARIA:** Don't use ARIA. Use semantic HTML instead.

```tsx
// Good: Semantic HTML
<button onClick={handleClick}>Submit</button>

// Bad: div with ARIA
<div role="button" onClick={handleClick} tabIndex={0}>Submit</div>
```

### Common ARIA Patterns

#### 1. Form Fields with Errors

```tsx
<div>
  <label htmlFor="email">Email Address</label>
  <input
    id="email"
    type="email"
    aria-describedby={error ? "email-error" : undefined}
    aria-invalid={!!error}
    aria-required
  />
  {error && (
    <p id="email-error" role="alert">
      {error}
    </p>
  )}
</div>
```

#### 2. Live Regions

```tsx
// Announce search results count
<div aria-live="polite" aria-atomic="true">
  {searchResults.length} services found
</div>

// Urgent announcements
<div aria-live="assertive" role="alert">
  Your session will expire in 5 minutes
</div>
```

#### 3. Expandable Sections

```tsx
<button
  aria-expanded={isExpanded}
  aria-controls="section-content"
  onClick={() => setIsExpanded(!isExpanded)}
>
  {isExpanded ? 'Hide' : 'Show'} Details
</button>
<div id="section-content" hidden={!isExpanded}>
  {/* Content */}
</div>
```

#### 4. Modal Dialogs

Use the Radix Dialog component, which handles ARIA automatically:

```tsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
;<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogTitle>Confirm Action</DialogTitle>
    <DialogDescription>Are you sure you want to proceed?</DialogDescription>
    {/* Content */}
  </DialogContent>
</Dialog>
```

---

## Keyboard Navigation Patterns

### Essential Keyboard Support

Every interactive element must be keyboard accessible:

| Element         | Required Keys                |
| --------------- | ---------------------------- |
| Button          | `Enter`, `Space`             |
| Link            | `Enter`                      |
| Checkbox        | `Space`                      |
| Radio Group     | `Arrow keys`, `Space`        |
| Select Dropdown | `Enter`, `Arrow keys`, `Esc` |
| Modal/Dialog    | `Esc` to close, focus trap   |
| Menu            | `Arrow keys`, `Enter`, `Esc` |

### Focus Management

```tsx
// After closing modal, return focus to trigger
const triggerRef = useRef<HTMLButtonElement>(null)

const openModal = () => {
  setIsOpen(true)
}

const closeModal = () => {
  setIsOpen(false)
  triggerRef.current?.focus()
}

return (
  <>
    <button ref={triggerRef} onClick={openModal}>
      Open Modal
    </button>
    <Modal isOpen={isOpen} onClose={closeModal} />
  </>
)
```

### Skip Links

Every page should have a skip link as the first focusable element:

```tsx
;<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50">
  Skip to main content
</a>

{
  /* ... header/nav ... */
}

;<main id="main-content" tabIndex={-1}>
  {/* Page content */}
</main>
```

---

## Color and Contrast

### WCAG AA Requirements

- **Normal text:** 4.5:1 contrast ratio
- **Large text (18pt+ or 14pt+ bold):** 3:1 contrast ratio
- **UI components and graphics:** 3:1 contrast ratio

### Testing Tools

- Chrome DevTools (Lighthouse)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Axe DevTools extension

### Tailwind Color Safety

When using Tailwind, follow these guidelines:

```tsx
// Safe for body text on white background
className = "text-gray-900" // ✅ 21:1
className = "text-gray-800" // ✅ 15:1
className = "text-gray-700" // ✅ 10.5:1

// Use sparingly or for large text only
className = "text-gray-600" // ⚠️ 7:1 (borderline)
className = "text-gray-500" // ❌ 4.6:1 (fails for normal text)
```

### Don't Rely on Color Alone

```tsx
// Bad: Only color indicates status
<span className="text-red-600">Error</span>
<span className="text-green-600">Success</span>

// Good: Icon + color + text
<span className="text-red-600">
  <AlertCircle className="inline h-4 w-4" /> Error
</span>
<span className="text-green-600">
  <CheckCircle className="inline h-4 w-4" /> Success
</span>
```

---

## Form Accessibility

### Use the AccessibleFormField Component

Always use the `AccessibleFormField` wrapper for consistent accessibility:

```tsx
import { AccessibleFormField } from "@/components/forms/AccessibleFormField"
;<AccessibleFormField
  label="Email Address"
  id="email"
  error={errors.email}
  hint="We'll never share your email"
  required
>
  <input type="email" name="email" placeholder="you@example.com" />
</AccessibleFormField>
```

This automatically provides:

- `<label>` association via `htmlFor`
- `aria-invalid` on errors
- `aria-describedby` linking errors/hints
- `role="alert"` on error messages
- `aria-required` for required fields

### Grouped Fields

For radio buttons or checkboxes, use `<fieldset>` and `<legend>`:

```tsx
<fieldset>
  <legend>Service Category</legend>
  <div role="group">
    <label>
      <input type="radio" name="category" value="health" />
      Health Services
    </label>
    <label>
      <input type="radio" name="category" value="housing" />
      Housing Services
    </label>
  </div>
</fieldset>
```

### Error Announcements

Errors should be announced to screen readers immediately:

```tsx
{
  errors.length > 0 && (
    <div role="alert" aria-live="assertive">
      {errors.length} errors found. Please review the form.
    </div>
  )
}
```

---

## Testing Checklist

Before submitting code, verify:

- [ ] All images have `alt` attributes
- [ ] Color contrast meets 4.5:1 (use Axe DevTools)
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Forms have proper labels and error handling
- [ ] Modals trap focus and close on `Esc`
- [ ] No ESLint a11y violations (`npm run lint`)
- [ ] Accessibility tests pass (`npm run test:a11y`)

---

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Articles](https://webaim.org/articles/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [MDN ARIA Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [Axe-core Rule Descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
