#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

source "$ROOT_DIR/scripts/lib/local-supabase.sh"

if ! ensure_docker_command; then
  cat >&2 <<'EOF'
Missing required command: docker

Checked for:
- native WSL docker on PATH
- docker.exe on PATH
- common Docker Desktop Windows install paths

Docker Desktop is not reachable from this WSL distro. Enable WSL integration for this distro
or install Docker so `docker` is available here, then rerun `npm run db:types`.
EOF
  exit 1
fi

require_commands npx
trap cleanup_local_supabase EXIT

prepare_local_supabase "$ROOT_DIR/supabase/test-support/integration-seed.sql"

npx supabase gen types typescript --local --workdir "$LOCAL_SUPABASE_WORKDIR" --schema public >"$ROOT_DIR/types/supabase.ts"
npx prettier --write "$ROOT_DIR/types/supabase.ts"
