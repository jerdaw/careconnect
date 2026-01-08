# Draft Service File Format

Draft files are JSON files stored in `data/drafts/ontario/{vertical}/`.

## File Naming

`draft-{slug}.json` where slug is lowercase-hyphenated service name.

## Required Fields

- `id`: Unique identifier (format: `ontario-{slug}`)
- `name`: Service name (English)
- `description`: 1-2 sentences
- `phone` or `url`: At least one contact method
- `intent_category`: One of Crisis, Health, Legal, etc.
- `scope`: Always `"ontario"` for provincial services
- `verification_level`: `"L0"` for drafts

## Optional Fields

- `name_fr`, `description_fr`: French translations
- `hours`: Structured hours object
- `eligibility_notes`: Plain language eligibility
- `synthetic_queries`: Search query suggestions
- `identity_tags`: Community tags with evidence

## Meta Object

Every draft must include `_meta`:

```json
{
  "_meta": {
    "source": "Gemini Deep Research",
    "researched_at": "2026-01-07T21:00:00Z",
    "confidence": 0.95,
    "needs_review": true,
    "enriched": false
  }
}
```
