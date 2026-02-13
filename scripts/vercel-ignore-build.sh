#!/bin/bash
# Exit 1 = Build, Exit 0 = Skip

# Always build main
[[ "$VERCEL_GIT_COMMIT_REF" == "main" ]] && exit 1

# First deployment
[[ -z "$VERCEL_GIT_PREVIOUS_SHA" ]] && exit 1

# Get changed files
CHANGED=$(git diff --name-only $VERCEL_GIT_PREVIOUS_SHA $VERCEL_GIT_COMMIT_SHA)

# If any important files changed, build
if echo "$CHANGED" | grep -qE '^(app|src|pages|components|lib|public|styles|package\.json|next\.config|tsconfig\.json)'; then
  echo "App code changed - building"
  exit 1
fi

# Only docs/tests changed - skip build
echo "Only docs/tests changed - skipping build"
exit 0
