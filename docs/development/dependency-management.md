# Dependency Management

## Overview

CareConnect uses **Dependabot** for automated dependency updates. Dependencies are updated weekly (npm) and monthly (GitHub Actions) to maintain security and leverage new features while minimizing disruption.

## Dependabot Configuration

### Update Schedule

- **npm Dependencies**: Every Monday at 09:00 UTC
- **GitHub Actions**: First Monday of each month
- **Open PR Limit**: 10 for npm, 5 for GitHub Actions

### Grouping Strategy

Dependabot groups updates to reduce PR noise:

| Group                        | Includes                       | Auto-Merge |
| ---------------------------- | ------------------------------ | ---------- |
| **production-patch**         | Patch updates (production)     | ✅ Yes     |
| **production-minor**         | Minor updates (production)     | ❌ Manual  |
| **development-dependencies** | Patch+Minor (dev dependencies) | ✅ Patch   |
| **github-actions**           | All GitHub Actions updates     | ❌ Manual  |

### Ignored Updates

The following major version updates are **ignored** and require manual upgrades:

- **Next.js**: Major versions (requires migration guide review)
- **React/React-DOM**: Major versions (breaking changes common)
- **TypeScript**: Major versions (syntax/type system changes)
- **@types/react**: Major versions (tied to React version)
- **@xenova/transformers**: Major versions (ML model compatibility)

## Auto-Merge Policy

The `.github/workflows/dependabot-auto-merge.yml` workflow automatically handles safe updates:

### Auto-Approved

- ✅ **Patch updates** (all dependencies)
- ✅ **Minor updates** (dev dependencies only)

### Auto-Merged

- ✅ **Patch updates** (after CI passes)

### Manual Review Required

- ⚠️ **Major version updates** (any dependency)
- ⚠️ **Minor updates** (production dependencies)

## Handling Dependabot PRs

### Quick Reference

```bash
# View open Dependabot PRs
gh pr list --label dependencies

# Approve a PR
gh pr review <number> --approve

# Merge after CI passes
gh pr merge <number> --auto --squash

# Close without merging
gh pr close <number>
```

### Review Checklist

When reviewing a Dependabot PR:

1. **Check CI Status**: All checks must pass
   - ✅ Tests (895+ passing)
   - ✅ Type check
   - ✅ Lint
   - ✅ Coverage thresholds

2. **Review Changelog**: Check linked release notes
   - Breaking changes?
   - New features relevant to us?
   - Security fixes?

3. **Check Size Impact**: Review bundle size diff (if applicable)
   - Acceptable increase?
   - Optimization opportunities?

4. **Test Locally** (for major/minor production updates):

   ```bash
   gh pr checkout <number>
   npm install
   npm run build
   npm run test
   npm run dev # Manual smoke test
   ```

5. **Approve & Merge**: If all checks pass
   ```bash
   gh pr review <number> --approve
   gh pr merge <number> --squash
   ```

### Common Scenarios

#### Scenario 1: Patch Update (Auto-Merged)

**What happens:**

1. Dependabot opens PR (e.g., "chore(deps): bump axios from 1.6.0 to 1.6.1")
2. CI runs automatically
3. Auto-merge workflow approves and enables auto-merge
4. PR merges when CI passes

**Action needed:** None (monitor for CI failures)

#### Scenario 2: Minor Production Update (Manual Review)

**What happens:**

1. Dependabot opens PR (e.g., "chore(deps): bump next-intl from 3.0.0 to 3.1.0")
2. CI runs automatically
3. Auto-merge workflow posts or updates one sticky "Manual Review Required" comment

**Action needed:**

1. Review changelog for breaking changes
2. Test locally if unsure
3. Approve and merge if safe

#### Scenario 3: Major Update (Blocked)

**What happens:**

1. Update is blocked by `ignore` rules in `dependabot.yml`
2. No PR is created

**Action needed:**

1. Periodically check for major updates:
   ```bash
   npm outdated
   ```
2. Create manual PR when ready to upgrade
3. Follow framework-specific migration guides

### Conflict Resolution

If a Dependabot PR has merge conflicts:

1. **Close the conflicted PR**:

   ```bash
   gh pr close <number>
   ```

2. **Dependabot will recreate it** (usually within hours)

3. **Alternatively, manually resolve**:
   ```bash
   gh pr checkout <number>
   git fetch origin main
   git rebase origin/main
   # Resolve conflicts
   git push --force-with-lease
   ```

## Security Updates

Dependabot also creates **security updates** when vulnerabilities are detected.

## Pull Request Dependency Review

CareConnect now also runs GitHub's dependency review action on pull requests via `.github/workflows/dependency-review.yml`.

What it does:

- compares dependency manifest and lockfile changes introduced by the PR
- fails the PR when newly introduced dependencies carry **high** or **critical** advisories
- complements `npm audit` instead of replacing it

What it does not do:

- it does not block on unrelated historical ecosystem noise outside the PR diff
- it does not replace local review of changelogs, bundle impact, or framework compatibility

### Identifying Security Updates

Security PRs are labeled with:

- `dependencies`
- `security` (GitHub adds this automatically)

### Handling Security Updates

**Priority: HIGH** - Address within 24-48 hours.

1. **Review vulnerability details**: Click "View security advisory"
2. **Check severity**: Critical/High = immediate, Medium/Low = next sprint
3. **Test thoroughly**: Security fixes can have side effects
4. **Merge quickly**: Don't delay security patches

### Emergency Security Updates

For **critical vulnerabilities** in production:

```bash
# Quick fix workflow
gh pr checkout <security-pr-number>
npm install
npm run build
npm test

# If tests pass
gh pr review <number> --approve
gh pr merge <number> --squash

# Deploy immediately
vercel --prod
```

## Troubleshooting

