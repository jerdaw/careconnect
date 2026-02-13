#!/bin/bash
# Copy Vercel optimization config to another repo
# Usage: ./scripts/copy-vercel-config.sh ../visitbrief

if [ -z "$1" ]; then
  echo "Usage: ./scripts/copy-vercel-config.sh <target-repo-path>"
  echo "Example: ./scripts/copy-vercel-config.sh ../visitbrief"
  exit 1
fi

TARGET_REPO="$1"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "📋 Copying Vercel Optimization Config"
echo "======================================"
echo "Target: $TARGET_REPO"
echo ""

# Check target exists
if [ ! -d "$TARGET_REPO" ]; then
  echo -e "${RED}✗ Target directory does not exist: $TARGET_REPO${NC}"
  exit 1
fi

# 1. Copy .vercelignore
echo "Copying .vercelignore..."
if [ -f ".vercelignore" ]; then
  cp .vercelignore "$TARGET_REPO/.vercelignore"
  echo -e "${GREEN}✓${NC} .vercelignore copied"
else
  echo -e "${RED}✗${NC} .vercelignore not found in source"
fi

# 2. Copy VERCEL-OPTIMIZATION.md
echo "Copying VERCEL-OPTIMIZATION.md..."
if [ -f "VERCEL-OPTIMIZATION.md" ]; then
  cp VERCEL-OPTIMIZATION.md "$TARGET_REPO/VERCEL-OPTIMIZATION.md"
  echo -e "${GREEN}✓${NC} VERCEL-OPTIMIZATION.md copied"
else
  echo -e "${YELLOW}⚠${NC} VERCEL-OPTIMIZATION.md not found"
fi

# 3. Copy verification scripts
echo "Copying scripts..."
if [ -d "scripts" ]; then
  mkdir -p "$TARGET_REPO/scripts"

  if [ -f "scripts/verify-vercel-optimization.sh" ]; then
    cp scripts/verify-vercel-optimization.sh "$TARGET_REPO/scripts/"
    chmod +x "$TARGET_REPO/scripts/verify-vercel-optimization.sh"
    echo -e "${GREEN}✓${NC} verify-vercel-optimization.sh copied"
  fi

  if [ -f "scripts/apply-vercel-optimization.sh" ]; then
    cp scripts/apply-vercel-optimization.sh "$TARGET_REPO/scripts/"
    chmod +x "$TARGET_REPO/scripts/apply-vercel-optimization.sh"
    echo -e "${GREEN}✓${NC} apply-vercel-optimization.sh copied"
  fi
fi

echo ""
echo "======================================"
echo -e "${GREEN}✓ Files copied successfully!${NC}"
echo ""
echo "Next steps in $TARGET_REPO:"
echo "1. Review and update vercel.json (add cache headers and autoJobCancelation)"
echo "2. Update next.config (add standalone output and optimizations)"
echo "3. Run: bash scripts/apply-vercel-optimization.sh"
echo "4. Commit and deploy"
echo ""
echo "See VERCEL-OPTIMIZATION.md for detailed instructions."
