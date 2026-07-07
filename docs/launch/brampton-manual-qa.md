# Brampton Manual QA

Date: 2026-07-06

## Environment

- Local app: pass, `npm run dev` served `http://localhost:3000`.
- HTTP availability: pass, `curl -I http://localhost:3000/en` returned `HTTP/1.1 200 OK`.
- Browser automation: blocked by local WSL browser dependencies. `npx playwright install chromium` succeeded, but Chromium could not launch because `libnspr4.so`, `libnss3.so`, and `libnssutil3.so` are missing. `npx playwright install-deps chromium --dry-run` showed the required apt packages, but passwordless sudo is unavailable in this session.
- Chrome-control fallback: blocked by connector metadata failure before browser selection: `sandboxCwd is not a local file URI: file:///home/jer/repos/vps/careconnect`.
- 2026-07-07 rerun: `npm run test:a11y -- --project=chromium` started the Playwright web server and attempted 10 Chromium tests. All failed before app assertions because Chromium could not load `libnspr4.so`.
- Rerun browser QA after dependencies are available:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run test:a11y -- --project=chromium
```

- Local DB smoke is blocked until `psql` is installed on PATH. Rerun after `psql --version` succeeds:
- 2026-07-07 rerun: `npm run test:db:smoke` still exited with `Missing required command: psql`.

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
npm run test:db:smoke
```

## Viewports

- Desktop 1440 x 900: not visually verified because browser automation is environment-blocked.
- Tablet 768 x 1024: not visually verified because browser automation is environment-blocked.
- Mobile 390 x 844: not visually verified because browser automation is environment-blocked.

## Homepage Region Animation

- Registry-sourced labels: pass by component tests and code review. `RotatingRegionHero` is backed by `getHeroPlaces()`, and `tests/components/home/RotatingRegionHero.test.tsx` passed.
- Reduced motion: pass by component test coverage. `RotatingRegionHero` reduced-motion behavior is covered and passed.
- No text overlap: not visually verified because browser automation is environment-blocked.
- Kingston still visible: pass by HTTP markup check. The local homepage server-rendered `Kingston`.
- Brampton visible with accurate status: pass by HTTP markup check before promotion. After 2026-07-07 approval, Brampton is configured as a live supported place with the first L1 launch records.

## Place Selector

- Keyboard reachable: covered by component rendering and semantics, but not manually tabbed in browser because browser automation is environment-blocked.
- Screen-reader label present: pass by HTTP markup check. The city selector renders `aria-label="Change city"` and the service-area group renders `aria-label="Service area"`.
- Manual override visible: pass by HTTP markup check. The homepage renders the visible city context `Showing Kingston` and a city combobox.
- Kingston behavior verified: pass by unit/component coverage. Search and selector tests passed with Kingston as the default place.
- Brampton behavior verified: pass by unit/component coverage. Search filtering and selected-place tests passed for Brampton, and the first approved L1 records are now in live data.

## Search Results

- Kingston local results preserved: pass by `tests/hooks/useServices.test.ts`, `tests/lib/search/index.test.ts`, and `tests/components/home/SearchResultsList.test.tsx`.
- Broad coverage results included where appropriate: pass by coverage helper and search tests.
- Brampton does not show Kingston-only local services: pass by coverage helper, local search, server search, and result-list tests.
- Sparse Brampton state is honest: pass by result-list test coverage and copy review. Brampton is represented as a small first launch set, not a complete local directory.

## Accessibility

- Automated a11y command: blocked by local WSL browser dependencies, not by app assertions. The command was `npm run test:a11y -- --project=chromium`.
- Manual keyboard pass: not visually/manual verified because browser automation is environment-blocked.
- Focus order issues: no issue found in unit/component coverage; full browser focus-order test could not run in this environment.
- Screen-reader label issues: no issue found in markup/component checks; full browser a11y audit could not run in this environment.

## Fixes Made

- None during browser QA. The only failures were environment/tooling failures outside the app code.

## Open Issues

- Full visual QA still needs a browser-capable environment or local installation of Chromium dependencies.
- Full automated a11y QA still needs a browser-capable environment or local installation of Chromium dependencies.
- DB smoke QA still needs a local `psql` binary.
- Deferred Brampton draft services still require L1 approval before live data entry.
