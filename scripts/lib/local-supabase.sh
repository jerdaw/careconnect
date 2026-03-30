#!/usr/bin/env bash
set -euo pipefail

HB_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HB_DOCKER_SHIM_DIR=""
HB_SUPABASE_WORKDIR=""

hb_find_windows_docker() {
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

hb_ensure_docker_command() {
  if command -v docker >/dev/null 2>&1; then
    return 0
  fi

  local windows_docker=""
  if command -v docker.exe >/dev/null 2>&1; then
    windows_docker="$(command -v docker.exe)"
  elif windows_docker="$(hb_find_windows_docker)"; then
    :
  else
    return 1
  fi

  HB_DOCKER_SHIM_DIR="$(mktemp -d)"
  cat >"$HB_DOCKER_SHIM_DIR/docker" <<EOF
#!/usr/bin/env bash
exec "$windows_docker" "\$@"
EOF
  chmod +x "$HB_DOCKER_SHIM_DIR/docker"
  export PATH="$HB_DOCKER_SHIM_DIR:$PATH"
}

hb_require_commands() {
  local cmd
  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      echo "Missing required command: $cmd" >&2
      exit 1
    fi
  done
}

hb_cleanup_local_supabase() {
  if [[ -n "$HB_DOCKER_SHIM_DIR" ]]; then
    rm -rf "$HB_DOCKER_SHIM_DIR"
    HB_DOCKER_SHIM_DIR=""
  fi

  if [[ "${KEEP_SUPABASE_RUNNING:-0}" != "1" && -n "$HB_SUPABASE_WORKDIR" ]]; then
    npx supabase stop --workdir "$HB_SUPABASE_WORKDIR" --no-backup >/dev/null 2>&1 || true
  fi

  if [[ -n "$HB_SUPABASE_WORKDIR" ]]; then
    rm -rf "$HB_SUPABASE_WORKDIR"
    HB_SUPABASE_WORKDIR=""
  fi
}

hb_prepare_local_supabase() {
  local seed_source="${1:-$HB_ROOT_DIR/supabase/test-support/integration-seed.sql}"

  HB_SUPABASE_WORKDIR="$(mktemp -d)"
  mkdir -p "$HB_SUPABASE_WORKDIR/supabase/migrations"

  cp "$HB_ROOT_DIR/supabase/config.toml" "$HB_SUPABASE_WORKDIR/supabase/config.toml"

  local migration_file
  for migration_file in "$HB_ROOT_DIR"/supabase/migrations/*.sql; do
    [[ -f "$migration_file" ]] && cp "$migration_file" "$HB_SUPABASE_WORKDIR/supabase/migrations/"
  done

  cp "$seed_source" "$HB_SUPABASE_WORKDIR/supabase/seed.sql"

  npx supabase start \
    --workdir "$HB_SUPABASE_WORKDIR" \
    --exclude studio,storage-api,imgproxy,mailpit,realtime,postgres-meta,edge-runtime,logflare,vector
  eval "$(npx supabase status -o env --workdir "$HB_SUPABASE_WORKDIR")"

  if [[ -z "${API_URL:-}" || -z "${DB_URL:-}" || -z "${ANON_KEY:-}" || -z "${SERVICE_ROLE_KEY:-}" || -z "${JWT_SECRET:-}" ]]; then
    echo "Supabase status did not return the required local credentials." >&2
    exit 1
  fi

  npx supabase db reset --workdir "$HB_SUPABASE_WORKDIR"

  export SUPABASE_URL="$API_URL"
  export SUPABASE_ANON_KEY="$ANON_KEY"
  export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
  export SUPABASE_JWT_SECRET="$JWT_SECRET"
  export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
  export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"
}
