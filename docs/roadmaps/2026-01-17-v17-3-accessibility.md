---
status: planned
last_updated: 2026-01-19
owner: jer
tags: [roadmap, v17.3, accessibility, wcag, aoda, compliance]
---

# v17.3: Accessibility Compliance (WCAG 2.1 AA / AODA)

**Priority:** HIGH (Legal/Compliance)
**Estimated Effort:** 2-3 weeks (single developer)
**Dependencies:** v17.1 (tested components), v17.2 (i18n for multi-language accessibility)
**Compliance Standards:** WCAG 2.1 Level AA, AODA (Ontario Accessibility Law)

## Executive Summary

Achieve WCAG 2.1 Level AA accessibility compliance across the platform. Currently ~70% compliant. Main gaps: form accessibility (ARIA), image alt text, color contrast, and modal semantics. Required for Ontario organizations (AODA mandate).

> [!NOTE]
> **Existing Accessibility Features**: The codebase already uses Radix UI for some components, which provides built-in accessibility. Audit existing usage before reimplementing.

> [!NOTE]
> **Motion Sensitivity**: This plan includes support for `prefers-reduced-motion` for users sensitive to animations (WCAG 2.3.3).

---

## Phase 1: Accessibility Audit (2-3 days)

### 1.1 Automated Accessibility Scan

**Tools:**
- Axe-core (installed): Scans DOM for violations
- WAVE browser extension: Visual feedback
- Lighthouse: Chrome DevTools audit

### 1.2 Run Comprehensive Audit

**New file:** `scripts/accessibility-audit.ts`

```typescript
import { injectAxe, checkA11y } from 'axe-playwright'
import { test } from '@playwright/test'

test('Full site accessibility audit', async ({ page }) => {
  // Scan homepage
  await page.goto('http://localhost:3000/en')
  await injectAxe(page)
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: {
      html: true,
    },
  })

  // Scan search results
  await page.goto('http://localhost:3000/en?q=health')
  await checkA11y(page)

  // Scan service detail
  await page.goto('http://localhost:3000/en/service/some-id')
  await checkA11y(page)

  // Scan dashboard
  await page.goto('http://localhost:3000/en/dashboard')
  await checkA11y(page)

  // Scan forms
  await page.goto('http://localhost:3000/en/submit-service')
  await checkA11y(page)
})

// Generate report
npm test -- tests/e2e/accessibility-audit.spec.ts 2>&1 | tee a11y-report.txt
```

**Expected findings:**
- 30-50 critical violations
- 20-40 serious violations
- 50-100 moderate violations

### 1.3 Categorize Violations

**New file:** `docs/audit/accessibility-gaps.md`

```markdown
## WCAG 2.1 AA Gaps

### Critical Issues (MUST FIX)

#### 1. Form Accessibility (10-15 violations)
- **Issue:** Form inputs missing labels
- **Pages:** Services/[id]/page, submit-service/page
- **Fix:** Add `aria-label` or `<label>` elements
- **Standard:** WCAG 2.1 1.3.1 (Info and Relationships)

#### 2. Color Contrast (5-10 violations)
- **Issue:** Text contrast < 4.5:1 for normal text
- **Pages:** Multiple (need specific audit)
- **Fix:** Increase text darkness or background brightness
- **Standard:** WCAG 2.1 1.4.3 (Contrast)

#### 3. Image Alt Text (40+ violations)
- **Issue:** Images missing alt text
- **Pages:** Service listings, home page
- **Fix:** Add meaningful alt text to 80+ images
- **Standard:** WCAG 2.1 1.1.1 (Text Alternatives)

#### 4. Modal Focus Management (5-8 violations)
- **Issue:** Focus trap not implemented, escape key not handled
- **Pages:** EmergencyModal, all modals
- **Fix:** Use Radix Dialog or implement focus trap
- **Standard:** WCAG 2.1 2.1.1 (Keyboard)

### Serious Issues (SHOULD FIX)

#### 5. Heading Hierarchy (3-5 violations)
- **Issue:** Skipped heading levels (h1 → h3)
- **Fix:** Use proper hierarchy h1 → h2 → h3
- **Standard:** WCAG 2.1 1.3.1

#### 6. Link Context (5-10 violations)
- **Issue:** Links without descriptive text ("click here")
- **Fix:** Use descriptive link text
- **Standard:** WCAG 2.1 2.4.4 (Link Purpose)

#### 7. Focus Indicators (visible/missing)
- **Issue:** Keyboard focus not visible
- **Fix:** Ensure focus ring visible on all interactive elements
- **Standard:** WCAG 2.1 2.4.7 (Focus Visible)

### Moderate Issues (NICE TO HAVE)

#### 8. Error Prevention & Help
- **Issue:** Forms don't explain errors clearly
- **Fix:** Add aria-describedby linking error messages
- **Standard:** WCAG 2.1 3.3.4 (Error Prevention)

#### 9. Language Declaration
- **Issue:** Language not declared for multi-language content
- **Fix:** Add `lang` attributes for content in other languages
- **Standard:** WCAG 2.1 3.1.2 (Language of Parts)
```

