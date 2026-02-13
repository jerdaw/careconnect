#!/bin/bash
# Apply Vercel optimizations and rebuild
# This script cleans the build and rebuilds with optimizations

set -e

echo "🚀 Applying Vercel Optimizations"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Clean existing build
echo "🧹 Cleaning existing build..."
if [ -d ".next" ]; then
  echo "   Removing .next directory..."
  rm -rf .next
fi

if [ -d "node_modules/.cache" ]; then
  echo "   Removing node_modules cache..."
  rm -rf node_modules/.cache
fi
echo ""

# 2. Verify configuration
echo "✅ Verifying configuration files..."
if [ ! -f ".vercelignore" ]; then
  echo -e "${YELLOW}⚠ Warning: .vercelignore not found${NC}"
  echo "  Create it from VERCEL-OPTIMIZATION.md"
fi

if [ ! -f "vercel.json" ]; then
  echo -e "${YELLOW}⚠ Warning: vercel.json not found${NC}"
fi
echo ""

# 3. Rebuild with optimizations
echo "🔨 Building with optimizations..."
echo "   This may take a few minutes..."
npm run build
echo ""

# 4. Check new build size
echo "📊 Build Results:"
if [ -d ".next" ]; then
  SIZE=$(du -sh .next | cut -f1)
  SIZE_MB=$(du -sm .next | cut -f1)

  echo "   Build size: $SIZE"

  if [ "$SIZE_MB" -lt 500 ]; then
    echo -e "   ${GREEN}✓ Excellent! Build is optimized.${NC}"
  elif [ "$SIZE_MB" -lt 800 ]; then
    echo -e "   ${YELLOW}⚠ Good, but could be better. Target: <500MB${NC}"
  else
    echo -e "   ${YELLOW}⚠ Still large. Consider:${NC}"
    echo "      - Moving large data files to runtime loading"
    echo "      - Removing unused dependencies"
    echo "      - Checking for bundled assets"
  fi

  # Show size breakdown
  echo ""
  echo "   Size breakdown:"
  du -sh .next/* 2>/dev/null | sort -hr | head -5 | while read -r line; do
    echo "      $line"
  done
fi
echo ""

# 5. Run verification
echo "🔍 Running verification..."
echo ""
if [ -f "scripts/verify-vercel-optimization.sh" ]; then
  bash scripts/verify-vercel-optimization.sh
else
  echo "   Verification script not found"
fi
