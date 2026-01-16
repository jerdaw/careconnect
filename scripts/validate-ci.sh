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

echo "🧪 Running unit tests..."
npm run test -- --run
echo "✅ Unit tests passed"
echo ""

echo "🎭 Running E2E tests..."
npm run test:e2e
echo "✅ E2E tests passed"
echo ""

echo "✨ All CI checks passed! Safe to push."
