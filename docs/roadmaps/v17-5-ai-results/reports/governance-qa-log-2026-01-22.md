# v17.5 AI Output Ingestion — Governance QA Log (2026-01-22)

- Generated: `2026-01-22T23:58:46.938761+00:00`
- Baseline (pre-merge): `data/backups/services.2026-01-22T23-48-44-916Z.json`
- Current dataset: `data/services.json`

## Scope

- This log focuses on records that changed in Phase 4 (hours/access_script added).
- Sampling targets per plan: 10 Crisis, 5 Housing, 5 Food (deterministic selection).

## Summary

- Total services changed by merge: **194**
- QA sample size: **20**

## Global Flags (automated)

- Scripts that appear non-English (heuristic): **0**
- Scripts longer than 3 sentences (heuristic): **26**
- Scripts containing marketing/emotional phrasing (heuristic): **0**

Manual fixes applied during QA:

- `acfomi-kingston`: updated `access_script` to English (English-first dataset; French can be added later via `access_script_fr`).

## Evidence Spot-Check (automated)

We ran an availability spot-check for a subset of evidence URLs (prompt3 only). See:

- `docs/roadmaps/v17-5-ai-results/reports/evidence-spotcheck-2026-01-22.md`

Notable outcomes:

- `https://kchc.ca/community-harvest` returned **404** (service: `community-harvest-market`) — treat as a governance follow-up (URL may have changed).

## Sample Table

|   # | id                                 | intent_category | changes              | flags  | evidence (if any)                 |
| --: | ---------------------------------- | --------------- | -------------------- | ------ | --------------------------------- |
|   1 | `amhs-kfla-crisis-line`            | Crisis          | hours                | CRISIS |                                   |
|   2 | `assaulted-womens-helpline`        | Crisis          | hours                | CRISIS |                                   |
|   3 | `coast-mental-health`              | Crisis          | hours, access_script | CRISIS | https://amhs-kfla.ca              |
|   4 | `crisis-988`                       | Crisis          | access_script        | CRISIS |                                   |
|   5 | `crisis-assaulted-womens-helpline` | Crisis          | access_script        | CRISIS |                                   |
|   6 | `crisis-connex-ontario`            | Crisis          | access_script        | CRISIS |                                   |
|   7 | `crisis-good2talk`                 | Crisis          | access_script        | CRISIS |                                   |
|   8 | `crisis-hope-for-wellness`         | Crisis          | access_script        | CRISIS |                                   |
|   9 | `crisis-kids-help-phone`           | Crisis          | access_script        | CRISIS |                                   |
|  10 | `crisis-ontario-gambling`          | Crisis          | access_script        | CRISIS |                                   |
|  11 | `dawn-house-womens-shelter`        | Housing         | hours                |        |                                   |
|  12 | `elizabeth-fry-society-kingston`   | Housing         | hours                |        |                                   |
|  13 | `habitat-for-humanity-kingston`    | Housing         | access_script        |        |                                   |
|  14 | `habitat-restore-kingston`         | Housing         | hours                |        |                                   |
|  15 | `in-from-the-cold`                 | Housing         | hours, access_script |        |                                   |
|  16 | `community-harvest-market`         | Food            | hours, access_script |        | https://kchc.ca/community-harvest |
|  17 | `good-food-box-kingston`           | Food            | hours                |        |                                   |
|  18 | `lionhearts-fresh-food-market`     | Food            | hours, access_script |        |                                   |
|  19 | `loving-spoonful`                  | Food            | hours                |        |                                   |
|  20 | `lunch-by-george`                  | Food            | hours                |        |                                   |

## Detailed Checks

### `amhs-kfla-crisis-line` — AMHS-KFLA 24/7 Crisis Line (Crisis)

- Changes: hours_added=True, access_script_added=False

**Access script**

```text
Hi, I'm feeling really overwhelmed and having suicidal thoughts. I need to talk to someone right away.
```

**Structured hours**