### Dependabot PRs Not Created

**Symptoms:** No PRs despite weekly schedule.

**Causes:**

1. PR limit reached (10 for npm, 5 for actions)
2. All dependencies up-to-date
3. Dependabot disabled (check repo settings)

**Solution:**

```bash
# Check open Dependabot PRs
gh pr list --label dependencies

# If at limit, merge or close some PRs
# Dependabot will create new ones in next run
```

### CI Failures on Dependabot PR

**Symptoms:** Tests fail, type errors, or lint errors.

**Common Causes:**

1. **Breaking change** in dependency (even for minor/patch)
2. **Type changes** in @types packages
3. **Peer dependency conflicts**

**Solution:**

1. **Review failure logs** in GitHub Actions
2. **Close PR** if unfixable:
   ```bash
   gh pr close <number> --comment "CI failures due to breaking changes"
   ```
3. **Pin version** in `package.json` if needed:
   ```json
   "problematic-package": "1.2.3" // Pinned due to breaking changes
   ```

### Dependabot Recreating Closed PRs

**Symptoms:** PR keeps getting recreated after closing.

**Cause:** Dependency is out of date and not in ignore list.

**Solution:**

Add to `.github/dependabot.yml`:

```yaml
ignore:
  - dependency-name: "problematic-package"
    update-types: ["version-update:semver-minor"]
```

Or ignore all updates for a package:

```yaml
ignore:
  - dependency-name: "problematic-package"
```

### Bundle Size Increased Significantly

**Symptoms:** Bundle size PR comment shows large increase.

**Cause:** New dependency or larger version.

**Solution:**

1. Review bundle analyzer artifacts
2. Check if increase is justified
3. Consider alternatives or dynamic imports
4. Close PR if unacceptable

## Best Practices

### 1. Review Weekly

Set aside time every Monday morning to:

- Review open Dependabot PRs
- Merge safe updates quickly
- Schedule time for major updates

### 2. Don't Accumulate PRs

Merge or close PRs regularly:

- **Week 1**: Open PRs = 3-5 (healthy)
- **Week 4**: Open PRs = 10+ (problem!)

**Why?** Dependabot stops creating new PRs at the limit.

### 3. Group Related Updates

Before merging, check if multiple PRs update related packages:

- Close individual PRs
- Update manually in a single PR
- Example: React + React-DOM + @types/react

### 4. Read Changelogs

Always check release notes for:

- New features we can use
- Deprecation warnings
- Performance improvements
- Breaking changes

### 5. Monitor Dashboard

Check Dependabot dashboard regularly:

- Repo → Insights → Dependency graph → Dependabot

Shows:

- Update frequency
- Vulnerabilities
- Compatibility score

## Configuration Reference

### dependabot.yml Location

`.github/dependabot.yml`

### Key Settings

| Setting                    | Value                   | Rationale                      |
| -------------------------- | ----------------------- | ------------------------------ |
| `interval`                 | weekly                  | Balance freshness vs. noise    |
| `day`                      | monday                  | Start of week, fresh attention |
| `open-pull-requests-limit` | 10                      | Enough for grouped updates     |
| `commit-message.prefix`    | chore(deps)             | Conventional commits           |
| `labels`                   | dependencies, automated | Easy filtering                 |

### Modifying Configuration

After editing `.github/dependabot.yml`:

1. Changes take effect **immediately** (next run)
2. No need to trigger manually
3. Verify syntax: https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file

## Auto-Merge Workflow

### How It Works

`.github/workflows/dependabot-auto-merge.yml`:

1. **Triggers** on Dependabot PR (opened/updated)
2. **Fetches metadata** (update type, dependency type)
3. **Auto-approves** safe updates (patch, dev minor)
4. **Enables auto-merge** for patch updates only
5. **Comments** on PRs requiring manual review

### Disabling Auto-Merge

To disable auto-merge for all updates:

1. Delete `.github/workflows/dependabot-auto-merge.yml`
2. Or add to workflow:
   ```yaml
   if: false # Disable auto-merge
   ```

### Adjusting Auto-Merge Policy

To auto-merge minor updates for production:

Edit `.github/workflows/dependabot-auto-merge.yml`:

```yaml
# Change this condition:
if: steps.metadata.outputs.update-type == 'version-update:semver-patch'

# To this:
if: |
  (steps.metadata.outputs.update-type == 'version-update:semver-patch') ||
  (steps.metadata.outputs.update-type == 'version-update:semver-minor')
```

**⚠️ Warning:** Auto-merging minor updates is riskier. Only enable if you're confident in test coverage.

## Metrics & Monitoring

### Key Metrics

Track these weekly:

1. **Open PRs**: Should be <5
2. **Merge Time**: Patch updates <24h, minor <7 days
3. **Security Updates**: 100% merged within 48h
4. **Outdated Packages**: Run `npm outdated` monthly

### Example Dashboard Query

```bash
# PRs merged this week
gh pr list --state merged --label dependencies --limit 20 | grep "$(date -d '7 days ago' +%Y-%m-%d)"

# Open Dependabot PRs
gh pr list --label dependencies

# Security PRs
gh pr list --label dependencies,security
```

## Related Documentation

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [npm Semantic Versioning](https://docs.npmjs.com/about-semantic-versioning)
- [Testing Guidelines](testing-guidelines.md)
- [Bundle Size Tracking](bundle-size-tracking.md)

## Future Enhancements

Potential improvements:

1. **Renovate Migration**: Consider Renovate Bot for more advanced features
   - Better grouping logic
   - Auto-merge rules more flexible
   - Scheduling per package group

2. **Dependency Dashboard**: Visual tracking of update status

3. **Breaking Change Detection**: Automated changelog parsing

4. **Performance Impact Analysis**: Link dependency updates to bundle size changes
