# Bundle Size Tracking

## Overview

Bundle size tracking is **enforced in CI** to prevent performance regressions from JavaScript bundle bloat. The system automatically compares bundle sizes between PRs and the main branch, keeps routine reports in the GitHub Actions job summary, and only creates a sticky PR comment when there is an actionable regression or the analyzer itself fails.

## How It Works

### CI Workflow

The `.github/workflows/bundle-analysis.yml` workflow runs on:

- **Push to main**: Establishes baseline bundle sizes when bundle-affecting files change
- **Pull requests**: Compares against baseline for bundle-affecting changes, updates the job summary, and only comments when action is needed

### Workflow Steps

1. **Build with Analyzer**: Runs `ANALYZE=true npm run build`
   - Generates interactive HTML reports via `@next/bundle-analyzer`
   - Creates JSON summary via `scripts/report-bundle-size.js`

2. **Upload Artifacts**: Stores bundle analysis for 30 days
   - `__bundle_analysis.json` - Size data
   - `client.html` - Interactive client bundle visualization
   - `nodejs.html` - Interactive server bundle visualization

3. **Download Baseline**: (PR only) Fetches main branch bundle sizes

4. **Compare Sizes**: Runs `scripts/compare-bundle-size.js`
   - Compares global bundle sizes (raw & gzipped)
   - Identifies page-level changes
   - Generates markdown diff report

5. **Sync PR Warning Comment**: Only for actionable regressions or analyzer failures
   - Routine passes do not create inbox-noise comments
   - Existing warning comments are updated in place, not recreated
   - Warning comments are deleted automatically after the regression is resolved

6. **Create Job Summary**: GitHub Actions summary with results

## Bundle Analysis Report

### Example Output

```markdown
## 📦 Bundle Size Analysis

### Global Bundle

| Metric  | Current | Baseline | Diff               |
| ------- | ------- | -------- | ------------------ |
| Raw     | 1.2 MB  | 1.15 MB  | ⚠️ +50 KB (+4.35%) |
| Gzipped | 350 KB  | 340 KB   | ⚠️ +10 KB (+2.94%) |

### Status

⚠️ Action required: detected a significant gzipped bundle regression.

### ⚠️ Significant Regressions

| Page         | Current (gzip) | Baseline (gzip) | Diff                |
| ------------ | -------------- | --------------- | ------------------- |
| `/dashboard` | 45 KB          | 35 KB           | ⚠️ +10 KB (+28.57%) |

### 📊 Largest Pages (Top 5)

| Page         | Size (gzip) | Diff                |
| ------------ | ----------- | ------------------- |
| `/search`    | 60 KB       | ✅ -5 KB (-7.69%)   |
| `/dashboard` | 45 KB       | ⚠️ +10 KB (+28.57%) |
| `/`          | 40 KB       | 📊 +0 KB (+0%)      |
```

### Indicators

- **⚠️ Warning**: Size increased significantly (>10 KB or >5%)
- **✅ Improvement**: Size decreased
- **📊 Neutral**: Minor or no change

### Notification Behavior

- **No PR comment**: No actionable bundle regression was detected
- **Sticky PR comment**: A significant gzipped bundle regression needs attention
- **Failed workflow + sticky PR comment**: The comparison automation itself failed and needs investigation

## Thresholds

### Warning Triggers

Bundle size warnings appear when changes exceed:

- **Absolute**: +10 KB increase
- **Percentage**: +5% increase

### Critical Thresholds (Future)

Currently informational only. Future enhancement may block PRs when:

- Global bundle increases >20 KB
- Any page increases >50%

## Running Locally

### Generate Bundle Report

```bash
npm run analyze
```

This will:

1. Build with bundle analyzer enabled
2. Generate HTML reports in `.next/analyze/`
3. Open interactive visualizations in browser

### View Bundle Analysis

After building, open:

- `.next/analyze/client.html` - Client-side bundle breakdown
- `.next/analyze/nodejs.html` - Server-side bundle breakdown

