#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 /path/to/env-file" >&2
  exit 1
fi

env_file="$1"
app_dir="$(cd "$(dirname "$0")/../.." && pwd)"
image_name="careconnect-web"

if git_revision="$(git -C "$app_dir" rev-parse --short HEAD 2>/dev/null)"; then
  tag="$git_revision"
elif [[ -f "$app_dir/REVISION" ]]; then
  tag="$(tr -d '[:space:]' < "$app_dir/REVISION")"
else
  tag="$(date -u +%Y%m%d%H%M%S)"
fi

container_name="careconnect-web"
host_bind="127.0.0.1:3300:3000"

read_env_value() {
  local key="$1"
  local value
  value="$(grep -E "^${key}=" "$env_file" | tail -n 1 | cut -d= -f2- || true)"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "$value"
}

if [[ ! -f "$env_file" ]]; then
  echo "env file not found: $env_file" >&2
  exit 1
fi

next_public_supabase_url="$(read_env_value "NEXT_PUBLIC_SUPABASE_URL")"
next_public_supabase_publishable_key="$(read_env_value "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")"

if [[ -z "$next_public_supabase_url" || -z "$next_public_supabase_publishable_key" ]]; then
  echo "env file must define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" >&2
  exit 1
fi

build_args=(
  "--build-arg" "NEXT_PUBLIC_SUPABASE_URL=${next_public_supabase_url}"
  "--build-arg" "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${next_public_supabase_publishable_key}"
)

for key in \
  NEXT_PUBLIC_APP_URL \
  NEXT_PUBLIC_BASE_URL \
  NEXT_PUBLIC_SEARCH_MODE \
  NEXT_PUBLIC_ONESIGNAL_APP_ID \
  NEXT_PUBLIC_VAPID_PUBLIC_KEY \
  NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING
do
  value="$(read_env_value "$key")"
  if [[ -n "$value" ]]; then
    build_args+=("--build-arg" "${key}=${value}")
  fi
done

if docker buildx version >/dev/null 2>&1; then
  docker buildx build --load "${build_args[@]}" -t "${image_name}:${tag}" "$app_dir"
else
  echo "warning: docker buildx not available; falling back to legacy docker build" >&2
  docker build "${build_args[@]}" -t "${image_name}:${tag}" "$app_dir"
fi

if docker ps -a --format '{{.Names}}' | grep -Fxq "$container_name"; then
  docker rm -f "$container_name" >/dev/null
fi

docker run -d \
  --name "$container_name" \
  --restart unless-stopped \
  --env-file "$env_file" \
  -e "APP_VERSION=$tag" \
  -p "$host_bind" \
  "${image_name}:${tag}"

echo "container=${container_name}"
echo "image=${image_name}:${tag}"
echo "health_url=http://127.0.0.1:3300/api/v1/health"

echo "Waiting for container to become healthy..."
health_ok=false
for i in 1 2 3 4 5; do
  if curl -fsS http://127.0.0.1:3300/api/v1/health >/dev/null 2>&1; then
    health_ok=true
    break
  fi
  sleep 3
done

if [[ "$health_ok" == "true" ]]; then
  echo "health_check=ok"
else
  echo "health_check=failed — container did not respond after 15s" >&2
  exit 1
fi
