#!/bin/bash
# Root Directory Hygiene Check
# Ensures no unexpected files accumulate in the project root
# Run: npm run check:root or ./scripts/check-root-hygiene.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# List of allowed files/patterns in the project root
# Update this list when adding legitimate new root files
ALLOWED_FILES=(
  # Documentation
  "README.md"
  "CHANGELOG.md"
  "CONTRIBUTING.md"
  "SECURITY.md"
  "LICENSE"
  "DEPLOY.md"
  "VERCEL-OPTIMIZATION.md"
  "VERCEL-SETUP-COMPLETE.md"
  "CLAUDE.md"
  "GEMINI.md"
  "AGENTS.md"
  
  # Package management
  "package.json"
  "package-lock.json"
  
  # Config files
  "tsconfig.json"
  "next.config.ts"
  "middleware.ts"
  "Dockerfile"
  "eslint.config.mjs"
  "prettier.config.js"
  "postcss.config.js"
  "vitest.config.mts"
  "vitest.setup.ts"
  "playwright.config.ts"
  "capacitor.config.ts"
  "mkdocs.yml"
  "requirements.txt"
  "commitlint.config.js"
  "git-conventional-commits.yaml"
  "components.json"

  # Deployment
  "vercel.json"

  # Hidden/dotfiles (listed separately)
  ".gitignore"
  ".prettierignore"
  ".env.example"
  ".env.local"
  ".pre-commit-config.yaml"
  ".all-contributorsrc"
  ".npmrc"
  
  # Auto-generated (in .gitignore, but exist locally)
  "next-env.d.ts"
  "tsconfig.tsbuildinfo"
)

# Allowed directories
ALLOWED_DIRS=(
  ".agent"
  ".claude"
  ".git"
  ".github"
  ".husky"
  ".next"
  ".vscode"
  "android"
  "app"
  "assets"
  "bin"
  "components"
  "coverage"
  "data"
  "docs"
  "hooks"
  "i18n"
  "lib"
  "messages"
  "node_modules"
  "playwright-report"
  "public"
  "scripts"
  "styles"
  "supabase"
  "test-results"
  "tests"
  "types"
  "utils"
)

echo "🔍 Checking root directory hygiene..."
echo ""

UNEXPECTED_FILES=()
UNEXPECTED_DIRS=()

cd "$PROJECT_ROOT"

# Check for unexpected files
for file in *; do
  if [[ -f "$file" ]]; then
    is_allowed=false
    for allowed in "${ALLOWED_FILES[@]}"; do
      if [[ "$file" == "$allowed" ]]; then
        is_allowed=true
        break
      fi
    done
    if [[ "$is_allowed" == false ]]; then
      UNEXPECTED_FILES+=("$file")
    fi
  fi
done

# Check for unexpected directories (excluding hidden)
for dir in */; do
  dir="${dir%/}"
  if [[ -d "$dir" ]]; then
    is_allowed=false
    for allowed in "${ALLOWED_DIRS[@]}"; do
      if [[ "$dir" == "$allowed" ]]; then
        is_allowed=true
        break
      fi
    done
    if [[ "$is_allowed" == false ]]; then
      UNEXPECTED_DIRS+=("$dir")
    fi
  fi
done

if [[ ${#UNEXPECTED_FILES[@]} -eq 0 && ${#UNEXPECTED_DIRS[@]} -eq 0 ]]; then
  echo "✅ Root directory is clean!"
  exit 0
else
  echo "⚠️  Unexpected items found in project root:"
  echo ""
  
  if [[ ${#UNEXPECTED_FILES[@]} -gt 0 ]]; then
    echo "📄 Files:"
    for file in "${UNEXPECTED_FILES[@]}"; do
      echo "   - $file"
    done
  fi
  
  if [[ ${#UNEXPECTED_DIRS[@]} -gt 0 ]]; then
    echo "📁 Directories:"
    for dir in "${UNEXPECTED_DIRS[@]}"; do
      echo "   - $dir/"
    done
  fi
  
  echo ""
  echo "Please either:"
  echo "  1. Move/delete these files to their proper location"
  echo "  2. Add them to scripts/check-root-hygiene.sh if they're legitimate"
  echo ""
  exit 1
fi