### Compare Against Baseline

```bash
# Build current branch
npm run analyze

# Generate JSON report
node scripts/report-bundle-size.js

# Compare (requires baseline from main branch)
node scripts/compare-bundle-size.js
```

**Note**: Local comparison requires manually storing a baseline from main branch.

## Best Practices

### Keeping Bundles Small

1. **Use Dynamic Imports**

   ```typescript
   // Before: Static import (always loaded)
   import HeavyComponent from "./HeavyComponent"

   // After: Dynamic import (loaded on demand)
   const HeavyComponent = dynamic(() => import("./HeavyComponent"))
   ```

2. **Optimize Package Imports**

   ```typescript
   // Bad: Imports entire library
   import { Button } from "huge-ui-library"

   // Good: Direct import (tree-shakeable)
   import Button from "huge-ui-library/button"
   ```

3. **Check Dependency Size**

   ```bash
   npx bundlephobia <package-name>
   ```

4. **Use Next.js Optimizations**
   - Already configured in `next.config.ts`:
     - `optimizePackageImports` for Radix UI and Lucide
     - Compression enabled
     - Production source maps disabled

### Investigating Size Increases

If bundle size increases unexpectedly:

1. **Check New Dependencies**

   ```bash
   git diff main package.json
   ```

2. **View Bundle Composition**
   - Download `client.html` artifact from CI
   - Look for unexpectedly large chunks

3. **Identify Duplicate Packages**

   ```bash
   npm ls <package-name>
   ```

4. **Analyze Import Statements**
   - Search for barrel imports (`import * as`)
   - Check for accidental server-side imports in client components

## Configuration

### Bundle Analyzer Config

Located in `next.config.ts`:

```typescript
const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false, // Don't auto-open browser in CI
})
```

### Workflow Configuration

Located in `.github/workflows/bundle-analysis.yml`:

- **Artifact Retention**: 30 days
- **Permissions**: Read contents, write sticky PR warning comments
- **Concurrency**: Cancels older in-flight bundle runs for the same PR/branch
- **Triggers**: Push to main, all PRs

### Comparison Script

Located in `scripts/compare-bundle-size.js`:

- **Warn Threshold**: 10 KB or 5% increase
- **Output**: `.next/analyze/bundle-diff.md`

## Troubleshooting

### "No baseline for comparison" in PR

**Cause**: First PR after enabling tracking, or baseline expired (>30 days).

**Solution**: Merge PR to establish baseline. Future PRs will compare against it.

### No PR comment appeared

**Cause**: This is the expected quiet path. Routine bundle checks now stay in the job summary unless a significant gzipped regression or analyzer failure is detected.

**Solution**: No action needed. Open the workflow summary or artifacts if you want the full report.

### Workflow failing on "Compare bundle sizes"

**Cause**: `compare-bundle-size.js` script error.

**Solution**: Check job logs and the sticky warning comment link. The workflow fails in this case so the broken automation is visible.

### Bundle size looks wrong

**Cause**: May include development code or source maps.

**Solution**: Ensure building with `NODE_ENV=production` (CI does this automatically).

### Missing HTML reports in artifacts

**Cause**: `@next/bundle-analyzer` only generates HTML when `ANALYZE=true`.

**Solution**: Verify workflow uses `ANALYZE=true npm run build`.

## Related Documentation

- [Bundle Analysis Best Practices](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [@next/bundle-analyzer](https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer)

## Future Enhancements

Potential improvements to consider:

1. **Automated Bundle Budget Enforcement**
   - Fail CI if bundle exceeds hard limit
   - Configurable per-route budgets

2. **Historical Trending**
   - Track bundle size over time
   - Visualize trends in dashboard

3. **Dependency Impact Analysis**
   - Show size contribution of each dependency
   - Suggest lighter alternatives

4. **Performance Budget Integration**
   - Link bundle size to Lighthouse scores
   - Track correlation with load time metrics
