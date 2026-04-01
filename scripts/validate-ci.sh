#!/bin/bash
# Local CI Validation Script
# Run all CI checks locally before pushing

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib/local-supabase.sh"
trap hb_cleanup_local_supabase EXIT

echo "🔍 Running local CI validation..."
echo ""

echo "🔒 Running security audit (non-blocking, matches GitHub CI)..."
if npm audit --audit-level=high; then
  echo "✅ Security audit completed"
else
  echo "⚠️ Security audit reported issues (non-blocking locally, matches GitHub CI)"
fi
echo ""

echo "📝 Checking code formatting with Prettier..."
npm run format:check
echo "✅ Prettier check passed"
echo ""

echo "🔧 Running ESLint..."
npm run lint
echo "✅ ESLint passed"
echo ""

echo "🗃️ Validating service data..."
npm run validate-data
echo "✅ Service data validation passed"
echo ""

echo "📋 Running type check..."
npm run type-check
echo "✅ Type check passed"
echo ""

echo "🌍 Auditing i18n keys..."
npm run i18n-audit
echo "✅ i18n audit passed"
echo ""

echo "🧹 Checking project root hygiene..."
npm run check:root
echo "✅ Root hygiene check passed"
echo ""

echo "🔗 Checking repo references..."
npm run check:refs
echo "✅ Reference check passed"
echo ""

echo "🛡️ Validating security headers..."
npm run validate:security-headers
echo "✅ Security header validation passed"
echo ""

echo "🧪 Running unit tests with coverage..."
npm run test:coverage
echo "✅ Unit tests with coverage passed"
echo ""

if [[ "${RUN_DB_LOCAL:-auto}" == "true" ]]; then
  echo "🗄️ RUN_DB_LOCAL=true, requiring local DB integration tests..."
  npm run test:db
  echo "✅ DB integration tests passed"
  echo ""
elif [[ "${RUN_DB_LOCAL:-auto}" == "false" ]]; then
  echo "⏭️ Skipping DB integration tests locally (RUN_DB_LOCAL=false)."
  echo "ℹ️ Run 'npm run test:db' on a Docker + psql machine when changing DB/auth lanes."
  echo ""
elif hb_can_use_docker >/dev/null 2>&1 && command -v psql >/dev/null 2>&1; then
  echo "🗄️ Running DB integration tests..."
  npm run test:db
  echo "✅ DB integration tests passed"
  echo ""
else
  echo "⏭️ Skipping DB integration tests locally (Docker daemon and/or psql unavailable)."
  echo "ℹ️ Run 'npm run test:db' on a Docker + psql machine, or rely on GitHub CI for this lane."
  echo ""
fi

echo "🏗️ Building application..."
npm run build
echo "✅ Build passed"
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
