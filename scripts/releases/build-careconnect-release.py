#!/usr/bin/env python3
"""Build and locally verify a signed CareConnect source release."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import NoReturn


SERVICE = "careconnect-web"
MANIFEST_SCHEMA = "prod-ai-release-artifact-v1"
SIGNATURE_NAMESPACE = "prod-ai-release-artifact"
SIGNER_IDENTITY = "prod-ai-maintenance"
INVENTORY_SCHEMA = "careconnect-release-inventory-v1"
BUILDER_ID = "careconnect-release-builder-v1"
MAX_ARCHIVE_BYTES = 256 * 1024 * 1024
MAX_UNCOMPRESSED_BYTES = 768 * 1024 * 1024
MAX_MEMBER_COUNT = 25_000
DISALLOWED_PARTS = {".git", ".next", "node_modules"}
ALLOWED_ENV_BASENAMES = {".env.example"}
ALLOWED_SYMLINKS = {"CLAUDE.md": "AGENTS.md", "GEMINI.md": "AGENTS.md"}
REQUIRED_MEMBERS = {
    "Dockerfile",
    "package.json",
    "package-lock.json",
    "scripts/deploy-vps-proof.sh",
    "scripts/archive/deploy-vps-proof.sh",
}
SENSITIVE_BASENAMES = {
    ".netrc",
    ".npmrc",
    ".pypirc",
    "credentials.json",
    "secret.json",
    "secrets.json",
}
SENSITIVE_SUFFIXES = {".key", ".kdbx", ".p12", ".pem", ".pfx"}
REVISION_RE = re.compile(r"^[0-9a-fA-F]{7,40}$")
FULL_OID_RE = re.compile(r"^[0-9a-f]{40}$")
PRIVATE_KEY_BASENAME_RE = re.compile(r"^id_(?:dsa|ecdsa|ed25519|rsa)(?:\.pub)?$", re.IGNORECASE)


class BuildError(RuntimeError):
    """An expected fail-closed release preparation error."""


def fail(message: str) -> NoReturn:
    payload = {"ok": False, "error": message, "secretValuesCollected": False}
    print(json.dumps(payload, separators=(",", ":")), file=sys.stderr)
    raise SystemExit(2)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_repo", type=Path)
    parser.add_argument("revision")
    parser.add_argument("out_dir", type=Path)
    parser.add_argument("signing_key", type=Path)
    parser.add_argument(
        "--release-mode",
        choices=("exact-main", "verified-ancestor-rollback"),
        default="exact-main",
    )
    parser.add_argument("--expected-tree")
    parser.add_argument(
        "--allow-ephemeral-output-for-testing",
        action="store_true",
        help="permit an OS temporary output directory for disposable-key tests only",
    )
    return parser.parse_args()


def run(
    argv: list[str],
    *,
    cwd: Path | None = None,
    input_bytes: bytes | None = None,
    timeout: int = 120,
) -> subprocess.CompletedProcess[bytes]:
    try:
        return subprocess.run(
            argv,
            cwd=cwd,
            input=input_bytes,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=timeout,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise BuildError("required local release command failed") from exc


def require_command(name: str) -> None:
    if shutil.which(name) is None:
        raise BuildError(f"missing required command: {name}")


def git_output(repo: Path, *args: str) -> bytes:
    result = run(["git", *args], cwd=repo)
    if result.returncode != 0:
        raise BuildError("Git source validation failed")
    return result.stdout


def resolve_commit(repo: Path, revision: str) -> str:
    if not REVISION_RE.fullmatch(revision):
        raise BuildError("revision must be a 7-40 character hexadecimal commit identifier")
    resolved = git_output(repo, "rev-parse", "--verify", f"{revision}^{{commit}}").decode().strip().lower()
    if not FULL_OID_RE.fullmatch(resolved):
        raise BuildError("resolved revision is not a full commit hash")
    return resolved


def resolve_tree(repo: Path, revision: str) -> str:
    tree = git_output(repo, "rev-parse", "--verify", f"{revision}^{{tree}}").decode().strip().lower()
    if not FULL_OID_RE.fullmatch(tree):
        raise BuildError("resolved source tree is not a full object hash")
    return tree


def is_within(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def require_safe_path(path: PurePosixPath) -> None:
    rendered = path.as_posix()
    if not rendered or rendered.startswith("/") or "\\" in rendered:
        raise BuildError("source tree contains an unsafe member path")
    if any(part in {"", ".", ".."} for part in path.parts):
        raise BuildError("source tree contains path traversal")
    for part in path.parts:
        if part in DISALLOWED_PARTS:
            raise BuildError("source tree contains generated or VCS directories")
        if part.startswith(".env") and part not in ALLOWED_ENV_BASENAMES:
            raise BuildError("source tree contains an env-like file")

    basename = path.name.lower()
    if (
        basename in SENSITIVE_BASENAMES
        or PRIVATE_KEY_BASENAME_RE.fullmatch(basename)
        or any(basename.endswith(suffix) for suffix in SENSITIVE_SUFFIXES)
        or "private-key" in basename
        or "private_key" in basename
        or "service-account" in basename
        or "service_account" in basename
    ):
        raise BuildError("source tree contains a secret-like member name")


def source_members(repo: Path, revision: str) -> dict[str, tuple[str, str]]:
    raw = git_output(repo, "ls-tree", "-rz", "--full-tree", revision)
    members: dict[str, tuple[str, str]] = {}
    for record in raw.split(b"\0"):
        if not record:
            continue
        try:
            metadata, raw_name = record.split(b"\t", 1)
            mode, object_type, object_id = metadata.decode("ascii").split(" ", 2)
            name = raw_name.decode("utf-8")
        except (UnicodeDecodeError, ValueError) as exc:
            raise BuildError("source tree contains an unreadable member") from exc
        path = PurePosixPath(name)
        require_safe_path(path)
        if object_type not in {"blob"} or mode not in {"100644", "100755", "120000"}:
            raise BuildError("source tree contains an unsupported member type")
        if mode == "120000":
            target = git_output(repo, "cat-file", "blob", object_id).decode("utf-8")
            if ALLOWED_SYMLINKS.get(name) != target:
                raise BuildError("source tree contains an unsupported symlink")
        members[name] = (mode, object_id)
        if len(members) > MAX_MEMBER_COUNT:
            raise BuildError("source tree has too many members")

    if not REQUIRED_MEMBERS.issubset(members):
        raise BuildError("source tree is missing required app files")
    return members


def validate_source(args: argparse.Namespace) -> tuple[Path, str, str, str, dict[str, tuple[str, str]]]:
    source_repo = args.source_repo.resolve(strict=True)
    if not source_repo.is_dir():
        raise BuildError("source repository is unavailable")
    if git_output(source_repo, "rev-parse", "--is-inside-work-tree").decode().strip() != "true":
        raise BuildError("source repository is not a Git worktree")
    top_level = Path(git_output(source_repo, "rev-parse", "--show-toplevel").decode().strip()).resolve()
    if top_level != source_repo:
        raise BuildError("source repository must be the Git worktree root")
    if git_output(source_repo, "status", "--porcelain=v1", "--untracked-files=all"):
        raise BuildError("source repository must be clean")

    resolved = resolve_commit(source_repo, args.revision)
    head = resolve_commit(source_repo, git_output(source_repo, "rev-parse", "HEAD").decode().strip())
    main_revision = resolve_commit(
        source_repo,
        git_output(source_repo, "rev-parse", "refs/remotes/origin/main").decode().strip(),
    )
    tree = resolve_tree(source_repo, resolved)

    if args.expected_tree is not None:
        expected_tree = args.expected_tree.lower()
        if not FULL_OID_RE.fullmatch(expected_tree) or expected_tree != tree:
            raise BuildError("source tree does not match the expected tree")

    if args.release_mode == "exact-main":
        if resolved != head or resolved != main_revision:
            raise BuildError("exact-main release must match HEAD and origin/main")
    else:
        if args.expected_tree is None:
            raise BuildError("verified ancestor rollback requires --expected-tree")
        if head != main_revision:
            raise BuildError("rollback preparation requires HEAD to match origin/main")
        if resolved == main_revision:
            raise BuildError("rollback revision must precede origin/main")
        ancestor = run(["git", "merge-base", "--is-ancestor", resolved, main_revision], cwd=source_repo)
        if ancestor.returncode != 0:
            raise BuildError("rollback revision is not a verified ancestor of origin/main")

    return source_repo, resolved, tree, main_revision, source_members(source_repo, resolved)


def validate_signing_key(signing_key: Path, source_repo: Path) -> Path:
    signing_key = signing_key.expanduser()
    details = signing_key.lstat()
    if signing_key.is_symlink() or not stat.S_ISREG(details.st_mode):
        raise BuildError("signing key must be a regular non-symlink file")
    signing_key = signing_key.resolve(strict=True)
    if is_within(signing_key, source_repo):
        raise BuildError("signing key must be outside the source repository")
    if details.st_mode & 0o022:
        raise BuildError("signing key must not be group/world writable")
    if details.st_size <= 0:
        raise BuildError("signing key is empty")
    return signing_key


def prepare_output_directory(out_dir: Path, source_repo: Path, allow_ephemeral: bool) -> Path:
    out_dir = out_dir.expanduser()
    if out_dir.exists() and out_dir.is_symlink():
        raise BuildError("output directory must be a regular directory")
    out_dir = out_dir.resolve(strict=False)
    if not out_dir.is_absolute() or is_within(out_dir, source_repo):
        raise BuildError("output directory must be absolute and outside the source repository")
    temporary_roots = {
        Path(tempfile.gettempdir()).resolve(),
        Path("/tmp").resolve(),
        Path("/private/tmp").resolve(),
        Path("/var/tmp").resolve(),
    }
    if any(is_within(out_dir, root) for root in temporary_roots) and not allow_ephemeral:
        raise BuildError("temporary output is allowed only for disposable-key tests")
    if out_dir.exists():
        details = out_dir.lstat()
        if out_dir.is_symlink() or not stat.S_ISDIR(details.st_mode):
            raise BuildError("output directory must be a regular directory")
        if details.st_uid != os.getuid() or details.st_mode & 0o077:
            raise BuildError("output directory must be owner-controlled with mode 0700")
    else:
        out_dir.mkdir(parents=True, mode=0o700)
    os.chmod(out_dir, 0o700)
    return out_dir


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def create_archive(source_repo: Path, revision: str, destination: Path, source_epoch: int) -> None:
    created = False
    try:
        with tempfile.TemporaryDirectory(prefix="careconnect-release-") as temp_dir:
            raw_tar = Path(temp_dir) / "source.tar"
            result = run(
                ["git", "archive", "--format=tar", "--output", str(raw_tar), revision],
                cwd=source_repo,
                timeout=300,
            )
            if result.returncode != 0:
                raise BuildError("Git source archive creation failed")
            with raw_tar.open("rb") as source, destination.open("xb") as raw_output:
                created = True
                with gzip.GzipFile(filename="", mode="wb", fileobj=raw_output, mtime=source_epoch) as compressed:
                    shutil.copyfileobj(source, compressed, length=1024 * 1024)
        os.chmod(destination, 0o600)
        if destination.stat().st_size <= 0 or destination.stat().st_size > MAX_ARCHIVE_BYTES:
            raise BuildError("release archive exceeds the bounded size")
    except Exception:
        if created:
            destination.unlink(missing_ok=True)
        raise


def validate_archive(artifact: Path, expected_members: dict[str, tuple[str, str]]) -> dict[str, int]:
    file_names: set[str] = set()
    member_count = 0
    total_size = 0
    symlink_count = 0
    try:
        with tarfile.open(artifact, "r:gz") as archive:
            for member in archive:
                member_count += 1
                if member_count > MAX_MEMBER_COUNT:
                    raise BuildError("release archive has too many members")
                path = PurePosixPath(member.name)
                require_safe_path(path)
                normalized = path.as_posix()
                if member.islnk():
                    raise BuildError("release archive contains a hard link")
                if member.issym():
                    if ALLOWED_SYMLINKS.get(normalized) != member.linkname:
                        raise BuildError("release archive contains an unsupported symlink")
                    symlink_count += 1
                    file_names.add(normalized)
                    continue
                if member.isdir():
                    continue
                if not member.isfile():
                    raise BuildError("release archive contains a non-regular member")
                file_names.add(normalized)
                total_size += max(member.size, 0)
                if total_size > MAX_UNCOMPRESSED_BYTES:
                    raise BuildError("release archive uncompressed size exceeds the bound")
    except tarfile.TarError as exc:
        raise BuildError("release archive is not a readable gzip tarball") from exc

    if file_names != set(expected_members):
        raise BuildError("release archive members do not match the verified source tree")
    return {
        "memberCount": member_count,
        "fileCount": len(file_names) - symlink_count,
        "symlinkCount": symlink_count,
        "uncompressedSizeBytes": total_size,
    }


def write_json(path: Path, payload: dict[str, object]) -> None:
    created = False
    try:
        with path.open("x", encoding="utf-8") as destination:
            created = True
            json.dump(payload, destination, indent=2)
            destination.write("\n")
        os.chmod(path, 0o600)
    except Exception:
        if created:
            path.unlink(missing_ok=True)
        raise


def sign_and_verify(manifest: Path, signing_key: Path, signature: Path) -> str:
    created = False
    try:
        with tempfile.TemporaryDirectory(prefix="careconnect-signature-") as temp_dir:
            temp_root = Path(temp_dir)
            signing_manifest = temp_root / manifest.name
            shutil.copyfile(manifest, signing_manifest)
            sign = run(
                [
                    "ssh-keygen",
                    "-Y",
                    "sign",
                    "-f",
                    str(signing_key),
                    "-n",
                    SIGNATURE_NAMESPACE,
                    str(signing_manifest),
                ],
                timeout=30,
            )
            temporary_signature = Path(f"{signing_manifest}.sig")
            if sign.returncode != 0 or not temporary_signature.is_file():
                raise BuildError("release manifest signature was not created")
            with temporary_signature.open("rb") as source, signature.open("xb") as destination:
                created = True
                shutil.copyfileobj(source, destination)
            os.chmod(signature, 0o600)

            public = run(["ssh-keygen", "-y", "-f", str(signing_key)], timeout=30)
            if public.returncode != 0 or not public.stdout.strip():
                raise BuildError("release signing key could not be verified")
            allowed_signers = temp_root / "allowed-signers"
            public_key = public.stdout.decode("ascii").strip()
            allowed_signers.write_text(f"{SIGNER_IDENTITY} {public_key}\n", encoding="utf-8")
            verify = run(
                [
                    "ssh-keygen",
                    "-Y",
                    "verify",
                    "-f",
                    str(allowed_signers),
                    "-I",
                    SIGNER_IDENTITY,
                    "-n",
                    SIGNATURE_NAMESPACE,
                    "-s",
                    str(signature),
                ],
                input_bytes=manifest.read_bytes(),
                timeout=30,
            )
            if verify.returncode != 0:
                raise BuildError("release manifest signature verification failed")
            public_key_file = temp_root / "signer.pub"
            public_key_file.write_text(f"{public_key}\n", encoding="utf-8")
            fingerprint = run(["ssh-keygen", "-lf", str(public_key_file)], timeout=30)
            if fingerprint.returncode != 0:
                raise BuildError("release signer fingerprint could not be derived")
            fields = fingerprint.stdout.decode("utf-8", errors="replace").split()
            if len(fields) < 2 or not fields[1].startswith("SHA256:"):
                raise BuildError("release signer fingerprint is unavailable")
            return fields[1]
    except Exception:
        if created:
            signature.unlink(missing_ok=True)
        raise


def build(args: argparse.Namespace) -> dict[str, object]:
    require_command("git")
    require_command("ssh-keygen")
    source_repo, revision, tree, main_revision, members = validate_source(args)
    signing_key = validate_signing_key(args.signing_key, source_repo)
    out_dir = prepare_output_directory(
        args.out_dir,
        source_repo,
        args.allow_ephemeral_output_for_testing,
    )
    prefix = (
        f"careconnect-web-rollback-{revision[:12]}"
        if args.release_mode == "verified-ancestor-rollback"
        else f"careconnect-web-{revision[:12]}"
    )
    artifact = out_dir / f"{prefix}.tar.gz"
    manifest = out_dir / f"{prefix}.manifest.json"
    signature = out_dir / f"{prefix}.manifest.json.sig"
    inventory = out_dir / f"{prefix}.inventory.json"
    outputs = [artifact, manifest, signature, inventory]
    if any(path.exists() for path in outputs):
        raise BuildError("release output already exists")

    created: list[Path] = []
    try:
        source_epoch = int(git_output(source_repo, "show", "-s", "--format=%ct", revision).decode().strip())
        create_archive(source_repo, revision, artifact, source_epoch)
        created.append(artifact)
        archive_summary = validate_archive(artifact, members)
        artifact_sha256 = sha256_file(artifact)
        generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        manifest_payload: dict[str, object] = {
            "artifacts": [{"path": artifact.name, "sha256": artifact_sha256}],
            "generatedAt": generated_at,
            "revision": revision,
            "schemaVersion": MANIFEST_SCHEMA,
            "service": SERVICE,
        }
        write_json(manifest, manifest_payload)
        created.append(manifest)
        signer_fingerprint = sign_and_verify(manifest, signing_key, signature)
        created.append(signature)
        inventory_payload: dict[str, object] = {
            "artifacts": {
                "archive": {
                    "fileCount": archive_summary["fileCount"],
                    "memberCount": archive_summary["memberCount"],
                    "path": artifact.name,
                    "sha256": artifact_sha256,
                    "sizeBytes": artifact.stat().st_size,
                    "symlinkCount": archive_summary["symlinkCount"],
                    "uncompressedSizeBytes": archive_summary["uncompressedSizeBytes"],
                },
                "manifest": {
                    "path": manifest.name,
                    "sha256": sha256_file(manifest),
                    "sizeBytes": manifest.stat().st_size,
                },
                "signature": {
                    "path": signature.name,
                    "sha256": sha256_file(signature),
                    "sizeBytes": signature.stat().st_size,
                },
            },
            "builder": {
                "id": BUILDER_ID,
                "path": "scripts/releases/build-careconnect-release.py",
            },
            "generatedAt": generated_at,
            "releaseMode": args.release_mode,
            "schemaVersion": INVENTORY_SCHEMA,
            "service": SERVICE,
            "source": {
                "mainRevision": main_revision,
                "revision": revision,
                "tree": tree,
            },
            "verification": {
                "ancestorOfMainVerified": args.release_mode == "verified-ancestor-rollback",
                "archiveMembersMatchSource": True,
                "archiveSha256Verified": True,
                "exactMainVerified": args.release_mode == "exact-main",
                "executableImagePreserved": False,
                "executableRollbackProven": False,
                "expectedTreeProvided": args.expected_tree is not None,
                "expectedTreeMatched": args.expected_tree is None or args.expected_tree.lower() == tree,
                "signatureVerified": True,
                "signerFingerprint": signer_fingerprint,
                "sourceArchiveOnly": True,
                "sourceClean": True,
            },
        }
        write_json(inventory, inventory_payload)
        created.append(inventory)
        for path in outputs:
            os.chmod(path, 0o600)
        return {
            "artifact": artifact.name,
            "inventory": inventory.name,
            "manifest": manifest.name,
            "ok": True,
            "rawSensitiveOutputCollected": False,
            "releaseMode": args.release_mode,
            "revision": revision,
            "secretValuesCollected": False,
            "sha256": artifact_sha256,
            "signature": signature.name,
            "signatureVerified": True,
            "sourceTree": tree,
        }
    except Exception:
        for path in reversed(created):
            path.unlink(missing_ok=True)
        raise


def main() -> int:
    previous_umask = os.umask(0o077)
    try:
        payload = build(parse_args())
    except BuildError as exc:
        fail(str(exc))
    except (OSError, ValueError):
        fail("local release preparation failed")
    finally:
        os.umask(previous_umask)
    print(json.dumps(payload, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