---

## Phase 2: Form Accessibility (3-4 days)

### 2.1 Create Accessible FormField Component

**Problem:** Currently using basic HTML inputs without ARIA.

**New file:** `components/forms/AccessibleFormField.tsx`

```typescript
interface AccessibleFormFieldProps {
  label: string
  id: string
  error?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

export function AccessibleFormField({
  label,
  id,
  error,
  required,
  hint,
  children,
}: AccessibleFormFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span aria-label="required">*</span>}
      </label>

      {hint && (
        <p id={hintId} className="form-hint">
          {hint}
        </p>
      )}

      {/* Pass aria-describedby and aria-invalid to child input */}
      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': !!error,
        'aria-required': required,
      })}

      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
```

### 2.2 Update Form Components

**Modify:** `components/forms/TextField.tsx`

```typescript
// Before
export function TextField({ label, name, ...props }) {
  return (
    <div>
      <label>{label}</label>
      <input name={name} {...props} />
    </div>
  )
}

// After
export function TextField({ label, error, required, ...props }) {
  return (
    <AccessibleFormField
      label={label}
      id={props.id || name}
      error={error}
      required={required}
    >
      <input type="text" {...props} />
    </AccessibleFormField>
  )
}
```

**Apply to:**
- [ ] `components/forms/TextField.tsx`
- [ ] `components/forms/TextArea.tsx`
- [ ] `components/forms/Select.tsx`
- [ ] `components/forms/Checkbox.tsx`
- [ ] `components/forms/RadioGroup.tsx`

### 2.3 Add Error Linking to All Forms

**File:** `components/partner/ServiceEditForm.tsx`

```typescript
export function ServiceEditForm() {
  const [errors, setErrors] = useState<FormErrors>({})

  return (
    <Form onSubmit={handleSubmit}>
      <AccessibleFormField
        label="Service Name"
        id="serviceName"
        error={errors.name}
        required
      >
        <input
          type="text"
          id="serviceName"
          name="name"
          aria-describedby={errors.name ? 'serviceName-error' : undefined}
          aria-invalid={!!errors.name}
          aria-required
        />
      </AccessibleFormField>

      {/* Similar for other fields */}

      <button type="submit">Save Service</button>
    </Form>
  )
}
```

### 2.4 Fieldset & Legend for Grouped Fields

**Example:** Radio group for service type

```typescript
<fieldset>
  <legend>Service Type</legend>
  <div role="group" aria-labelledby="serviceType-legend">
    <label>
      <input type="radio" name="type" value="health" />
      Health Services
    </label>
    <label>
      <input type="radio" name="type" value="housing" />
      Housing Services
    </label>
  </div>
</fieldset>
```

---

## Phase 3: Image Alt Text Audit (2-3 days)

### 3.1 Identify All Images

**Script:** `scripts/audit-images.ts`

```typescript
import { chromium } from 'playwright'

async function auditImages() {
  const browser = await chromium.launch()
  const context = await browser.createBrowserContext()
  const page = await context.newPage()

  const routes = [
    '/en',
    '/en/service/sample',
    '/en/dashboard',
    '/en/submit-service',
  ]

  for (const route of routes) {
    await page.goto(`http://localhost:3000${route}`)

    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt,
        ariaLabel: img.getAttribute('aria-label'),
        isDecorative: img.getAttribute('role') === 'presentation',
        visible: img.offsetParent !== null,
      }))
    })

    console.log(`${route}: ${images.length} images`)
    images.forEach(img => {
      if (!img.alt && !img.ariaLabel && !img.isDecorative) {
        console.log(`  ✗ MISSING ALT: ${img.src}`)
      }
    })
  }

  await browser.close()
}
```

### 3.2 Alt Text Guidelines

**Reference:** `docs/ACCESSIBILITY_GUIDE.md`

```markdown
## Alt Text Guidelines

