---
status: stable
last_updated: 2026-09-08
owner: maintainer
tags: [development, release, rollback, signing, retirement]
---

# CareConnect Signed Release Preparation

This procedure prepares a bounded, signed CareConnect **source** archive on a
local trusted machine. It implements the manifest and archive conventions
accepted by the restricted production control plane without uploading,
staging, deploying, changing a release pointer, or accessing production
configuration.

The builder is [build-careconnect-release.py](../../scripts/releases/build-careconnect-release.py).
It uses only committed Git content and writes:

1. a reproducible gzip-compressed source archive;
2. a `prod-ai-release-artifact-v1` manifest;
3. an SSH signature in the `prod-ai-release-artifact` namespace; and
4. a value-free local inventory containing source/tree identity, hashes,
   provenance, and verification outcomes.

## Safety Boundary

The builder fails closed unless:

- the source checkout is clean;
- the requested revision is hexadecimal and resolves to a full commit;
- normal releases match both `HEAD` and the locally recorded `origin/main`;
- ancestor rollbacks are explicitly selected, precede `origin/main`, are its
  verified ancestor, and match a separately supplied full tree hash;
- the signing key is a non-symlink regular file outside the source checkout,
  is non-empty, and is not group/world writable;
- the output directory is outside the source checkout, owner-controlled with
  mode `0700`, and is not an operating-system temporary directory; and
- the committed source contains the required Docker, package, and deployment
  files without generated/VCS directories, unexpected environment files,
  secret-like filenames, submodules, or unsupported symlinks.

Only `.env.example` is allowed among `.env*` members. The only accepted
symlinks are `CLAUDE.md` and `GEMINI.md`, both targeting `AGENTS.md`.
The root `.npmrc` is accepted only when every active line is one of the
credential-free reproducibility settings enforced by the builder; registry,
authentication, interpolation, duplicate, and nested `.npmrc` configuration is
rejected.
Existing output files are never overwritten.

The `--allow-ephemeral-output-for-testing` option exists solely for automated
tests using disposable signing keys. Never use it with a real release signer or
as the only retention location.

## Preconditions

1. Use an isolated CareConnect checkout and update its remote-tracking state
   through the normal authenticated Git workflow. The builder does not fetch.
2. Independently record the intended full commit and tree identifiers.
3. Choose a stable, owner-controlled output directory outside the repository.
   Temporary directories are not an acceptable release record.
4. Use the approved signing key without printing, copying, or committing it.
5. Keep signing, queue upload, staging, deployment, database work, shared
   keepalive changes, and domain changes as separate authorization gates.

## Prepare an Exact-Main Source Release

Substitute locally approved absolute paths and the reviewed full revision:

```bash
python3 scripts/releases/build-careconnect-release.py \
  /absolute/path/to/clean-careconnect \
  FULL_MAIN_REVISION \
  /absolute/path/to/stable-owner-controlled-output \
  /absolute/path/to/approved-signing-key
```

The default `exact-main` mode requires the requested revision, `HEAD`, and
`refs/remotes/origin/main` to be identical.

## Prepare the Retired Frontend as an Ancestor Rollback

The deployed retirement source currently recorded by this repository is:

- revision `ef91ac67c8a7929a965e4f0f6a8d7d6b30414185`;
- tree `ba94366c83247905ccc846eb80eee8021e20b886`.

Prepare it only from a clean checkout whose `HEAD` matches current
`origin/main`:

```bash
python3 scripts/releases/build-careconnect-release.py \
  /absolute/path/to/clean-careconnect \
  ef91ac67c8a7929a965e4f0f6a8d7d6b30414185 \
  /absolute/path/to/stable-owner-controlled-output \
  /absolute/path/to/approved-signing-key \
  --release-mode verified-ancestor-rollback \
  --expected-tree ba94366c83247905ccc846eb80eee8021e20b886
```

Rollback archives include `rollback` in their artifact basename. The signed
manifest retains the normal service, revision, artifact basename, and artifact
SHA-256 contract expected by the restricted staging wrapper.

## Retention Record

Retain all four output files together in the stable owner-controlled location.
The `*.inventory.json` record is designed to be safe for an operational index
because it contains only:

- service, builder, release-mode, source revision/tree, and main revision;
- archive, manifest, and signature basenames, sizes, and SHA-256 values;
- archive member/size counts;
- signer public-key fingerprint; and
- boolean source, archive, signature, image, and rollback verification states.

It contains no private-key path or contents, environment values, credentials,
tokens, production paths, raw logs, user data, or service data. Preserve a
second owner-controlled copy or inventory reference under the existing
retention policy so a temporary workstation path is never the only record.

## Verification and Remaining Gate

Focused local verification uses a disposable Git remote and disposable SSH
keys:

```bash
npm test -- --run tests/scripts/build-careconnect-release.test.ts
```

The builder validates the source archive members and hash, signs the manifest,
and immediately verifies the signature against the derived public key. Output
files use mode `0600` and the output directory uses mode `0700`.

A successful inventory deliberately records:

```text
executableImagePreserved=false
executableRollbackProven=false
```

This is not a failure in source preparation. A signed source archive is **not**
an immutable container image, proof that the deployment host can rebuild it,
proof that dependency/base-image caches remain available, a live smoke result,
or database recovery evidence. Before any frontend rollout, the separate
release gate must still establish a retained image or same-builder rebuild,
run the complete retirement acceptance contract, verify rollback execution,
and preserve the resulting image digest and value-free receipts.

See the
[retirement transition and rollback packet](../implementation/careconnect-retirement-transition-and-rollback-2026-08-12.md)
for the public behavior and stop conditions. Environment-specific queue,
release-root, signing-key, and deployment details remain in the private/shared
operations source of truth.
