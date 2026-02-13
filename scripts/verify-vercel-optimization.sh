#!/bin/bash
# Verify Vercel optimizations are properly configured
# Run this in any repo to check optimization status

set -e

echo "🔍 Vercel Optimization Verification"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
PASS=0
FAIL=0
WARN=0

# Function to check file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 exists"
    ((PASS++))
    return 0
  else
    echo -e "${RED}✗${NC} $1 missing"
    ((FAIL++))
    return 1
  fi
}

# Function to check string in file
check_contains() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $1 contains: $3"
    ((PASS++))
    return 0
  else
    echo -e "${RED}✗${NC} $1 missing: $3"
    ((FAIL++))
    return 1
  fi
}

# 1. Check .vercelignore exists
echo "📁 Checking .vercelignore..."
if check_file ".vercelignore"; then
  check_contains ".vercelignore" "android/" "mobile exclusions"
  check_contains ".vercelignore" "tests/" "test exclusions"
  check_contains ".vercelignore" "docs/" "docs exclusions"
fi
echo ""

# 2. Check vercel.json
echo "⚙️  Checking vercel.json..."
if check_file "vercel.json"; then
  check_contains "vercel.json" "autoJobCancelation" "auto job cancelation"
  check_contains "vercel.json" "Cache-Control" "cache headers"

  # Check cron frequency
  if grep -q "0 \*/" "vercel.json" 2>/dev/null; then
    FREQ=$(grep -o "0 \*/[0-9]*" "vercel.json" | head -1)
    if [ "$FREQ" = "0 */3" ] || [ "$FREQ" = "0 */4" ] || [ "$FREQ" = "0 */6" ]; then
      echo -e "${GREEN}✓${NC} Cron frequency optimized: $FREQ"
      ((PASS++))
    else
      echo -e "${YELLOW}⚠${NC} Cron frequency could be optimized: $FREQ (consider */3 or higher)"
      ((WARN++))
    fi
  fi
fi
echo ""

# 3. Check next.config
echo "🔧 Checking Next.js config..."
if [ -f "next.config.ts" ]; then
  CONFIG_FILE="next.config.ts"
elif [ -f "next.config.js" ]; then
  CONFIG_FILE="next.config.js"
elif [ -f "next.config.mjs" ]; then
  CONFIG_FILE="next.config.mjs"
else
  echo -e "${RED}✗${NC} No Next.js config found"
  ((FAIL++))
  CONFIG_FILE=""
fi

if [ -n "$CONFIG_FILE" ]; then
  check_contains "$CONFIG_FILE" "standalone" "standalone output"
  check_contains "$CONFIG_FILE" "productionBrowserSourceMaps.*false" "source maps disabled"
  check_contains "$CONFIG_FILE" "optimizePackageImports" "package import optimization"
fi
echo ""

# 4. Check build size
echo "📦 Checking build size..."
if [ -d ".next" ]; then
  SIZE=$(du -sh .next | cut -f1)
  SIZE_MB=$(du -sm .next | cut -f1)

  if [ "$SIZE_MB" -lt 500 ]; then
    echo -e "${GREEN}✓${NC} Build size: $SIZE (optimal)"
    ((PASS++))
  elif [ "$SIZE_MB" -lt 800 ]; then
    echo -e "${YELLOW}⚠${NC} Build size: $SIZE (acceptable, but could be optimized)"
    ((WARN++))
  else
    echo -e "${RED}✗${NC} Build size: $SIZE (too large, target <500MB)"
    ((FAIL++))
  fi
else
  echo -e "${YELLOW}⚠${NC} No .next directory found. Run 'npm run build' first."
  ((WARN++))
fi
echo ""

# 5. Check for large files in public/
echo "🖼️  Checking public/ assets..."
if [ -d "public" ]; then
  LARGE_FILES=$(find public -type f -size +200k 2>/dev/null || true)
  if [ -z "$LARGE_FILES" ]; then
    echo -e "${GREEN}✓${NC} No large files (>200KB) in public/"
    ((PASS++))
  else
    echo -e "${YELLOW}⚠${NC} Large files found in public/ (consider optimizing):"
    echo "$LARGE_FILES" | while read -r file; do
      SIZE=$(du -h "$file" | cut -f1)
      echo "    $SIZE  $file"
    done
    ((WARN++))
  fi
else
  echo -e "${YELLOW}⚠${NC} No public/ directory"
  ((WARN++))
fi
echo ""

# 6. Summary
echo "======================================"
echo "📊 Summary"
echo "======================================"
echo -e "${GREEN}Passed:${NC}  $PASS"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo -e "${RED}Failed:${NC}  $FAIL"
echo ""

if [ $FAIL -eq 0 ] && [ $WARN -eq 0 ]; then
  echo -e "${GREEN}✓ All optimizations configured correctly!${NC}"
  exit 0
elif [ $FAIL -eq 0 ]; then
  echo -e "${YELLOW}⚠ Optimizations mostly configured, but some warnings.${NC}"
  echo "  Review warnings above for further optimization opportunities."
  exit 0
else
  echo -e "${RED}✗ Some optimizations missing.${NC}"
  echo "  See VERCEL-OPTIMIZATION.md for setup instructions."
  exit 1
fi
