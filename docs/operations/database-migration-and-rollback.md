# Database Change Safety

**Last Updated:** 2026-06-05

This public guide documents database-change principles. Exact production SQL execution steps, host access details, backup locations, and emergency rollback commands belong in private/shared operations material.

## Principles

1. Never assume production schema matches local migrations without read-only preflight.
2. Keep migrations reviewed, minimal, and reversible where practical.
3. Do not run production writes until rollback or compensating steps are documented privately.
4. Validate public/private Supabase boundaries after policy or view changes.
5. Run data validation when service records are affected.

## Public Checks

```bash
npm run validate-data
npm run db:verify
npm run type-check
npm test
```

Use local or disposable test databases for development validation. Live execution requires private/shared operations procedures.
