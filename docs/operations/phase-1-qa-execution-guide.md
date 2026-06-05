# Public QA Execution Guide

**Last Updated:** 2026-06-04

This guide describes public-safe QA execution for CareConnect. Private host access, production credentials, deployment commands, and live monitoring procedures are intentionally excluded.

## Suggested Flow

1. Install dependencies.
2. Run lint, type-check, build, and targeted tests.
3. Start the local app.
4. Test core search and service-detail workflows.
5. Test crisis-resource routing.
6. Test keyboard and screen reader basics.
7. Record issues without raw sensitive user queries.

## Local Commands

```bash
npm install
npm run lint
npm run type-check
npm run build
npm test
npm run dev
```
