# Contributing to Kingston Care Connect

## Development Workflow
1.  **Branching**: Create a feature branch from `main`.
2.  **Standards**:
    - Use TypeScript for all new code.
    - Use Functional Components with React Hooks.
    - Follow the [Component Library Guide](components.md) for UI consistency.
3.  **UI Components**:
    - Always use the `Button` component from `components/ui/button` instead of raw `<button>` elements.
    - Ensure accessibility (ARIA labels, keyboard navigation).
4.  **Logging**:
    - Do not use `console.log` or `console.error` in production code.
    - Use the `logger` utility from `@/lib/logger`:
      ```tsx
      import { logger } from '@/lib/logger';
      logger.info('Action performed', { detail: '...' });
      ```
5.  **Hooks**:
    - Extract reusable logic into generic hooks in the `hooks/` directory.
    - Ensure hooks are SSR-safe (check `typeof window`).

## Testing Requirements
- **Unit Tests**: Add Vitest tests in `tests/` for new library functions or hooks.
- **E2E Tests**: Add Playwright tests in `tests/e2e/` for new user flows.
- **Type Checking**: Ensure `npx tsc --noEmit` passes.

## Pull Request Checklist
- [ ] Code is formatted with Prettier/ESLint.
- [ ] All tests pass (`npm run test`).
- [ ] Documentation is updated if necessary.
- [ ] No raw `console` calls remain.
