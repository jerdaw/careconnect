# Screen Reader Testing Checklist

This document provides a comprehensive checklist for manual screen reader testing to verify WCAG 2.1 Level AA compliance beyond automated tools.

## Testing Environment

### Recommended Screen Readers

| Screen Reader | Platform  | Cost | Notes                         |
| ------------- | --------- | ---- | ----------------------------- |
| **NVDA**      | Windows   | Free | Most popular free option      |
| **JAWS**      | Windows   | Paid | Industry standard (expensive) |
| **VoiceOver** | macOS/iOS | Free | Built-in to Apple devices     |
| **TalkBack**  | Android   | Free | Built-in to Android           |
| **Narrator**  | Windows   | Free | Built-in to Windows (basic)   |

### Test Browsers

- Chrome/Edge (most common)
- Firefox (recommended for NVDA)
- Safari (required for VoiceOver)

---

## Pre-Testing Setup

### NVDA (Windows)

1. Download from [nvda-project.org](https://www.nvaccess.org/)
2. Install and restart computer
3. Launch NVDA with `Ctrl + Alt + N`
4. Open Firefox or Chrome
5. Navigate to `http://localhost:3000/en`

### VoiceOver (macOS)

1. Enable: System Preferences → Accessibility → VoiceOver
2. Launch with `Cmd + F5` (or Touch ID button 3x on MacBook)
3. Open Safari
4. Navigate to `http://localhost:3000/en`

### JAWS (Windows - If Available)

1. Launch JAWS
2. Open browser
3. Navigate to site

---

## Testing Checklist

### General Navigation

- [ ] **Page Title**: Screen reader announces page title on load
  - Expected: "Kingston Care Connect - [Page Name]"
  - Test: Listen immediately after page load

- [ ] **Language**: Page language is announced correctly
  - Expected: English or selected locale
  - Test: Check document properties announcement

- [ ] **Landmarks**: Main page regions are announced
  - Expected: "banner", "navigation", "main", "contentinfo" (footer)
  - Test: Use landmark navigation commands (NVDA: `D`, VoiceOver: `Cmd+U`)

- [ ] **Headings**: Heading structure is logical
  - Expected: H1 → H2 → H3 (no skipped levels)
  - Test: Navigate by headings (NVDA: `H`, VoiceOver: `Cmd+U` → Headings)

### Skip Link

- [ ] **Skip Link Visibility**: Skip link is announced first
  - Expected: "Skip to main content" link
  - Test: Press Tab once after page load

- [ ] **Skip Link Functionality**: Activating skip link moves focus
  - Expected: Focus moves to main content area
  - Test: Press Enter on skip link, verify announcement

### Forms (Test on `/en/submit-service`)

- [ ] **Form Labels**: All inputs have associated labels
  - Expected: "Email, edit, [current value]"
  - Test: Tab through form, verify label announced before field

- [ ] **Required Fields**: Required status is announced
  - Expected: "Email, required, edit"
  - Test: Focus on required input

- [ ] **Error Messages**: Errors are announced immediately
  - Expected: "Invalid email format" with alert tone
  - Test: Submit form with invalid data, listen for announcements

- [ ] **Error Association**: Errors linked to their fields
  - Expected: Error message announced when field receives focus
  - Test: Focus on errored field after submission

- [ ] **Hint Text**: Helper text is announced
  - Expected: "We'll never share your email"
  - Test: Focus on field with hint

- [ ] **Field Groups**: Radio/checkbox groups have legends
  - Expected: "Service Category, group" then individual options
  - Test: Navigate to grouped fields

### Interactive Elements

- [ ] **Buttons**: Button text and role announced
  - Expected: "Search, button"
  - Test: Tab to buttons

- [ ] **Links**: Link text and destination hinted
  - Expected: "Kingston Community Health Center, link"
  - Test: Tab to links

- [ ] **Current Page**: Current nav link indicated
  - Expected: "Home, current page, link" or similar
  - Test: Navigate to different pages

### Images

- [ ] **Informational Images**: Alt text is descriptive
  - Expected: "Kingston Community Health Center Logo"
  - Test: Navigate to logo image

- [ ] **Decorative Images**: Skipped by screen reader
  - Expected: No announcement
  - Test: Tab through page, decorative images should be silent

- [ ] **Icon Buttons**: Function is described, not appearance
  - Expected: "Open menu, button" (not "hamburger icon")
  - Test: Focus on icon buttons

### Modals/Dialogs

#### Test: Emergency Modal (Trigger by searching for crisis keywords)

- [ ] **Modal Opening**: Announced as dialog
  - Expected: "Emergency Resources, dialog" or "alert dialog"
  - Test: Trigger modal

- [ ] **Focus Trap**: Focus stays within modal
  - Expected: Tabbing cycles through modal controls only
  - Test: Press Tab multiple times

- [ ] **Modal Title**: Title announced on open
  - Expected: Dialog title read aloud
  - Test: Listen when modal opens

- [ ] **Modal Description**: Body content accessible
  - Expected: Full message can be read
  - Test: Use virtual navigation (arrow keys)

- [ ] **Close Button**: Clearly identified
  - Expected: "Close, button" or "Dismiss"
  - Test: Tab to close button

- [ ] **Escape Key**: Announces modal closing
  - Expected: Focus returns to trigger, "dialog closed"
  - Test: Press Esc

#### Test: Feedback Modal

- [ ] **Form in Modal**: Accessible as standalone form
  - Expected: All form rules apply within modal
  - Test: Tab through modal form

### Dynamic Content

- [ ] **Search Results**: Results count announced
  - Expected: "15 services found" (live region)
  - Test: Perform search

- [ ] **Loading States**: Loading announced
  - Expected: "Loading" or "busy"
  - Test: Trigger loading state

- [ ] **Success Messages**: Success announced
  - Expected: "Service submitted successfully"
  - Test: Submit valid form

### Navigation Menu

- [ ] **Menu Items**: All links accessible
  - Expected: Each link announced with text
  - Test: Navigate through menu

- [ ] **Mobile Menu**: Expandable menu announced
  - Expected: "Open menu, button, collapsed" → "Close menu, button, expanded"
  - Test: Toggle mobile menu

- [ ] **Dropdown Menus**: Expansion state clear
  - Expected: "expanded" or "collapsed" status
  - Test: Open dropdowns

---

## Common Screen Reader Commands

### NVDA (Windows)

| Action          | Command               |
| --------------- | --------------------- |
| Start NVDA      | `Ctrl + Alt + N`      |
| Stop Reading    | `Ctrl`                |
| Read All        | `Insert + Down Arrow` |
| Next Heading    | `H`                   |
| Next Link       | `K`                   |
| Next Button     | `B`                   |
| Next Form Field | `F`                   |
| Next Landmark   | `D`                   |
| Elements List   | `Insert + F7`         |

### VoiceOver (macOS)

| Action          | Command                           |
| --------------- | --------------------------------- |
| Start VoiceOver | `Cmd + F5`                        |
| Stop Talking    | `Ctrl`                            |
| Read All        | `VO + A` (`VO` = `Ctrl + Option`) |
| Next Heading    | `VO + Cmd + H`                    |
| Next Link       | `VO + Cmd + L`                    |
| Rotor Menu      | `VO + U`                          |
| Web Item        | `VO + Right Arrow`                |

---

## Pass Criteria

For each route tested, verify:

1. ✅ **Page Structure**: Logical heading hierarchy, landmarks present
2. ✅ **Navigation**: All links and buttons reachable and understandable
3. ✅ **Forms**: Labels, errors, and hints announced correctly
4. ✅ **Images**: Appropriate alt text (descriptive or absent for decorative)
5. ✅ **Modals**: Proper announcement, focus trap, Esc functionality
6. ✅ **Dynamic Content**: Live regions announce updates

---

## Testing Routes

Test the following critical paths:

- [ ] `/en` (Homepage)
- [ ] `/en?q=health` (Search results)
- [ ] `/en/service/kids-help-phone` (Service detail)
- [ ] `/en/submit-service` (Form submission)
- [ ] `/en/dashboard` (Dashboard overview - logged in)
- [ ] `/en/about` (About page)
- [ ] `/en/accessibility` (Accessibility statement)

---

## Documenting Results

For each issue found:

1. **Route**: Where the issue occurs
2. **Element**: What element has the issue
3. **Expected**: What should be announced
4. **Actual**: What is actually announced
5. **Screen Reader**: Which tool (NVDA, VoiceOver, etc.)
6. **Severity**: Critical, Serious, Moderate, Minor

Example:

```
Route: /en/submit-service
Element: Email input (after error)
Expected: "Email, required, edit, Invalid email format"
Actual: "Email, edit" (error not announced)
Screen Reader: NVDA 2024.1
Severity: Critical (WCAG 3.3.1 violation)
```

---

## Frequency

- **Initial Testing**: Before v17.3 release
- **Regression Testing**: Before each major release
- **Quarterly Audits**: Every 3 months
- **After Major Changes**: When adding new pages or components

---

## Resources

- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [VoiceOver Commands](https://support.apple.com/guide/voiceover/welcome/mac)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [WCAG 2.1 Checklist](https://www.w3.org/WAI/WCAG21/quickref/)