```json
{
  "monday": {
    "open": "00:00",
    "close": "23:59"
  },
  "tuesday": {
    "open": "00:00",
    "close": "23:59"
  },
  "wednesday": {
    "open": "00:00",
    "close": "23:59"
  },
  "thursday": {
    "open": "00:00",
    "close": "23:59"
  },
  "friday": {
    "open": "00:00",
    "close": "23:59"
  },
  "saturday": {
    "open": "00:00",
    "close": "23:59"
  },
  "sunday": {
    "open": "00:00",
    "close": "23:59"
  },
  "notes": "24/7 crisis line; walk-in crisis clinic Mon-Fri 08:30-15:30"
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] Verify crisis safety posture is appropriate (no medical advice; no harmful instructions).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `assaulted-womens-helpline` — Assaulted Women's Helpline (AWHL) (Crisis)

- Changes: hours_added=True, access_script_added=False

**Access script**

```text
Hello, I am in an unsafe situation at home and I need to know my options for leaving.
```

**Structured hours**

```json
{
  "monday": {
    "open": "00:00",
    "close": "23:59"
  },
  "tuesday": {
    "open": "00:00",
    "close": "23:59"
  },
  "wednesday": {
    "open": "00:00",
    "close": "23:59"
  },
  "thursday": {
    "open": "00:00",
    "close": "23:59"
  },
  "friday": {
    "open": "00:00",
    "close": "23:59"
  },
  "saturday": {
    "open": "00:00",
    "close": "23:59"
  },
  "sunday": {
    "open": "00:00",
    "close": "23:59"
  }
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] Verify crisis safety posture is appropriate (no medical advice; no harmful instructions).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `coast-mental-health` — COAST (Crisis Outreach) (Crisis)

- Changes: hours_added=True, access_script_added=True
- Evidence URLs (from prompt3 report): https://amhs-kfla.ca

**Access script**

```text
Call 613-544-4229 for assistance, or visit https://amhs-kfla.ca. If you are in immediate danger, call 911.
```

**Structured hours**

```json
{
  "monday": {
    "open": "00:00",
    "close": "23:59"
  },
  "tuesday": {
    "open": "00:00",
    "close": "23:59"
  },
  "wednesday": {
    "open": "00:00",
    "close": "23:59"
  },
  "thursday": {
    "open": "00:00",
    "close": "23:59"
  },
  "friday": {
    "open": "00:00",
    "close": "23:59"
  },
  "saturday": {
    "open": "00:00",
    "close": "23:59"
  },
  "sunday": {
    "open": "00:00",
    "close": "23:59"
  },
  "notes": "24/7 crisis line (mobile team dispatched as needed)."
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] Verify crisis safety posture is appropriate (no medical advice; no harmful instructions).
- [ ] Open the evidence URL(s) and confirm hours/access statements.
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `crisis-988` — 9-8-8 Suicide Crisis Helpline (Crisis)

- Changes: hours_added=False, access_script_added=True

**Access script**

```text
Call or text 988. No fees. If you are in immediate danger, call 911.
```

**Structured hours**

```json
{
  "notes": "24/7"
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] Verify crisis safety posture is appropriate (no medical advice; no harmful instructions).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `crisis-assaulted-womens-helpline` — Assaulted Women's Helpline (AWHL) (Crisis)

- Changes: hours_added=False, access_script_added=True

**Access script**

```text
Call 1-866-863-0511. No fees. If you are in immediate danger, call 911.
```

**Structured hours**

```json
{
  "notes": "24/7. TTY: 1-866-863-7868."
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] Verify crisis safety posture is appropriate (no medical advice; no harmful instructions).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `crisis-connex-ontario` — ConnexOntario (Crisis)

- Changes: hours_added=False, access_script_added=True

**Access script**

```text
Call 1-866-531-2600 or visit https://connexontario.ca. No fees. If you are in immediate danger, call 911.
```

**Structured hours**

```json
{
  "notes": "24/7. Text CONNEX to 247247."
}
```

**Automated findings**

- ⚠️ Script: More than 3 sentences (4)

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] Verify crisis safety posture is appropriate (no medical advice; no harmful instructions).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `crisis-good2talk` — Good2Talk (Crisis)

- Changes: hours_added=False, access_script_added=True

**Access script**

```text
Call 1-866-925-5454 or text GOOD2TALKON to 686868. No fees. If you are in immediate danger, call 911.
```

**Structured hours**

```json
{
  "notes": "24/7. Text GOOD2TALKON to 686868."
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] Verify crisis safety posture is appropriate (no medical advice; no harmful instructions).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `crisis-hope-for-wellness` — Hope for Wellness Helpline (Crisis)

