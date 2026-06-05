#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
usage: scripts/release-vps-proof.sh <ssh-target> [--deploy]

Creates a release from the current committed tree and uploads it to a remote
release root. This public helper is intentionally generic and does not embed
production host paths.

Required environment:
  CARECONNECT_RELEASE_ROOT      Remote release root containing releases/ and current

Optional environment:
  CARECONNECT_REMOTE_ENV_FILE   Remote env file passed to deploy helper with --deploy

The optional --deploy mode is only for targets where the SSH user can already
read the configured env file and operate Docker without an interactive sudo step.
EOF
  exit 1
}

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage
fi

ssh_target="$1"
deploy_after_release="false"

if [[ $# -eq 2 ]]; then
  if [[ "$2" != "--deploy" ]]; then
    usage
  fi
  deploy_after_release="true"
fi

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
release_root="${CARECONNECT_RELEASE_ROOT:-}"
env_file="${CARECONNECT_REMOTE_ENV_FILE:-}"

if [[ -z "$release_root" ]]; then
  echo "CARECONNECT_RELEASE_ROOT must be set" >&2
  exit 1
fi

if [[ "$deploy_after_release" == "true" && -z "$env_file" ]]; then
  echo "CARECONNECT_REMOTE_ENV_FILE must be set when using --deploy" >&2
  exit 1
fi

if ! git -C "$repo_root" diff --quiet || ! git -C "$repo_root" diff --cached --quiet; then
  echo "working tree must be clean before creating a release" >&2
  exit 1
fi

revision="$(git -C "$repo_root" rev-parse --short HEAD)"
timestamp="$(date -u +%Y%m%d%H%M%S)"
release_dir="${release_root}/releases/${timestamp}-${revision}"
current_link="${release_root}/current"

ssh "$ssh_target" "mkdir -p '$release_dir'"

git -C "$repo_root" archive --format=tar HEAD \
  | ssh "$ssh_target" "tar -xf - -C '$release_dir'"

ssh "$ssh_target" "
  printf '%s\n' '$revision' > '$release_dir/REVISION' &&
  ln -sfn '$release_dir' '$current_link' &&
  printf 'CURRENT=%s\n' \"\$(readlink -f '$current_link')\" &&
  printf 'REVISION=%s\n' \"\$(cat '$current_link/REVISION')\"
"

if [[ "$deploy_after_release" == "true" ]]; then
  ssh "$ssh_target" "
    cd '$current_link' &&
    ./scripts/archive/deploy-vps-proof.sh '$env_file'
  "
fi