### Decorative Images
If image is purely decorative and doesn't convey information:
```html
<img src="divider.png" alt="" aria-hidden="true" />
```

### Functional Images (icons, buttons)
If image functions as a button or interactive element:
```html
<img src="icon-search.svg" alt="Search" />
<img src="icon-menu.svg" alt="Open menu" />
```

### Informational Images
If image conveys important information:
```html
<!-- Good: Specific and concise -->
<img src="service-photo.jpg" alt="Kingston Community Health Center building entrance" />

<!-- Bad: Too vague -->
<img src="service-photo.jpg" alt="building" />

<!-- Bad: Too long -->
<img src="service-photo.jpg" alt="This is a photo of the building where Kingston Community Health Center is located at the corner of Main and Princess Street" />
```

### Complex Images (maps, charts)
Provide both alt text and longer description:
```html
<figure>
  <img src="service-map.png" alt="Map of services across Kingston" />
  <figcaption>
    <details>
      <summary>Service distribution details</summary>
      <!-- Extended description -->
    </details>
  </figcaption>
</figure>
```

### Images in Links
Alt text should describe link destination:
```html
<!-- Good -->
<a href="/service/123">
  <img src="icon-health.svg" alt="View health services" />
</a>

<!-- Bad: alt text doesn't explain link -->
<a href="/service/123">
  <img src="icon-health.svg" alt="icon" />
</a>
```
```

### 3.3 Update Images in Code

**Modify:** `components/home/ServiceResultsList.tsx`

```typescript
// Before
{service.icon && <img src={service.icon} />}

// After
{service.icon && (
  <img
    src={service.icon}
    alt={`${service.name} category icon`}
    className="service-icon"
  />
)}
```

**Files to update (80+ images):**
- [ ] `components/home/*.tsx` (15 images)
- [ ] `components/services/*.tsx` (20 images)
- [ ] `components/ui/*.tsx` (10 images)
- [ ] `components/dashboard/*.tsx` (15 images)
- [ ] `public/images/*.svg` (logos, icons - 20 images)

---

## Phase 4: Color Contrast Fixes (1-2 days)

### 4.1 Contrast Audit

**Tool:** Axe-core + WebAIM contrast checker

**Common violations:**
- Light gray text on white (#ccc on white)
- Dark blue text on black
- Required field indicators (red *)

### 4.2 Fix Contrast Issues

**Modify:** `lib/colors.ts` or Tailwind config

```typescript
// Colors with WCAG AA compliance (4.5:1 ratio)
export const colors = {
  text: {
    primary: '#1f2937',    // Dark gray on white
    secondary: '#374151',  // Gray on white
    muted: '#6b7280',      // Lighter gray on white (4.5:1 min)
    onBrand: '#ffffff',    // White on brand color
  },
  background: {
    default: '#ffffff',
    surface: '#f9fafb',
    brand: '#2563eb',      // Blue
  },
}

// Test: #6b7280 on white = 6.7:1 ✓
// Test: #9ca3af on white = 4.0:1 ✗ (below 4.5:1)
```

**Update CSS/Tailwind:**
- [ ] Text colors use `text-gray-900` or `text-gray-700`
- [ ] Avoid `text-gray-500` on white backgrounds
- [ ] Focus rings clearly visible (minimum 3px, high contrast)

---

## Phase 5: Modal & Dialog Accessibility (2-3 days)

### 5.1 EmergencyModal Accessibility

**Current:** Manual focus management, no semantics

**Required:** Proper modal semantics and focus handling

**Modify:** `components/ui/EmergencyModal.tsx`

```typescript
import * as Dialog from '@radix-ui/react-dialog'

export function EmergencyModal({
  open,
  title,
  onClose,
}: {
  open: boolean
  title: string
  onClose: () => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content
        className="modal-content"
        role="alertdialog"  // Use alertdialog for urgent messages
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Dialog.Title id="modal-title">{title}</Dialog.Title>

        <div id="modal-description">
          {/* Modal content */}
        </div>

        <Dialog.Close asChild>
          <button onClick={onClose}>Dismiss</button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  )
}
```

**Benefits of Radix Dialog:**
- ✓ Focus trap implemented
- ✓ Escape key handling
- ✓ Backdrop click handling
- ✓ ARIA roles automatic
- ✓ Animation support
- ✓ Focus restoration on close

### 5.2 Migrate All Modals to Radix

**Files to update:**
- [ ] `components/ui/EmergencyModal.tsx`
- [ ] `components/ui/ConfirmDialog.tsx` (if custom)
- [ ] `components/feedback/ReportIssueModal.tsx`
- [ ] `components/partner/ClaimFlow.tsx` (if step-based modal)

---

## Phase 6: Keyboard Navigation & Focus (2 days)

### 6.1 Focus Indicator Testing

**Checklist:**
- [ ] Tab through entire page
- [ ] Focus ring visible on every interactive element
- [ ] Focus order logical (top-to-bottom, left-to-right)
- [ ] Skip link goes to main content
- [ ] No keyboard traps (can always tab out)

### 6.2 Keyboard Shortcuts Documentation

**New file:** `docs/KEYBOARD_NAVIGATION.md`

```markdown
## Keyboard Shortcuts

