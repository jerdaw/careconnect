# AODA Compliance Report

## Accessibility for Ontarians with Disabilities Act (2005)

CareConnect is committed to providing a barrier-free service to people with disabilities. We strive to ensure our platform is accessible to all users, regardless of ability or technology.

### WCAG 2.1 Level AA Compliance

As of January 20, 2026, CareConnect aims to meet WCAG 2.1 Level AA standards.

#### Perceivable

- [x] **Text Alternatives:** All images have descriptive alt text or are marked as decorative (1.1.1).
- [x] **Time-based Media:** N/A (The platform does not currently host video or audio content).
- [x] **Adaptable:** Content structure is independent of presentation, using proper HTML5 semantics (landmarks, headings, lists) (1.3.1).
- [x] **Distinguishable:** Color contrast ratios meet or exceed 4.5:1 for normal text and 3:1 for large text (1.4.3).

#### Operable

- [x] **Keyboard Accessible:** All functionality is available via keyboard interface (Tab, Enter, Space, Arrow keys) (2.1.1).
- [x] **No Keyboard Trap:** Focus can be moved to and away from all components (2.1.2).
- [x] **Enough Time:** No time-limited content exists (2.2.1).
- [x] **Seizures:** No content flashes more than three times in any one second period (2.3.1).
- [x] **Navigable:** Skip links are provided to bypass repetitive blocks (2.4.1). Focus order is logical and preserves meaning (2.4.3). Focus indicators are visible (2.4.7).

#### Understandable

- [x] **Readable:** The language of the page can be explicitly determined (3.1.1). Content is written in plain language.
- [x] **Predictable:** Navigation mechanisms are consistent across the site (3.2.3).
- [x] **Input Assistance:** Labels or instructions are provided when content requires user input (3.3.2). Error identification is clear (3.3.1).

#### Robust

- [x] **Compatible:** Parsing is robust, and ARIA attributes are used correctly to maximize compatibility with current and future user agents, including assistive technologies (4.1.1).
- [x] **Name, Role, Value:** Review of all interactive elements ensures proper accessible names and roles (4.1.2).

### Evaluation Methods

We utilized the following methods to ensure compliance:

1.  **Automated Testing:**
    - `@axe-core/playwright` audits integrated into CI/CD pipelines.
    - `eslint-plugin-jsx-a11y` for static code analysis.

2.  **Manual Testing:**
    - Keyboard navigation verification (Tab order, focus traps).
    - Screen reader simulation.
    - Color contrast analysis using high-contrast mode testing.

### Support

If you encounter any accessibility barriers on CareConnect, please contact our support team. We are committed to resolving issues promptly.

**Email:** accessibility@careconnect.ing
