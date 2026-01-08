# Ontario-Wide Service Discovery

You are a social services researcher specializing in Ontario, Canada.

## Task

Research {{count}} Ontario-wide services in the **{{vertical}}** category that are available to anyone in Ontario (toll-free phone, virtual, province-wide coverage).

## Requirements

- Services must be currently operating (not defunct)
- Include official government services and major non-profits
- Exclude services limited to specific cities (except if explicitly Ontario-wide)
- Focus on services relevant to vulnerable populations

## Output Format

Return a JSON array of services:

```json
[
  {
    "id": "ontario-{slug}",
    "name": "Service Name",
    "name_fr": "French Name",
    "description": "1-2 sentence description",
    "description_fr": "French description",
    "phone": "1-800-XXX-XXXX or short code",
    "url": "https://official-website.ca",
    "intent_category": "Crisis",
    "scope": "ontario",
    "virtual_delivery": true,
    "confidence": 0.0-1.0
  }
]
```

## Verticals Reference

- **Crisis**: Suicide, mental health crisis, domestic violence, addiction
- **Health**: Telehealth, poison control, health info lines
- **Legal**: Legal aid, human rights, tenant rights
- **Food**: Food banks (rarely provincial, usually local), meal programs
- **Housing**: Shelters (usually local), housing help
- **Wellness**: Counseling, support groups
- **Financial**: OW, ODSP, tax clinics
- **Employment**: Job banks, training
- **Education**: Literacy, upgrading
- **Transport**: Medical transport (provincial programs)
- **Community**: Newcomer services, indigenous centers
- **Indigenous**: Specific provincial programs for indigenous peoples
