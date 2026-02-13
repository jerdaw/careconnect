# Release Process

## Overview

Kingston Care Connect uses **automated GitHub releases** triggered by git tags. Release notes are automatically generated from `CHANGELOG.md`, ensuring consistency between the changelog and GitHub releases.

## Release Workflow

### Standard Release (Automated)

1. **Update CHANGELOG.md**
2. **Commit changes**
3. **Create and push tag**
4. **GitHub Actions creates release automatically**

### Detailed Steps

#### 1. Update CHANGELOG.md

Add a new version section at the top of `CHANGELOG.md`:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added

- New feature description

### Changed

- Changes to existing functionality

### Fixed

- Bug fixes

### Removed

- Removed features or deprecations

### Security

- Security improvements
```

**Format Guidelines:**

- Follow [Keep a Changelog](https://keepachangelog.com/) format
- Use version without `v` prefix in heading: `[0.17.5]` not `[v0.17.5]`
- Include release date in ISO format: `YYYY-MM-DD`
- Group changes by category (Added, Changed, Fixed, etc.)
- Use bullet points for individual changes
- Be descriptive but concise

#### 2. Commit Changes

```bash
git add CHANGELOG.md
git commit -m "chore: prepare release vX.Y.Z"
git push origin main
```

#### 3. Create and Push Tag

```bash
# Create annotated tag with message
git tag -a vX.Y.Z -m "Release vX.Y.Z"

# Push tag to GitHub (triggers release workflow)
git push origin vX.Y.Z
```

**Tag Naming:**

- Always use `v` prefix: `v0.17.5`, `v1.0.0`
- Follow semantic versioning: `vMAJOR.MINOR.PATCH`
- Use annotated tags (`-a`) not lightweight tags

#### 4. Verify Release

1. Go to GitHub → Releases
2. Verify release was created with correct notes
3. Check that release notes match CHANGELOG.md
4. Download artifacts if needed

## Manual Release Notes Generation

To generate release notes locally without creating a release:

```bash
# Generate notes for specific version
node scripts/generate-release-notes.js v0.17.5

# Generate notes for latest version
node scripts/generate-release-notes.js

# Save to file
node scripts/generate-release-notes.js v0.17.5 --output release-notes.md

# Get structured JSON output
node scripts/generate-release-notes.js v0.17.5 --json

# Without footer/emoji
node scripts/generate-release-notes.js v0.17.5 --no-footer --no-emoji
```

## Semantic Versioning

Kingston Care Connect follows [Semantic Versioning](https://semver.org/):

**MAJOR.MINOR.PATCH** (e.g., 1.2.3)

### When to Increment

| Version | When to Increment                           | Example                    |
| ------- | ------------------------------------------- | -------------------------- |
| MAJOR   | Breaking changes, incompatible API changes  | Database schema changes    |
| MINOR   | New features, backward-compatible additions | New search filters         |
| PATCH   | Bug fixes, backward-compatible fixes        | Fix crash on invalid input |

### Pre-1.0.0 Releases

Currently at version 0.x.x (pre-production):

- **Minor** version = significant features (would be MAJOR after 1.0.0)
- **Patch** version = everything else (fixes, small features)
- Breaking changes allowed in minor versions

**When to release 1.0.0:**

- Production deployment complete
- Feature-complete for initial launch
- API stable
- Public-facing and accepting users

## Release Frequency

### Regular Releases

- **Patch releases**: As needed (bug fixes, small improvements)
- **Minor releases**: Every 2-4 weeks (new features)
- **Major releases**: When necessary (breaking changes)

### Emergency Releases

For **critical security fixes** or **production-breaking bugs**:

1. Create hotfix branch from latest release tag
2. Fix issue and update CHANGELOG.md
3. Create new patch version tag
4. Deploy immediately

## Changelog Best Practices

### Good Changelog Entries

✅ **Good:**

```markdown
### Added

