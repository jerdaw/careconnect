#!/bin/bash
# Validate v22.0 offline/local threat-model consistency for Gate 0 security.
# This guard checks the public threat-model record against its own rule:
# no unresolved critical findings, and high findings must have owners, due dates,
# and mitigation plans. It does not judge mitigation sufficiency.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
THREAT_MODEL_PATH="${V22_THREAT_MODEL_PATH:-$PROJECT_ROOT/docs/security/v22-0-offline-local-threat-model.md}"

errors=()
unresolved_critical_ids=()
high_incomplete_ids=()

add_error() {
  errors+=("$1")
}

trim_value() {
  sed 's/^ *//;s/ *$//' <<<"$1"
}

normalize_token() {
  echo "$1" | tr -d '[:space:]*`' | tr '[:upper:]' '[:lower:]'
}

is_blank_or_placeholder() {
  local normalized

  normalized="$(normalize_token "$1")"
  [[ -z "$normalized" || "$normalized" == "pending" || "$normalized" == "tbd" || "$normalized" == "n/a" || "$normalized" == "-" ]]
}

markdown_cell() {
  local row="$1"
  local cell_number="$2"

  awk -F'|' -v cell="$cell_number" '{print $cell}' <<<"$row" | sed 's/^ *//;s/ *$//'
}

outcome_status() {
  local criterion="$1"
  local row

  row="$(grep -E "^\|[[:space:]]*$criterion[[:space:]]*\|" "$THREAT_MODEL_PATH" | head -n 1 || true)"
  if [[ -z "$row" ]]; then
    echo ""
    return
  fi

  normalize_token "$(markdown_cell "$row" 3)"
}

require_go_outcome() {
  local criterion="$1"
  local reason="$2"
  local status

  status="$(outcome_status "$criterion")"
  if [[ -z "$status" ]]; then
    add_error "Gate 0 Security Outcome is missing criterion: $criterion"
    return
  fi

  if [[ "$status" != "go" ]]; then
    add_error "$criterion must be GO because $reason."
  fi
}

if [[ ! -f "$THREAT_MODEL_PATH" ]]; then
  echo "ERROR: v22.0 threat model not found at: $THREAT_MODEL_PATH"
  exit 1
fi

mitigation_rows=0
in_mitigation_tracking=0
while IFS= read -r row; do
  if [[ "$row" =~ ^##[[:space:]]+Mitigation[[:space:]]+Tracking[[:space:]]*$ ]]; then
    in_mitigation_tracking=1
    continue
  fi

  if [[ "$in_mitigation_tracking" -eq 1 && "$row" =~ ^##[[:space:]]+ ]]; then
    break
  fi

  [[ "$in_mitigation_tracking" -eq 1 ]] || continue
  [[ "$row" =~ ^\|[[:space:]]*F[0-9]+[[:space:]]*\| ]] || continue

  mitigation_rows=$((mitigation_rows + 1))
  finding_id="$(markdown_cell "$row" 2)"
  severity="$(normalize_token "$(markdown_cell "$row" 3)")"
  mitigation_plan="$(markdown_cell "$row" 4)"
  owner="$(markdown_cell "$row" 5)"
  due_date="$(markdown_cell "$row" 6)"
  verification_method="$(markdown_cell "$row" 7)"
  verified="$(normalize_token "$(markdown_cell "$row" 8)")"

  case "$severity" in
    critical|high|medium|low) ;;
    *) add_error "$finding_id has unknown severity '$severity' in $THREAT_MODEL_PATH." ;;
  esac

  case "$verified" in
    yes|no) ;;
    *) add_error "$finding_id has unknown Verified value '$verified' in $THREAT_MODEL_PATH." ;;
  esac

  if is_blank_or_placeholder "$mitigation_plan"; then
    add_error "$finding_id must include a mitigation plan."
  fi

  if is_blank_or_placeholder "$owner"; then
    add_error "$finding_id must include an owner."
  fi

  if is_blank_or_placeholder "$due_date"; then
    add_error "$finding_id must include a due date."
  elif [[ ! "$due_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    add_error "$finding_id due date must use YYYY-MM-DD format."
  fi

  if is_blank_or_placeholder "$verification_method"; then
    add_error "$finding_id must include a verification method."
  fi

  if [[ "$severity" == "critical" && "$verified" != "yes" ]]; then
    unresolved_critical_ids+=("$finding_id")
  fi

  if [[ "$severity" == "high" ]]; then
    if is_blank_or_placeholder "$mitigation_plan" || is_blank_or_placeholder "$owner" || is_blank_or_placeholder "$due_date"; then
      high_incomplete_ids+=("$finding_id")
    fi
  fi
done < "$THREAT_MODEL_PATH"

if [[ "$mitigation_rows" -eq 0 ]]; then
  add_error "No mitigation tracking rows were found in $THREAT_MODEL_PATH."
fi

if [[ "${#unresolved_critical_ids[@]}" -gt 0 ]]; then
  add_error "Unresolved critical findings block Gate 0 security outcome: ${unresolved_critical_ids[*]}."
else
  require_go_outcome "Critical findings resolved" "there are no unresolved critical findings"
fi

if [[ "${#high_incomplete_ids[@]}" -gt 0 ]]; then
  add_error "High findings are missing owner, due date, or mitigation plan: ${high_incomplete_ids[*]}."
else
  require_go_outcome "High findings have owners and mitigation plans" "all high findings have owners, due dates, and mitigation plans"
fi

signoff_status="$(outcome_status "Threat model signed by security/governance owner")"
if [[ -z "$signoff_status" ]]; then
  add_error "Gate 0 Security Outcome is missing criterion: Threat model signed by security/governance owner"
elif [[ "$signoff_status" == "go" ]]; then
  signoff_line="$(grep -E '^- Security/governance owner review:[[:space:]]*`?[^`[:space:]]+' "$THREAT_MODEL_PATH" | head -n 1 || true)"
  if [[ -z "$signoff_line" ]] || grep -Eiq 'pending|tbd|not signed|n/a' <<<"$signoff_line"; then
    add_error "Threat model signed outcome is GO but sign-off line is missing or placeholder."
  fi
else
  add_error "Threat model signed by security/governance owner must be GO for Gate 0 security outcome."
fi

if [[ "${#errors[@]}" -gt 0 ]]; then
  echo "ERROR: v22.0 threat-model Gate 0 security outcome is inconsistent."
  printf -- '- %s\n' "${errors[@]}"
  exit 1
fi

echo "OK: v22.0 threat-model Gate 0 security outcome is internally consistent."
