# Brampton Manual QA

Date: 2026-07-06
Updated: 2026-07-07

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

- Desktop 1440 x 900: covered by automated Chromium a11y navigation, but not manually screenshot-reviewed.
- Tablet 768 x 1024: not manually screenshot-reviewed.
- Mobile 390 x 844: not manually screenshot-reviewed.

## Homepage Region Animation

- Registry-sourced labels: pass by component tests and code review. `RotatingRegionHero` is backed by `getHeroPlaces()`, and `tests/components/home/RotatingRegionHero.test.tsx` passed.
- Reduced motion: pass by component test coverage. `RotatingRegionHero` reduced-motion behavior is covered and passed.
- No text overlap: not manually screenshot-reviewed.
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

- Automated a11y command: pass, `npm run test:a11y -- --project=chromium`, 10 Chromium tests.
- Manual keyboard pass: not manually verified.
- Focus order issues: one serious `aria-hidden-focus` axe finding was logged on `/en?q=health` while the suite still passed; this needs follow-up triage because hidden focusable result content can affect keyboard and assistive-technology users.
- Contrast issues: serious `color-contrast` axe findings were logged on `/en`, `/en?q=health`, `/en/dashboard`, `/en/submit-service`, and `/en/service/kids-help-phone` while the suite still passed; this needs separate a11y remediation.
- Console issues: the passing Chromium run also logged a `useSemanticSearch` worker `Failed to fetch` error; triage separately if reproduced during browser QA.
- Screen-reader label issues: no issue found in markup/component checks for the place selector.

## Fixes Made

- No runtime code changes were made during this QA update.
- Local environment blockers were bypassed with user-space dependencies under `/tmp/careconnect-local-deps`.
- Axe follow-up findings were recorded but not remediated in this pass.

## Open Issues

- Full visual QA still needs manual screenshot review across desktop, tablet, and mobile.
- The user-space dependency path under `/tmp/careconnect-local-deps` is ephemeral; recreate it or install system packages before future local browser and DB smoke reruns.
- Axe logged serious contrast and hidden-focus findings even though the Chromium a11y suite passed; track these as follow-up accessibility defects.
- The Chromium run logged a semantic-search worker fetch error even though the suite passed; track as a separate browser-console follow-up.
- Deferred Brampton draft services still require L1 approval before live data entry.
