#!/bin/bash
# Enforce v22.0 Gate 0 exit decision for CI/build safety.
# Blocks execution unless Gate 0 decision is explicitly GO and all required checks are pass.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHECKLIST_PATH="${GATE0_CHECKLIST_PATH:-$PROJECT_ROOT/docs/implementation/v22-0-gate-0-exit-checklist.md}"
EVIDENCE_INTAKE_SCRIPT="$PROJECT_ROOT/scripts/check-v22-evidence-intake.sh"
THREAT_MODEL_SCRIPT="$PROJECT_ROOT/scripts/check-v22-threat-model.sh"

if [[ ! -f "$CHECKLIST_PATH" ]]; then
  echo "ERROR: Gate 0 checklist not found at: $CHECKLIST_PATH"
  exit 1
fi

if [[ -f "$EVIDENCE_INTAKE_SCRIPT" ]]; then
  bash "$EVIDENCE_INTAKE_SCRIPT"
fi

if [[ -f "$THREAT_MODEL_SCRIPT" ]]; then
  bash "$THREAT_MODEL_SCRIPT"
fi

decision_line="$(grep -E '^\|[[:space:]]*Gate 0 Exit Decision[[:space:]]*\|' "$CHECKLIST_PATH" | head -n 1 || true)"

if [[ -z "$decision_line" ]]; then
  echo "ERROR: Could not find 'Gate 0 Exit Decision' row in: $CHECKLIST_PATH"
  exit 1
fi

decision_raw="$(echo "$decision_line" | awk -F'|' '{print $3}')"
decision="$(echo "$decision_raw" | tr -d '[:space:]*`' | tr '[:lower:]' '[:upper:]')"

non_pass_checks=()
non_pass_check_ids=()
while IFS= read -r line; do
  check_id="$(echo "$line" | awk -F'|' '{gsub(/[[:space:]]/, "", $2); print $2}')"
  status_raw="$(echo "$line" | awk -F'|' '{print $4}')"
  status="$(echo "$status_raw" | tr -d '[:space:]*`' | tr '[:lower:]' '[:upper:]')"

  if [[ "$status" != "PASS" ]]; then
    non_pass_checks+=("${check_id}:${status}")
    non_pass_check_ids+=("$check_id")
  fi
done < <(grep -E '^\|[[:space:]]*G0-[0-9]+[[:space:]]*\|' "$CHECKLIST_PATH" || true)

join_sorted_checks() {
  if [[ $# -eq 0 ]]; then
    echo ""
    return
  fi

  printf '%s\n' "$@" | sort -V | paste -sd ',' -
}

extract_blocking_check_ids() {
  local raw="$1"
  local ids

  ids="$(grep -oE 'G0-[0-9]+' <<<"$raw" || true)"

  if [[ -z "$ids" ]]; then
    echo ""
    return
  fi

  printf '%s\n' "$ids" | sort -V | paste -sd ',' -
}

if [[ "$decision" != "GO" ]]; then
  blocking_line="$(grep -E '^\|[[:space:]]*Blocking Checks[[:space:]]*\|' "$CHECKLIST_PATH" | head -n 1 || true)"
  blocking_checks="see checklist"
  blocking_check_ids=""

  if [[ -n "$blocking_line" ]]; then
    blocking_raw="$(echo "$blocking_line" | awk -F'|' '{print $3}')"
    blocking_checks="$(echo "$blocking_raw" | sed 's/^ *//;s/ *$//')"
    blocking_check_ids="$(extract_blocking_check_ids "$blocking_checks")"
  fi

  expected_blocking_check_ids="$(join_sorted_checks "${non_pass_check_ids[@]}")"

  echo "BLOCKED: v22.0 Gate 0 decision is '$decision' (must be GO)."
  echo "Checklist: $CHECKLIST_PATH"
  echo "Blocking checks: $blocking_checks"

  if [[ "$blocking_check_ids" != "$expected_blocking_check_ids" ]]; then
    echo "ERROR: Gate 0 Blocking Checks row does not match required-check statuses."
    echo "Expected blocking checks: ${expected_blocking_check_ids:-none}"
    echo "Actual blocking checks: ${blocking_check_ids:-none}"
  fi

  exit 1
fi

if [[ ${#non_pass_checks[@]} -gt 0 ]]; then
  echo "BLOCKED: Gate 0 decision is GO but required checks are not all pass."
  echo "Checklist: $CHECKLIST_PATH"
  printf 'Non-pass checks: %s\n' "${non_pass_checks[*]}"
  exit 1
fi

echo "OK: v22.0 Gate 0 decision is GO and all required checks are pass."
