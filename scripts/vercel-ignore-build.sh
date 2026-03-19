#!/bin/bash
# Exit 1 = Build, Exit 0 = Skip

set -euo pipefail

# Only build main branch (skip all preview deployments)
if [[ "${VERCEL_GIT_COMMIT_REF:-}" != "main" ]]; then
  echo "Not main branch - skipping preview deployment"
  exit 0
fi

# Main branch: check if important files changed
if [[ -n "${VERCEL_GIT_PREVIOUS_SHA:-}" && -n "${VERCEL_GIT_COMMIT_SHA:-}" ]]; then
  CHANGED=$(git diff --name-only "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" 2>/dev/null || echo "first-commit")
else
  CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "first-commit")
fi

# Build only when root app files change.
if echo "$CHANGED" | grep -qE '^(app|src|pages|components|lib|public|styles)/|^package\.json$|^next\.config(\.[cm]?js|\.ts)?$|^tsconfig\.json$|first-commit'; then
  echo "Main branch with app changes - building"
  exit 1
fi

# Only docs/tests changed on main - skip build
echo "Main branch with only docs/tests changed - skipping"
exit 0
