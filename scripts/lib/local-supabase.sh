#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DOCKER_SHIM_DIR=""
LOCAL_SUPABASE_WORKDIR=""

find_windows_docker() {
  local candidates=(
    "/mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe"
    "/mnt/c/ProgramData/chocolatey/bin/docker.exe"
    "/mnt/c/Users/${USER}/AppData/Local/Programs/Docker/Docker/resources/bin/docker.exe"
    "/mnt/c/Users/${USER}/AppData/Local/Microsoft/WindowsApps/docker.exe"
  )

  for candidate in "${candidates[@]}"; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  return 1
}

ensure_docker_command() {
  if command -v docker >/dev/null 2>&1; then
    return 0
  fi

  local windows_docker=""
  if command -v docker.exe >/dev/null 2>&1; then
    windows_docker="$(command -v docker.exe)"
  elif windows_docker="$(find_windows_docker)"; then
    :
  else
    return 1
  fi

  DOCKER_SHIM_DIR="$(mktemp -d)"
  cat >"$DOCKER_SHIM_DIR/docker" <<EOF
#!/usr/bin/env bash
exec "$windows_docker" "\$@"
EOF
  chmod +x "$DOCKER_SHIM_DIR/docker"
  export PATH="$DOCKER_SHIM_DIR:$PATH"
}

can_use_docker() {
  ensure_docker_command >/dev/null 2>&1 || return 1
  docker info >/dev/null 2>&1
}

require_commands() {
  local cmd
  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      echo "Missing required command: $cmd" >&2
      exit 1
    fi
  done
}

cleanup_local_supabase() {
  if [[ -n "$DOCKER_SHIM_DIR" ]]; then
    rm -rf "$DOCKER_SHIM_DIR"
    DOCKER_SHIM_DIR=""
  fi

  if [[ "${KEEP_SUPABASE_RUNNING:-0}" != "1" && -n "$LOCAL_SUPABASE_WORKDIR" ]]; then
    npx supabase stop --workdir "$LOCAL_SUPABASE_WORKDIR" --no-backup >/dev/null 2>&1 || true
  fi

  if [[ -n "$LOCAL_SUPABASE_WORKDIR" ]]; then
    rm -rf "$LOCAL_SUPABASE_WORKDIR"
    LOCAL_SUPABASE_WORKDIR=""
  fi
}

prepare_local_supabase() {
  local seed_source="${1:-$PROJECT_ROOT_DIR/supabase/test-support/integration-seed.sql}"

  LOCAL_SUPABASE_WORKDIR="$(mktemp -d)"
  mkdir -p "$LOCAL_SUPABASE_WORKDIR/supabase/migrations"

  cp "$PROJECT_ROOT_DIR/supabase/config.toml" "$LOCAL_SUPABASE_WORKDIR/supabase/config.toml"

  local migration_file
  for migration_file in "$PROJECT_ROOT_DIR"/supabase/migrations/*.sql; do
    [[ -f "$migration_file" ]] && cp "$migration_file" "$LOCAL_SUPABASE_WORKDIR/supabase/migrations/"
  done

  cp "$seed_source" "$LOCAL_SUPABASE_WORKDIR/supabase/seed.sql"

  npx supabase start \
    --workdir "$LOCAL_SUPABASE_WORKDIR" \
    --exclude studio,storage-api,imgproxy,mailpit,realtime,postgres-meta,edge-runtime,logflare,vector
  eval "$(npx supabase status -o env --workdir "$LOCAL_SUPABASE_WORKDIR")"

  if [[ -z "${API_URL:-}" || -z "${DB_URL:-}" || -z "${ANON_KEY:-}" || -z "${SERVICE_ROLE_KEY:-}" || -z "${JWT_SECRET:-}" ]]; then
    echo "Supabase status did not return the required local credentials." >&2
    exit 1
  fi

  npx supabase db reset --workdir "$LOCAL_SUPABASE_WORKDIR"

  export SUPABASE_URL="$API_URL"
  export SUPABASE_ANON_KEY="$ANON_KEY"
  export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
  export SUPABASE_JWT_SECRET="$JWT_SECRET"
  export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
  export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"
}
