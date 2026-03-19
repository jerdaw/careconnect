#!/bin/bash
# Enforce v22.0 Gate 0 exit decision for CI/build safety.
# Blocks execution unless Gate 0 decision is explicitly GO and all required checks are pass.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHECKLIST_PATH="${GATE0_CHECKLIST_PATH:-$PROJECT_ROOT/docs/implementation/v22-0-gate-0-exit-checklist.md}"

if [[ ! -f "$CHECKLIST_PATH" ]]; then
  echo "ERROR: Gate 0 checklist not found at: $CHECKLIST_PATH"
  exit 1
fi

decision_line="$(grep -E '^\|[[:space:]]*Gate 0 Exit Decision[[:space:]]*\|' "$CHECKLIST_PATH" | head -n 1 || true)"

if [[ -z "$decision_line" ]]; then
  echo "ERROR: Could not find 'Gate 0 Exit Decision' row in: $CHECKLIST_PATH"
  exit 1
fi

decision_raw="$(echo "$decision_line" | awk -F'|' '{print $3}')"
decision="$(echo "$decision_raw" | tr -d '[:space:]*`' | tr '[:lower:]' '[:upper:]')"

non_pass_checks=()
while IFS= read -r line; do
  check_id="$(echo "$line" | awk -F'|' '{gsub(/[[:space:]]/, "", $2); print $2}')"
  status_raw="$(echo "$line" | awk -F'|' '{print $4}')"
  status="$(echo "$status_raw" | tr -d '[:space:]*`' | tr '[:lower:]' '[:upper:]')"

  if [[ "$status" != "PASS" ]]; then
    non_pass_checks+=("${check_id}:${status}")
  fi
done < <(grep -E '^\|[[:space:]]*G0-[0-9]+[[:space:]]*\|' "$CHECKLIST_PATH" || true)

if [[ "$decision" != "GO" ]]; then
  blocking_line="$(grep -E '^\|[[:space:]]*Blocking Checks[[:space:]]*\|' "$CHECKLIST_PATH" | head -n 1 || true)"
  blocking_checks="see checklist"

  if [[ -n "$blocking_line" ]]; then
    blocking_raw="$(echo "$blocking_line" | awk -F'|' '{print $3}')"
    blocking_checks="$(echo "$blocking_raw" | sed 's/^ *//;s/ *$//')"
  fi

  echo "BLOCKED: v22.0 Gate 0 decision is '$decision' (must be GO)."
  echo "Checklist: $CHECKLIST_PATH"
  echo "Blocking checks: $blocking_checks"
  exit 1
fi

if [[ ${#non_pass_checks[@]} -gt 0 ]]; then
  echo "BLOCKED: Gate 0 decision is GO but required checks are not all pass."
  echo "Checklist: $CHECKLIST_PATH"
  printf 'Non-pass checks: %s\n' "${non_pass_checks[*]}"
  exit 1
fi

echo "OK: v22.0 Gate 0 decision is GO and all required checks are pass."
