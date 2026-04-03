#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF' >&2
usage: scripts/release-vps-proof.sh <ssh-target> [--deploy]

Creates a release from the current committed tree, uploads it to the VPS,
repoints /srv/apps/careconnect-web/current, and optionally runs the
VPS deploy script.

Environment overrides:
  CARECONNECT_VPS_APP_ROOT   default: /srv/apps/careconnect-web
  CARECONNECT_VPS_ENV_FILE   default: /etc/projects-merge/env/careconnect-web.env
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
app_root="${CARECONNECT_VPS_APP_ROOT:-/srv/apps/careconnect-web}"
env_file="${CARECONNECT_VPS_ENV_FILE:-/etc/projects-merge/env/careconnect-web.env}"

if ! git -C "$repo_root" diff --quiet || ! git -C "$repo_root" diff --cached --quiet; then
  echo "working tree must be clean before creating a release" >&2
  exit 1
fi

revision="$(git -C "$repo_root" rev-parse --short HEAD)"
timestamp="$(date -u +%Y%m%d%H%M%S)"
release_dir="${app_root}/releases/${timestamp}-${revision}"

ssh "$ssh_target" "mkdir -p '$release_dir'"

git -C "$repo_root" archive --format=tar HEAD \
  | ssh "$ssh_target" "tar -xf - -C '$release_dir'"

ssh "$ssh_target" "
  printf '%s\n' '$revision' > '$release_dir/REVISION' &&
  ln -sfn '$release_dir' '$app_root/current' &&
  printf 'CURRENT=%s\n' \"\$(readlink -f '$app_root/current')\" &&
  printf 'REVISION=%s\n' \"\$(cat '$app_root/current/REVISION')\"
"

if [[ "$deploy_after_release" == "true" ]]; then
  ssh "$ssh_target" "
    cd '$app_root/current' &&
    ./scripts/archive/deploy-vps-proof.sh '$env_file'
  "
fi
