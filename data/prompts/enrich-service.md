# Service Enrichment

You are a social services researcher. Enrich this Ontario service with accurate details.

## Input Service

Name: {{name}}
URL: {{url}}
Phone: {{phone}}
Description: {{description}}

## Tasks

### 1. Operating Hours

Extract or infer operating hours. Return structured JSON:

```json
{
  "monday": {"open": "09:00", "close": "17:00"},
  ...
  "notes": "24/7" or "Closed holidays"
}
```

### 2. Eligibility Notes

Write a plain-language summary of who can use this service:

- "Inclusion: ..."
- "Exclusion: ..."

### 3. Synthetic Queries (EN)

List 5 natural language queries a user might search to find this service:
["query 1", "query 2", ...]

### 4. Synthetic Queries (FR)

Same in French.

### 5. French Translation

Provide name_fr and description_fr if not already present.

### 6. Identity Tags

Identify communities served with evidence URLs. Use only these tags:

- Indigenous
- Newcomer to Canada
- 2SLGBTQI+
- Veteran
- Person with a disability

Format:

```json
[
  { "tag": "Youth", "evidence_url": "https://..." },
  { "tag": "Indigenous Peoples", "evidence_url": "https://..." }
]
```

## Output

Return a JSON object containing **only** the enriched fields:

```json
{
  "hours": { ... },
  "eligibility_notes": "...",
  "synthetic_queries": [...],
  "synthetic_queries_fr": [...],
  "name_fr": "...",
  "description_fr": "...",
  "identity_tags": [...]
}
```