### Navigation
- **Tab** - Move to next interactive element
- **Shift+Tab** - Move to previous element
- **Enter** - Activate button or submit form
- **Space** - Toggle checkbox or activate button
- **Escape** - Close modal or dialog
- **Arrow keys** - Navigate radio groups, menu items
- **Alt+Shift+K** - Open keyboard shortcuts help (optional)

### Form-Specific
- **Tab** - Move between form fields
- **Shift+Tab** - Move to previous field
- **Up/Down** - Change select options
- **Home/End** - Jump to first/last option

### Search-Specific
- **Enter** - Submit search
- **Escape** - Clear search, collapse autocomplete
- **Down** - Focus first search result
- **Up/Down** - Navigate results
```

### 6.3 Add Skip Link to Header

**Modify:** `components/layout/Header.tsx`

```typescript
export function Header() {
  return (
    <>
      {/* Skip link - always focusable, hidden off-screen */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only"
      >
        Skip to main content
      </a>

      <header>
        {/* Navigation */}
      </header>

      <main id="main-content">
        {/* Page content */}
      </main>
    </>
  )
}
```

---

## Phase 7: Testing & ESLint Integration (1-2 days)

### 7.1 Add jsx-a11y Plugin

**Modify:** `.eslintrc.js`

```javascript
module.exports = {
  extends: [
    'next',
    'plugin:jsx-a11y/recommended',  // NEW
  ],
  plugins: ['jsx-a11y'],  // NEW
  rules: {
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
  },
}
```

**Run:**
```bash
npm run lint  # ESLint will now catch a11y violations
```

### 7.2 Expand Accessibility E2E Tests

**New file:** `tests/e2e/accessibility.spec.ts` (modify existing)

Add tests:
```typescript
test('form accessibility', async ({ page }) => {
  await page.goto('/en/submit-service')

  // Check form has proper labels
  const inputs = page.locator('input')
  for (const input of await inputs.all()) {
    const ariaLabel = await input.getAttribute('aria-label')
    const label = await page.locator(`label[for="${await input.getAttribute('id')}"]`)
    expect(ariaLabel || label).toBeTruthy()
  }
})

test('modal accessibility', async ({ page }) => {
  // Trigger emergency modal
  await page.fill('input[name="query"]', 'suicide')
  await page.press('input[name="query"]', 'Enter')

  const modal = page.locator('[role="alertdialog"]')
  expect(modal).toBeVisible()

  // Check modal has title
  const title = page.locator('[id*="modal-title"]')
  expect(title).toBeTruthy()

  // Close modal with Escape key
  await page.press('[role="alertdialog"]', 'Escape')
  expect(modal).not.toBeVisible()
})

test('keyboard navigation', async ({ page }) => {
  await page.goto('/en')

  // Tab through page
  let tabCount = 0
  while (tabCount < 20) {
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focused)
    tabCount++
  }
})
```

### 7.3 Screen Reader Testing (Manual)

**Test with:**
- NVDA (Windows, free)
- JAWS (Windows, paid)
- VoiceOver (macOS, built-in)
- TalkBack (Android, built-in)

**Checklist:**
- [ ] Page title announced
- [ ] Navigation landmarks announced
- [ ] Form labels announced correctly
- [ ] Error messages announced
- [ ] Success messages announced
- [ ] Images described accurately
- [ ] Links have descriptive text

---

## Phase 8: AODA Compliance Documentation (1 day)

### 8.1 Create AODA Compliance Report

**New file:** `docs/AODA_COMPLIANCE_REPORT.md`

```markdown
# AODA Compliance Report