- Search filter for service categories (#123)
- Crisis detection with automatic service boosting
- French translation for 71 services

### Fixed

- Fix memory leak in WebLLM worker (#145)
- Resolve infinite loop in synonym expansion
```

❌ **Bad:**

```markdown
### Changed

- Updated stuff
- Fixed things
- Improvements
```

### Writing Effective Entries

1. **Be Specific**: State what changed and why
2. **User-Focused**: Describe impact on users/developers
3. **Link Issues**: Reference GitHub issues/PRs when relevant
4. **Group Related**: Combine related changes under subheadings

**Example:**

```markdown
### Added

#### Performance Tracking System

- New `lib/performance/tracker.ts` for lightweight operation timing
- Support for p50, p95, p99 latency percentiles
- Configurable via `NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING` environment variable

#### Circuit Breaker Pattern

- New `lib/resilience/circuit-breaker.ts` with state machine (CLOSED → OPEN → HALF_OPEN)
- Fast-fail behavior (<1ms when circuit is open)
- Automatic recovery after configurable timeout
```

## Automated Release Workflow

The `.github/workflows/release.yml` workflow automates releases:

### Trigger

- Runs when tag matching `v*.*.*` is pushed
- Examples: `v0.17.5`, `v1.0.0`, `v2.1.3-beta`

### Steps

1. **Checkout code**: Fetch full git history
2. **Extract version**: Parse version from tag name
3. **Generate notes**: Run `scripts/generate-release-notes.js`
4. **Create release**: Use GitHub API to create release
5. **Upload artifact**: Store release notes for 90 days

### Customization

Edit `.github/workflows/release.yml` to:

- Change tag pattern (e.g., support pre-releases)
- Mark releases as draft or prerelease
- Add release assets (binaries, archives)
- Customize release title format

## Troubleshooting

### "Version not found in CHANGELOG.md"

**Cause:** Version section missing or incorrectly formatted.

**Solution:**

1. Verify version format in CHANGELOG.md: `## [X.Y.Z] - YYYY-MM-DD`
2. Ensure version matches tag (without `v` prefix)
3. Check for typos or extra spaces

### Release Created But Empty Body

**Cause:** `generate-release-notes.js` failed to extract content.

**Solution:**

1. Check CHANGELOG.md format
2. Ensure content exists between version headers
3. Run script locally to debug:
   ```bash
   node scripts/generate-release-notes.js vX.Y.Z --json
   ```

### Workflow Doesn't Trigger

**Cause:** Tag pattern doesn't match or workflow disabled.

**Solution:**

1. Verify tag follows `v*.*.*` pattern
2. Check GitHub Actions → Workflows → "Create Release" is enabled
3. Ensure `GITHUB_TOKEN` has `contents: write` permission

### Multiple Releases for Same Tag

**Cause:** Re-pushing same tag after deleting release.

**Solution:**

1. Delete tag locally: `git tag -d vX.Y.Z`
2. Delete tag on GitHub: `git push origin :refs/tags/vX.Y.Z`
3. Create new tag with incremented version

## Release Checklist

Before creating a release:

- [ ] All tests passing (895+ tests)
- [ ] Coverage thresholds met (50% statements, 80% branches/functions)
- [ ] No ESLint warnings
- [ ] Bundle size acceptable (review if changed significantly)
- [ ] CHANGELOG.md updated with all changes
- [ ] Version number follows semantic versioning
- [ ] Manual smoke test completed (key user flows)
- [ ] Documentation updated for new features
- [ ] Breaking changes clearly documented (if any)

After creating a release:

- [ ] Verify release appears on GitHub
- [ ] Check release notes are complete and accurate
- [ ] Announce release (if significant)
- [ ] Monitor for issues in first 24 hours
- [ ] Update deployment (if applicable)

## Pre-Release Versions

For beta/alpha releases:

### Tag Format

```bash
# Beta release
git tag -a v1.0.0-beta.1 -m "Release v1.0.0-beta.1"

# Alpha release
git tag -a v2.0.0-alpha.1 -m "Release v2.0.0-alpha.1"

# Release candidate
git tag -a v1.0.0-rc.1 -m "Release v1.0.0-rc.1"
```

### CHANGELOG Format

```markdown
## [1.0.0-beta.1] - 2026-02-12

### Note

This is a pre-release version for testing. Not recommended for production use.

### Added

- Feature preview: New search algorithm
```

### Marking as Pre-Release

Edit `.github/workflows/release.yml`:

```yaml
- name: Create GitHub Release
  uses: actions/create-release@v1
  with:
    tag_name: ${{ steps.version.outputs.tag }}
    release_name: Release ${{ steps.version.outputs.tag }}
    body: ${{ steps.notes.outputs.body }}
    draft: false
    prerelease: true # Mark as pre-release
```

Or manually mark as pre-release in GitHub UI after creation.

## Related Documentation

- [CHANGELOG.md](../../CHANGELOG.md) - Full project changelog
- [Semantic Versioning](https://semver.org/) - Versioning specification
- [Keep a Changelog](https://keepachangelog.com/) - Changelog format guide
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)

## Examples

### Example 1: Patch Release (Bug Fix)

```bash
# 1. Update CHANGELOG.md
## [0.17.6] - 2026-02-15

### Fixed
- Fix crash when searching with special characters (#234)
- Resolve memory leak in AI worker (#235)

# 2. Commit
git add CHANGELOG.md
git commit -m "chore: prepare release v0.17.6"
git push

# 3. Tag and push
git tag -a v0.17.6 -m "Release v0.17.6"
git push origin v0.17.6

# 4. Verify on GitHub → Releases
```

### Example 2: Minor Release (New Feature)

```bash
# 1. Update CHANGELOG.md
## [0.18.0] - 2026-02-20

### Added
- New category filter for service search
- Bulk export functionality for admin dashboard
- French translations for 50 additional services

### Changed
- Improved search ranking algorithm
- Updated UI design for service cards

# 2-4. Same as patch release
```

### Example 3: Major Release (Breaking Changes)

```bash
# 1. Update CHANGELOG.md
## [1.0.0] - 2026-03-01

### Breaking Changes
- Removed deprecated API endpoints (use v2 instead)
- Changed database schema (migration required)
- Updated minimum Node.js version to 22

### Added
- Public API v2 with improved performance
- Comprehensive admin dashboard
- Real-time search suggestions

# 2-4. Same as above, but communicate breaking changes to users
```
