---
status: archived
last_updated: 2026-04-29
owner: jer
tags: [homepage, ui, archive]
---

# Homepage Premium UI Analysis

> Historical note: this analysis records an earlier premium UI pass. The current
> resting homepage discovery layer is documented in
> [Component Usage Guide](../development/components.md#homepage-discovery-layer),
> and the 2026-04-29 closeout is archived in
> [v20.0 Homepage Search UX Polish](../planning/archive/2026-04-29-v20-0-homepage-search-ux-polish.md).

## Overview

Analysis of the homepage (`app/[locale]/page.tsx`) after the initial premium-ui-upgrade work, identifying what's working and what needs refinement to move from "gaudy" to "premium."

## What's Working

- **Modular component architecture** — SearchBar, HomeStats, CategoryBrowseGrid, HowItWorks, and PartnerCTA are cleanly separated
- **Animated search border** — spinning idle / static active gradient is distinctive and polished
- **Strong accessibility foundations** — aria labels, focus states, keyboard support throughout
- **i18n infrastructure** — 7 locales with next-intl, all components use translation keys
- **Dark mode support** — consistent across all components

## Top 10 Issues (Impact-Ordered)

| #   | Issue                                                                                | Impact | Component          |
| --- | ------------------------------------------------------------------------------------ | ------ | ------------------ |
| 1   | Mesh gradient too heavy — three 50-60% viewport blobs at 40% opacity with animations | High   | `page.tsx`         |
| 2   | `hover:scale` on search container — jittery and gimmicky on primary interaction      | High   | `page.tsx`         |
| 3   | Hero subtitle is generic — lacks specificity and urgency                             | High   | `messages/*.json`  |
| 4   | HomeStats visually flat — plain numbers with no color or weight                      | Medium | `HomeStats.tsx`    |
| 5   | PartnerCTA weak hierarchy — two low-contrast buttons, no visual pull                 | Medium | `PartnerCTA.tsx`   |
| 6   | Inconsistent section spacing — py-10, py-12, py-16 creates arrhythmic flow           | Medium | All sections       |
| 7   | Quick search chips visually weak — small neutral pills don't invite interaction      | Medium | `SearchChips.tsx`  |
| 8   | Historical: the separate TrustStrip surface was later removed                        | Low    | Homepage discovery |
| 9   | HowItWorks steps generic — numbered circles functional but not premium               | Low    | `HowItWorks.tsx`   |
| 10  | Duplicate `searchChips` i18n key in en.json — first block silently overwritten       | Bug    | `messages/en.json` |

## Premium Aesthetic Risks

- The `bg-noise` texture overlay at z-50 — keep at 3% opacity
- Don't add more glassmorphism to sections that don't need it
- Don't add entrance animations to every section
- Don't add gradient text to anything other than the hero title
- ModelStatus cycling text ("Privacy First" / "Neural Search Active") adds marginal value but isn't harmful enough to remove
