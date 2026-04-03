# Vercel Optimization Guide

This guide documents the optimizations applied to reduce Vercel resource usage while maintaining workflow consistency across all projects.

## 🎯 Goals

- Stay within Vercel Free Tier limits across 3 projects
- Reduce deployment size by 50-70%
- Minimize serverless function executions via edge caching
- Maintain consistent developer workflow

## 📊 Free Tier Limits (Shared Across All Projects)

| Resource         | Limit       | Strategy                               |
| ---------------- | ----------- | -------------------------------------- |
| Bandwidth        | 100GB/month | Compression, caching, optimized images |
| Function Minutes | 6,000/month | Edge caching, reduce API calls         |
| Cron Invocations | 1,000/month | Reduce frequency, consolidate jobs     |
| Deployments      | 100/day     | Auto-cancel duplicate builds           |

## ✅ Optimizations Applied

### 1. `.vercelignore` - Exclude Build Bloat

**Impact:** 300-500MB reduction per deployment

Excludes from deployment:

- Mobile artifacts (`android/`, `ios/`)
- Tests and coverage reports
- Documentation (except README)
- Development scripts
- Large data files that load at runtime
- Development tooling configs

**File:** `.vercelignore` (already created)

### 2. `vercel.json` - Caching & Deployment Control

**Impact:**

- 67% reduction in cron invocations (720 → 240/month)
- 60-80% reduction in function executions via edge caching
- Prevents duplicate deployments

**Configuration:**

```json
{
  "crons": [
    {
      "path": "/api/cron/export-metrics",
      "schedule": "0 */3 * * *" // Every 3 hours instead of hourly
    }
  ],
  "headers": [
    {
      "source": "/api/v1/services/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, s-maxage=3600, stale-while-revalidate=86400"
        }
      ]
    },
    {
      "source": "/api/v1/search/services",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, s-maxage=1800, stale-while-revalidate=3600"
        }
      ]
    }
  ],
  "github": {
    "silent": true,
    "autoJobCancelation": true // Cancels duplicate builds
  }
}
```

**Cache Strategy:**

- `/api/v1/services/*` → 1 hour cache, 24 hour stale-while-revalidate
- `/api/v1/search/services` → 30 min cache, 1 hour stale-while-revalidate

### 3. `next.config.ts` - Build Optimization

**Impact:** 30-40% build size reduction

**Key settings:**

```typescript
const nextConfig: NextConfig = {
  // Standalone output: reduces deployment by ~40%
  output: "standalone",

  // Disable source maps in production
  productionBrowserSourceMaps: false,

  // Enable compression
  compress: true,

  // Modern image formats
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Tree-shake packages
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*", "lucide-react"],
  },
}
```

## 🔄 Applying to Other Repos

To apply these optimizations to `visitbrief` and `healtharchive`:

### Step 1: Copy Configuration Files

```bash
# From careconnect directory
cp .vercelignore ../visitbrief/
cp .vercelignore ../healtharchive/
```

### Step 2: Update `vercel.json`

If the repo has API routes, add the caching headers:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, s-maxage=3600, stale-while-revalidate=86400"
        }
      ]
    }
  ],
  "github": {
    "silent": true,
    "autoJobCancelation": true
  }
}
```

If the repo has cron jobs, reduce frequency:

- Hourly → Every 3 hours: `"0 */3 * * *"`
- Daily → Every 2 days: `"0 0 */2 * *"`

### Step 3: Update `next.config.ts`/`next.config.js`

Add to the config object:

```typescript
{
  output: "standalone",
  productionBrowserSourceMaps: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: [
      // List your heavy packages here
      "lucide-react",
    ],
  },
}
```

### Step 4: Verify Build Size

```bash
# Build locally to check size
npm run build

# Check .next directory size
du -sh .next

# Target: <500MB for most apps
```

## 📈 Monitoring Usage

### Check Current Usage

Visit: https://vercel.com/dashboard/usage

Or via CLI:

```bash
vercel logs --project=careconnect
vercel logs --project=visitbrief
vercel logs --project=healtharchive
```

### Monthly Checklist

- [ ] Review bandwidth usage across all projects
- [ ] Check serverless function execution minutes
- [ ] Verify cron job invocation count
- [ ] Monitor deployment frequency

### Warning Signs

**🚨 Red flags that you're approaching limits:**

- Bandwidth > 80GB/month (>80% of limit)
- Function minutes > 5,000/month (>83% of limit)
- Cron invocations > 800/month (>80% of limit)
- Deployments > 80/day (>80% of limit)

**Actions to take:**

1. Increase cache TTLs
2. Reduce cron frequency further
3. Consolidate API routes
4. Consider upgrading to Pro ($20/month) if business-critical

## 🛠️ Development Workflow

### Testing Before Deployment

```bash
# 1. Test locally first
npm run dev

# 2. Build and test production mode locally
npm run build
npm start

# 3. Only deploy when ready
git push origin main
```

### Preview Deployments

Preview deployments count toward your limits. To minimize:

```bash
# Use feature flags instead of separate branches when possible
# Combine commits before pushing

# Bad (creates 3 deployments):
git commit -m "fix 1" && git push
git commit -m "fix 2" && git push
git commit -m "fix 3" && git push

# Good (creates 1 deployment):
git commit -m "fix 1"
git commit -m "fix 2"
git commit -m "fix 3"
git push
```

### Cancel Unnecessary Builds

Vercel auto-cancels duplicate builds with `autoJobCancelation: true`, but you can also manually cancel:

```bash
# Via dashboard: https://vercel.com/dashboard
# Click on a running deployment → Cancel
```

## 📦 Image Optimization

For projects with large images in `public/`:

```bash
# Install imagemagick
sudo apt-get install imagemagick

# Optimize PNG files
find public -name "*.png" -size +100k -exec \
  convert {} -quality 85 -strip {}.optimized.png \;

# Optimize JPEG files
find public -name "*.jpg" -size +100k -exec \
  convert {} -quality 80 -strip {}.optimized.jpg \;
```

**Targets:**

- Logos: <200KB
- Screenshots: <300KB each
- Icons: <50KB

## 🔍 Troubleshooting

### Build size still too large

```bash
# Analyze bundle
npm run analyze

# Check what's in .next/standalone
du -sh .next/standalone/*

# Look for large dependencies
npx depcheck
```

### Cache not working

- Verify headers in Network tab (DevTools)
- Check `Cache-Control` header is present
- Ensure route pattern matches in `vercel.json`

### Cron jobs not running

- Verify schedule syntax at https://crontab.guru
- Check Vercel logs for execution
- Ensure path matches your API route exactly

## 📚 Additional Resources

- [Vercel Limits Documentation](https://vercel.com/docs/limits)
- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Vercel Edge Caching](https://vercel.com/docs/edge-network/caching)

## 🎯 Expected Results

After applying all optimizations:

| Metric              | Before   | After       | Improvement |
| ------------------- | -------- | ----------- | ----------- |
| Build Size          | 1.1GB    | 400-500MB   | 55-65%      |
| Cron Invocations    | 720/mo   | 240/mo      | 67%         |
| Function Executions | High     | 60-80% less | Via caching |
| Bandwidth           | Baseline | 40% less    | Compression |

---

**Last Updated:** 2026-02-12
**Applied To:** careconnect
**Next:** visitbrief, healtharchive
