# Git Workflow & CI/CD Guide

This project follows strict engineering best practices to ensure code quality and stability.

## 1. Commit Messages (Mandatory)

We enforce **Conventional Commits** using `commitlint`. Your commit messages must follow this format:

```
<type>(<scope>): <subject>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

**Examples:**
- ✅ `feat(search): add fuzzy matching logic`
- ✅ `fix(ui): resolve button alignment on mobile`
- ❌ `fixed ui` (Invaild format)

> **Auto-Check**: A `commit-msg` hook will prevent you from committing if the message doesn't match this format.

## 2. Pre-Commit Verification

Before every commit, `lint-staged` runs automatically to:
- Run `eslint` on staged files (and fix auto-fixable errors)
- Run `vitest related` to run only unit tests related to changed files
- Run `tsc` to verify type safety

## 3. Pre-Push Verification

Before pushing to the remote repository, a `pre-push` hook runs:
- **Full Unit Test Suite**: Using `vitest`

This ensures that you don't push broken code to the CI.

> **Emergency Override**: In rare cases where you need to bypass these hooks (e.g. WIP save), use `git commit --no-verify` or `git push --no-verify`.

## 4. Continuous Integration (GitHub Actions)

Our CI pipeline runs on every PR and push to `main`:

1.  **Static Analysis**: Runs Linting and Type Checking in parallel.
2.  **Unit Tests**: Runs the full Vitest suite.
3.  **E2E Tests**: Runs Playwright tests.
4.  **Build**: Verifies the application builds for production.

All checks must pass before merging.