- Changes: hours_added=False, access_script_added=True

**Access script**

```text
Call 855-242-3310. No fees. If you are in immediate danger, call 911.
```

**Structured hours**

```json
{
  "notes": "24/7. Online chat available."
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] Verify crisis safety posture is appropriate (no medical advice; no harmful instructions).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `crisis-kids-help-phone` — Kids Help Phone (Crisis)

- Changes: hours_added=False, access_script_added=True

**Access script**

```text
Call 1-800-668-6868 or text 686868. No fees. If you are in immediate danger, call 911.
```

**Structured hours**

```json
{
  "notes": "24/7. Text CONNECT to 686868."
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] Verify crisis safety posture is appropriate (no medical advice; no harmful instructions).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `crisis-ontario-gambling` — Ontario Problem Gambling Helpline (Crisis)

- Changes: hours_added=False, access_script_added=True

**Access script**

```text
Call 1-888-230-3505. No fees. If you are in immediate danger, call 911.
```

**Structured hours**

```json
{
  "notes": "24/7"
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] Verify crisis safety posture is appropriate (no medical advice; no harmful instructions).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `dawn-house-womens-shelter` — Dawn House (Housing)

- Changes: hours_added=True, access_script_added=False

**Access script**

```text
Hi, I'm looking for long-term housing support for women. How can I get on your waitlist?
```

**Structured hours**

```json
{
  "monday": {
    "open": "09:00",
    "close": "16:00"
  },
  "tuesday": {
    "open": "09:00",
    "close": "16:00"
  },
  "wednesday": {
    "open": "09:00",
    "close": "16:00"
  },
  "thursday": {
    "open": "09:00",
    "close": "16:00"
  },
  "friday": {
    "open": "09:00",
    "close": "16:00"
  },
  "saturday": {
    "open": "13:00",
    "close": "16:00"
  }
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `elizabeth-fry-society-kingston` — Elizabeth Fry Society of Kingston (Housing)

- Changes: hours_added=True, access_script_added=False

**Access script**

```text
Hi, I am being released soon and will have nowhere to go. Do you have any supportive housing units available?
```

**Structured hours**

```json
{
  "monday": {
    "open": "08:30",
    "close": "16:30"
  },
  "tuesday": {
    "open": "08:30",
    "close": "16:30"
  },
  "wednesday": {
    "open": "08:30",
    "close": "16:30"
  },
  "thursday": {
    "open": "08:30",
    "close": "16:30"
  },
  "friday": {
    "open": "08:30",
    "close": "16:30"
  }
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `habitat-for-humanity-kingston` — Habitat for Humanity Kingston (Housing)

- Changes: hours_added=False, access_script_added=True

**Access script**

```text
Visit https://habitatkingston.com for information.
```

**Structured hours**

```json
null
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `habitat-restore-kingston` — Habitat for Humanity Kingston ReStore (Housing)

- Changes: hours_added=True, access_script_added=False

**Access script**

```text
Hi, I have some furniture I'd like to donate. Do you offer pick-up services?
```

**Structured hours**

```json
{
  "monday": {
    "open": "10:00",
    "close": "18:00"
  },
  "tuesday": {
    "open": "10:00",
    "close": "18:00"
  },
  "wednesday": {
    "open": "10:00",
    "close": "18:00"
  },
  "thursday": {
    "open": "10:00",
    "close": "18:00"
  },
  "friday": {
    "open": "10:00",
    "close": "18:00"
  },
  "saturday": {
    "open": "10:00",
    "close": "18:00"
  },
  "sunday": {
    "open": "10:00",
    "close": "16:00"
  }
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `in-from-the-cold` — In From the Cold Emergency Shelter (Housing)

- Changes: hours_added=True, access_script_added=True

**Access script**

```text
Call 613-542-6672 or email info@kingstonhomebase.ca or visit 540 Montreal St, Kingston, ON K7K 3J2. No fees.
```

**Structured hours**

```json
{
  "monday": {
    "open": "00:00",
    "close": "23:59"
  },
  "tuesday": {
    "open": "00:00",
    "close": "23:59"
  },
  "wednesday": {
    "open": "00:00",
    "close": "23:59"
  },
  "thursday": {
    "open": "00:00",
    "close": "23:59"
  },
  "friday": {
    "open": "00:00",
    "close": "23:59"
  },
  "saturday": {
    "open": "00:00",
    "close": "23:59"
  },
  "sunday": {
    "open": "00:00",
    "close": "23:59"
  }
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `community-harvest-market` — Community Harvest Kingston (Food)

- Changes: hours_added=True, access_script_added=True
- Evidence URLs (from prompt3 report): https://kchc.ca/community-harvest

**Access script**

```text
Call 613-546-2620 for assistance, or visit https://www.kchc.ca/community-harvest.
```

**Structured hours**

```json
{
  "monday": {
    "open": "08:30",
    "close": "16:30"
  },
  "tuesday": {
    "open": "08:30",
    "close": "16:30"
  },
  "wednesday": {
    "open": "08:30",
    "close": "16:30"
  },
  "thursday": {
    "open": "08:30",
    "close": "16:30"
  },
  "friday": {
    "open": "08:30",
    "close": "16:30"
  },
  "notes": "Office hours listed; Good Food Box pick-up on the 3rd Thursday each month."
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] Open the evidence URL(s) and confirm hours/access statements.
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `good-food-box-kingston` — The Good Food Box Kingston (Food)

- Changes: hours_added=True, access_script_added=False

**Access script**

```text
Hi, I'd like to order a Good Food Box for this month. When is the deadline?
```

**Structured hours**

```json
{
  "monday": {
    "open": "08:30",
    "close": "16:30"
  },
  "tuesday": {
    "open": "08:30",
    "close": "16:30"
  },
  "wednesday": {
    "open": "08:30",
    "close": "16:30"
  },
  "thursday": {
    "open": "08:30",
    "close": "16:30"
  },
  "friday": {
    "open": "08:30",
    "close": "16:30"
  },
  "notes": "Monthly pick-up on 3rd Thursday"
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `lionhearts-fresh-food-market` — Lionhearts Fresh Food Market (Food)

- Changes: hours_added=True, access_script_added=True

**Access script**

```text
Email info@freshfoodmkt.ca or visit Various Locations (Pop-up). Fees: Cost of goods subsidized.
```

**Structured hours**

```json
{
  "notes": "Schedule varies by location. For example, Tuesdays 10:00-13:00 at Seniors Centre. Check website for full schedule."
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `loving-spoonful` — Loving Spoonful (Food)

- Changes: hours_added=True, access_script_added=False

**Access script**

```text
Hi, I'd like to learn more about joining a community garden or cooking workshop.
```

**Structured hours**

```json
{
  "monday": {
    "open": "09:00",
    "close": "17:00"
  },
  "tuesday": {
    "open": "09:00",
    "close": "17:00"
  },
  "wednesday": {
    "open": "09:00",
    "close": "17:00"
  },
  "thursday": {
    "open": "09:00",
    "close": "17:00"
  },
  "friday": {
    "open": "09:00",
    "close": "17:00"
  }
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

### `lunch-by-george` — Lunch by George (Outreach St. George's Kingston) (Food)

- Changes: hours_added=True, access_script_added=False

**Access script**

```text
Hi, I heard you offer a hot lunch. What time do you start serving?
```

**Structured hours**

```json
{
  "monday": {
    "open": "09:00",
    "close": "12:30"
  },
  "tuesday": {
    "open": "09:00",
    "close": "12:30"
  },
  "wednesday": {
    "open": "09:00",
    "close": "12:30"
  },
  "thursday": {
    "open": "09:00",
    "close": "12:30"
  },
  "friday": {
    "open": "09:00",
    "close": "12:30"
  },
  "notes": "Breakfast 09:00-10:30; Lunch 11:00-12:30 (weekdays)"
}
```

**Automated findings**

- ✅ No automated issues detected

**Manual QA checklist (human)**

- [ ] Verify access_script factuality (no invented intake rules / docs / fees).
- [ ] Verify contact method(s) match the service’s official channel(s).
- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.

## Phase 6 Status

- Automated sampling + checks: ✅ completed
- Manual verification (URLs / factuality): ⏳ pending (recommended before closing Phase 6)