## Accessibility for Ontarians with Disabilities Act (2005)

Kingston Care Connect is committed to providing a barrier-free service to people with disabilities.

### WCAG 2.1 Level AA Compliance

As of [DATE], Kingston Care Connect meets WCAG 2.1 Level AA standards:

#### Perceivable
- [x] Text Alternatives: All images have alt text (1.1.1)
- [x] Time-based Media: N/A (no video)
- [x] Adaptable: Content structure independent of presentation (1.3.1)
- [x] Distinguishable: Color contrast 4.5:1 (1.4.3)

#### Operable
- [x] Keyboard Accessible: All functionality available via keyboard (2.1.1)
- [x] Enough Time: No time limits (2.2.1)
- [x] Seizures: No flashing content (2.3.1)
- [x] Navigable: Clear structure, skip links (2.4.1)

#### Understandable
- [x] Readable: Plain language, FLESCH > 60 (3.1.3)
- [x] Predictable: Consistent navigation (3.2.3)
- [x] Input Assistance: Error messages and recovery (3.3.4)

#### Robust
- [x] Compatible: HTML valid, ARIA correct (4.1.1)

### Known Limitations

[Any limitations and workarounds]

### Feedback

Report accessibility issues to: [accessibility@kcc.ca]
```

### 8.2 Accessibility Statement Page

**New file:** `app/[locale]/accessibility/page.tsx`

```typescript
export default function AccessibilityPage() {
  return (
    <main>
      <h1>Accessibility Statement</h1>

      <h2>Our Commitment</h2>
      <p>
        Kingston Care Connect is committed to being accessible to
        people with disabilities...
      </p>

      <h2>WCAG 2.1 Compliance</h2>
      <p>We aim to meet Level AA standards...</p>

      <h2>Known Accessibility Issues</h2>
      <p>
        While we work continuously to improve, some limitations exist...
      </p>

      <h2>Accessibility Features</h2>
      <ul>
        <li>High contrast mode</li>
        <li>Keyboard navigation</li>
        <li>Screen reader compatibility</li>
        <li>7-language support</li>
        <li>Plain language descriptions</li>
      </ul>

      <h2>Report an Issue</h2>
      <p>
        Did you encounter an accessibility problem?
        <a href="mailto:accessibility@example.com">
          Let us know
        </a>
      </p>
    </main>
  )
}
```

---

## Success Criteria

- [ ] Axe-core scan: Zero critical/serious violations
- [ ] All images have alt text (or marked decorative)
- [ ] Color contrast: 4.5:1 for normal text, 3:1 for large text
- [ ] All forms have proper ARIA attributes
- [ ] Keyboard navigation complete (Tab, Enter, Escape, Arrow keys)
- [ ] Focus indicators visible on all interactive elements
- [ ] WCAG 2.1 AA compliance verified
- [ ] AODA compliance report complete
- [ ] ESLint catches a11y violations
- [ ] E2E tests verify accessibility
- [ ] Manual screen reader testing passed

---

## File Changes Summary

| Component | Change | Impact |
|-----------|--------|--------|
| FormField | Add ARIA attributes | All forms |
| Images | Add alt text | 80+ locations |
| CSS | Increase text contrast | Global styling |
| Modals | Use Radix Dialog | EmergencyModal, others |
| Header | Add skip link | All pages |
| ESLint | Add jsx-a11y | Prevents new violations |
| Documentation | AODA report + accessibility page | Legal compliance |

---

## Rollback Plan

All a11y improvements are backward-compatible:
- ARIA attributes don't break existing functionality
- Alt text additions are non-breaking
- CSS contrast changes maintain design
- Radix Dialog is drop-in replacement for custom modals

If issues arise:
1. Revert specific component
2. Use feature flags for gradual rollout
3. Test extensively before full deployment
