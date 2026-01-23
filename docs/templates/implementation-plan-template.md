---
status: draft
last_updated: YYYY-MM-DD
owner: your-github-username
tags: [roadmap, vX.Y]
---

# vX.Y: [Feature Name]

[Brief description of the feature/change and its value proposition]

## User Review Required

> [!IMPORTANT]
> [Highlight breaking changes, deployment requirements, or decisions needing approval]
>
> [!WARNING]
> [Call out compatibility issues or migration complexity]

**If there are no such items, omit this section entirely.**

## Proposed Changes

Group files by component (e.g., package, feature area, dependency layer). Separate components with horizontal rules.

### [Component Name]

Summary of what will change in this component.

#### [MODIFY] `path/to/file.ext`

- Change 1
- Change 2

#### [NEW] `path/to/file.ext`

- Purpose of new file

#### [DELETE] `path/to/file.ext`

- Reason for deletion

---

### [Another Component]

1.  **Zod for API Validation**: All API write endpoints (POST, PUT, PATCH) must use Zod schemas to validate request bodies before processing.
    - **Rationale**: Zod provides runtime validation that infers static TypeScript types, ensuring the runtime data matches our compile-time expectations.
2.  **Linting in Tests**: The `tests/` directory is no longer excluded from ESLint.

## Verification Plan

### Automated Tests

- [ ] Unit tests: `npm test -- pattern`
- [ ] E2E tests: `npm run test:e2e`
- [ ] TypeScript: `npm run typecheck`

### Manual Verification

- [ ] Verify [specific behavior] in dev environment
- [ ] Test edge case: [describe scenario]

## Dependencies

- [Prerequisite work or external dependencies]

## Migration Path

- [Steps to upgrade from previous version, if applicable]
