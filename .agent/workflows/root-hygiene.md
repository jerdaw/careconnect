---
description: Check and maintain project root directory cleanliness
---

# Root Directory Hygiene Check

This workflow ensures the project root stays clean and organized.

## Running the Check

// turbo

```bash
npm run check:root
```

This validates that only expected files exist in the project root.

## When to Run

- Before committing (optional - add to CI for enforcement)
- After major development sessions
- When onboarding new team members

## What Gets Checked

The script (`scripts/check-root-hygiene.sh`) maintains an allowlist of:

- Documentation files (README, CONTRIBUTING, etc.)
- Config files (tsconfig, next.config, etc.)
- Package management files
- Expected directories

## If Check Fails

1. **Temp/debug files**: Delete them (audit logs, lint outputs, key dumps)
2. **Misplaced scripts**: Move to `scripts/`
3. **Misplaced types**: Move to `types/`
4. **Misplaced docs**: Move to `docs/`
5. **Legitimate new files**: Update the allowlist in `scripts/check-root-hygiene.sh`

## Adding to CI (Optional)

Add to `.github/workflows/ci.yml`:

```yaml
- name: Check root hygiene
  run: npm run check:root
```
