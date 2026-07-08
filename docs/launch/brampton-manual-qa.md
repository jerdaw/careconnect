# Brampton Manual QA

Date: 2026-07-06
Updated: 2026-07-08

## Environment

- Local app: pass, `npm run dev` served `http://localhost:3000`.
- HTTP availability: pass, `curl -I http://localhost:3000/en` returned `HTTP/1.1 200 OK`.
- Browser automation: pass after user-space dependency extraction. Passwordless sudo is unavailable, so Ubuntu packages were downloaded with `apt-get download` and extracted to `/tmp/careconnect-local-deps` instead of installed system-wide.
- Chrome-control fallback: blocked by connector metadata failure before browser selection: `sandboxCwd is not a local file URI: file:///home/jer/repos/vps/careconnect`.
- 2026-07-07 rerun: `npm run test:a11y -- --project=chromium` passed with 10 Chromium tests after adding extracted `libnspr4` and `libnss3` libraries to `LD_LIBRARY_PATH`.
- Recreate the local dependency path if `/tmp` has been cleared:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
mkdir -p /tmp/careconnect-local-deps /tmp/careconnect-debs
cd /tmp/careconnect-debs
apt-get download libnspr4 libnss3 libpq5 postgresql-client-common postgresql-client-16
for deb in ./*.deb; do dpkg-deb -x "$deb" /tmp/careconnect-local-deps; done
```

- Rerun browser QA with the extracted libraries:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu/nss:${LD_LIBRARY_PATH:-} \
  npm run test:a11y -- --project=chromium
```

- Local DB smoke: pass after adding extracted PostgreSQL client binaries to `PATH`.
- 2026-07-07 rerun: `npm run test:db:smoke` passed with 2 Vitest smoke tests against a disposable local Supabase stack.
- Rerun DB smoke with the extracted `psql` binary:

```bash
source ~/.nvm/nvm.sh && nvm use 22.13.1 >/dev/null
PATH=/tmp/careconnect-local-deps/usr/lib/postgresql/16/bin:/tmp/careconnect-local-deps/usr/bin:$PATH \
LD_LIBRARY_PATH=/tmp/careconnect-local-deps/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-} \
  npm run test:db:smoke
```

## Viewports

- Desktop 1440 x 900: pass by `tests/e2e/brampton-visual-qa.spec.ts`; `home-desktop.png` and `search-health-desktop.png` show readable hero/search controls, visible region controls, scannable cards, and no overlapping app UI.
- Tablet 768 x 1024: pass by `tests/e2e/brampton-visual-qa.spec.ts`; `home-tablet.png` confirms the compact header is used and no longer clips the Partner Login action, and `search-health-tablet.png` shows wrapped filters and readable cards.
- Mobile 390 x 844: pass by `tests/e2e/brampton-visual-qa.spec.ts`; `home-mobile.png` and `search-health-mobile.png` show readable text, wrapped chips, visible city controls, and no app UI overlap.
- Screenshot artifacts were regenerated under `test-results/brampton-visual-qa/` and are ignored by git.

## Homepage Region Animation

- Registry-sourced labels: pass by component tests and code review. `RotatingRegionHero` is backed by `getHeroPlaces()`, and `tests/components/home/RotatingRegionHero.test.tsx` passed.
- Reduced motion: pass by component test coverage. `RotatingRegionHero` reduced-motion behavior is covered and passed.
- No text overlap: pass by visual QA screenshot review across desktop, tablet, and mobile.
- Kingston still visible: pass by HTTP markup check. The local homepage server-rendered `Kingston`.
- Brampton visible with accurate status: pass by HTTP markup check before promotion. After 2026-07-07 approval, Brampton is configured as a live supported place with the first L1 launch records.

## Place Selector

- Keyboard reachable: covered by component rendering, semantics, and Chromium a11y test execution; not manually tabbed.
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

- Strict Axe regression: pass, `npx playwright test tests/e2e/accessibility-regression.spec.ts --project=chromium`, 5 Chromium route tests.
- Automated a11y command: pass, `npm run test:a11y -- --project=chromium`, 10 Chromium tests and 0 Axe violations on audited routes.
- Manual keyboard pass: covered by the interactive Playwright a11y suite; not separately human-tabbed.
- Focus order issues: remediated. Active search now unmounts the discovery layer instead of hiding focusable content with `aria-hidden`.
- Contrast issues: remediated for the recorded homepage, active-search, dashboard, submit-service, and service-detail findings.
- Console issues: optional semantic-search worker fetch failure now logs as a warning and is caught by the homepage; the a11y run did not report an unhandled rejection.
- Screen-reader label issues: no issue found in markup/component checks for the place selector.

## Fixes Made

- Added a strict a11y regression spec for the routes that previously logged serious findings.
- Removed hidden focusable homepage discovery content during active searches.
- Strengthened contrast for header, city selector, search chips, filter controls, result cards, badges, feedback actions, trust-panel actions, and service-detail controls.
- Caught optional semantic-search initialization failure so keyword search remains usable without an unhandled rejection.
- Added visual QA screenshot capture for desktop, tablet, and mobile homepage/search states.
- Local environment blockers were bypassed with user-space dependencies under `/tmp/careconnect-local-deps`.

## Open Issues

- The user-space dependency path under `/tmp/careconnect-local-deps` is ephemeral; recreate it or install system packages before future local browser and DB smoke reruns.
- Deferred Brampton draft services still require L1 approval before live data entry.
- Land acknowledgment wording and official relationship wording remain approval-gated.
- Production rollback remains approval-gated; migration, deployment, seven-row data sync, and broad coverage correction were approved, applied, and smoke-tested on 2026-07-08.
