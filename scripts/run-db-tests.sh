#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DOCKER_SHIM_DIR=""
SUPABASE_WORKDIR=""

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

if ! ensure_docker_command; then
  cat >&2 <<'EOF'
Missing required command: docker

Checked for:
- native WSL docker on PATH
- docker.exe on PATH
- common Docker Desktop Windows install paths

Docker Desktop is not reachable from this WSL distro. Enable WSL integration for this distro
or install Docker so `docker` is available here, then rerun `npm run test:db`.
EOF
  exit 1
fi

for cmd in psql npx; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
done

cleanup() {
  if [[ -n "$DOCKER_SHIM_DIR" ]]; then
    rm -rf "$DOCKER_SHIM_DIR"
  fi
  if [[ "${KEEP_SUPABASE_RUNNING:-0}" != "1" && -n "$SUPABASE_WORKDIR" ]]; then
    npx supabase stop --workdir "$SUPABASE_WORKDIR" --no-backup >/dev/null 2>&1 || true
  fi
  if [[ -n "$SUPABASE_WORKDIR" ]]; then
    rm -rf "$SUPABASE_WORKDIR"
  fi
}

trap cleanup EXIT

SUPABASE_WORKDIR="$(mktemp -d)"
mkdir -p "$SUPABASE_WORKDIR/supabase/migrations"
cp "$ROOT_DIR/supabase/config.toml" "$SUPABASE_WORKDIR/supabase/config.toml"

# Copy only active migration files (exclude _archive directory)
for f in "$ROOT_DIR"/supabase/migrations/*.sql; do
  [ -f "$f" ] && cp "$f" "$SUPABASE_WORKDIR/supabase/migrations/"
done

# Create minimal seed that applies integration fixtures
cp "$ROOT_DIR/supabase/test-support/integration-seed.sql" "$SUPABASE_WORKDIR/supabase/seed.sql"

npx supabase start \
  --workdir "$SUPABASE_WORKDIR" \
  --exclude studio,storage-api,imgproxy,mailpit,realtime,postgres-meta,edge-runtime,logflare,vector
eval "$(npx supabase status -o env --workdir "$SUPABASE_WORKDIR")"

if [[ -z "${API_URL:-}" || -z "${DB_URL:-}" || -z "${ANON_KEY:-}" || -z "${SERVICE_ROLE_KEY:-}" || -z "${JWT_SECRET:-}" ]]; then
  echo "Supabase status did not return the required local credentials." >&2
  exit 1
fi

# Apply migrations and seed via supabase db reset (proves migration chain works)
npx supabase db reset --workdir "$SUPABASE_WORKDIR"

export SUPABASE_URL="$API_URL"
export SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export SUPABASE_JWT_SECRET="$JWT_SECRET"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"

npx vitest --config vitest.db.config.mts run "$@"
