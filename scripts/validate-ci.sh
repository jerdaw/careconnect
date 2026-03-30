#!/bin/bash
# Local CI Validation Script
# Run all CI checks locally before pushing

set -e

echo "🔍 Running local CI validation..."
echo ""

echo "📝 Checking code formatting with Prettier..."
npx prettier --check .
echo "✅ Prettier check passed"
echo ""

echo "🔧 Running ESLint..."
npm run lint
echo "✅ ESLint passed"
echo ""

echo "📋 Running type check..."
npm run type-check
echo "✅ Type check passed"
echo ""

echo "🔗 Checking repo references..."
npm run check:refs
echo "✅ Reference check passed"
echo ""

echo "🧪 Running unit tests..."
npm run test -- --run
echo "✅ Unit tests passed"
echo ""

if [[ "${RUN_PLAYWRIGHT_LOCAL:-false}" == "true" ]]; then
  echo "🎭 Running E2E tests (Playwright)..."
  npm run test:e2e
  echo "✅ E2E tests passed"
  echo ""

  echo "♿ Running Accessibility E2E tests (Playwright)..."
  npm run test:a11y
  echo "✅ Accessibility tests passed"
  echo ""
else
  echo "⏭️ Skipping Playwright tests locally (RUN_PLAYWRIGHT_LOCAL=true to enable)."
  echo "✅ Playwright checks deferred to GitHub CI."
  echo ""
fi

echo "ℹ️ Gate 0 decision guard is release-only. Run 'npm run check:v22-gate0' manually when reviewing v22 approvals or preparing a release tag."
echo ""

echo "✨ All CI checks passed! Safe to push."
