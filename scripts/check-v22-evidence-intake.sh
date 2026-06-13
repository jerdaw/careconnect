#!/bin/bash
# Validate v22.0 Gate 0 C1/D4 evidence-intake consistency.
# This guard does not judge legal sufficiency or partner quality. It only
# prevents docs from claiming C1/D4 closure while canonical evidence remains
# prep-only or placeholder-only.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

CHECKLIST_PATH="${GATE0_CHECKLIST_PATH:-$PROJECT_ROOT/docs/implementation/v22-0-gate-0-exit-checklist.md}"
TRACKER_PATH="${GATE0_TRACKER_PATH:-$PROJECT_ROOT/docs/implementation/v22-0-gate-0-user-action-tracker.md}"
C1_CONTROL_PATH="${GATE0_C1_CONTROL_PATH:-$PROJECT_ROOT/docs/implementation/v22-0-control-c1-legal-review.md}"
C1_EVIDENCE_DIR="${GATE0_C1_EVIDENCE_DIR:-$PROJECT_ROOT/docs/implementation/v22-0-evidence/c1-partner-terms}"
D4_EVIDENCE_DIR="${GATE0_D4_EVIDENCE_DIR:-$PROJECT_ROOT/docs/implementation/v22-0-evidence/d4-partner-ops}"

errors=()
D4_PROVIDER_TARGET_COUNT=0
D4_FRONTLINE_ORG_TARGET_COUNT=0
D4_OUTREACH_EXECUTION_ROW_COUNT=0
D4_ARTIFACT_REFERENCES=$'\n'
D4_HAS_OUTREACH_ARTIFACT_REFERENCE=0
C1_INVENTORY_MATRIX_REFERENCES=$'\n'
C1_INVENTORY_HAS_MATRIX_REFERENCE=0

add_error() {
  errors+=("$1")
}

require_file() {
  local path="$1"
  local label="$2"

  if [[ ! -f "$path" ]]; then
    add_error "$label not found at: $path"
  fi
}

normalize_status() {
  echo "$1" | tr -d '[:space:]*`' | tr '[:lower:]' '[:upper:]'
}

trim_value() {
  sed 's/^ *//;s/ *$//' <<<"$1"
}

normalize_markdown_row() {
  awk -F'|' '
    {
      output = "|"
      for (i = 2; i < NF; i++) {
        cell = $i
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", cell)
        output = output " " cell " |"
      }
      print output
    }
  ' <<<"$1"
}

markdown_cell() {
  local file="$1"
  local row_id="$2"
  local cell_number="$3"
  local row

  row="$(grep -E "^\|[[:space:]]*$row_id[[:space:]]*\|" "$file" | head -n 1 || true)"

  if [[ -z "$row" ]]; then
    echo ""
    return
  fi

  awk -F'|' -v cell="$cell_number" '{print $cell}' <<<"$row" | sed 's/^ *//;s/ *$//'
}

gate_status() {
  normalize_status "$(markdown_cell "$CHECKLIST_PATH" "$1" 4)"
}

action_status() {
  normalize_status "$(markdown_cell "$TRACKER_PATH" "$1" 6)"
}

frontmatter_field() {
  local file="$1"
  local field="$2"

  awk -v field="$field" '
    NR == 1 && $0 == "---" { in_frontmatter = 1; next }
    in_frontmatter && $0 == "---" { exit }
    in_frontmatter && $0 ~ "^" field ":" {
      sub("^" field ":[[:space:]]*", "", $0)
      print $0
      exit
    }
  ' "$file"
}

is_prep_only() {
  local file="$1"
  local value

  value="$(frontmatter_field "$file" "evidence_status" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  [[ "$value" == "prep_only" ]]
}

line_value() {
  local file="$1"
  local label="$2"
  local line

  line="$(grep -E "^(-[[:space:]]*)?$label(:|\\?)" "$file" | head -n 1 || true)"

  if [[ -z "$line" ]]; then
    echo ""
    return
  fi

  sed -E "s/^(-[[:space:]]*)?$label(:|\\?)[[:space:]]*//" <<<"$line" | sed 's/^ *//;s/ *$//'
}

is_blank_or_pending() {
  local value

  value="$(echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/^ *//;s/ *$//')"

  [[ -z "$value" || "$value" == "pending" || "$value" == "n/a" || "$value" == "not attached" ]]
}

require_filled_line() {
  local file="$1"
  local label="$2"
  local value

  value="$(line_value "$file" "$label")"
  if is_blank_or_pending "$value"; then
    add_error "$file must include a non-placeholder '$label' value."
  fi
}

require_date_line() {
  local file="$1"
  local label="$2"
  local value

  value="$(line_value "$file" "$label")"
  if is_blank_or_pending "$value"; then
    add_error "$file must include a non-placeholder '$label' value."
  elif [[ ! "$value" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    add_error "$file must include a '$label' value in YYYY-MM-DD format."
  fi
}

require_positive_integer_line() {
  local file="$1"
  local label="$2"
  local value

  value="$(line_value "$file" "$label")"
  if is_blank_or_pending "$value"; then
    add_error "$file must include a non-placeholder '$label' value."
  elif [[ ! "$value" =~ ^[1-9][0-9]*$ ]]; then
    add_error "$file must include a positive integer '$label' value."
  fi
}

require_submission_id_matches_file() {
  local file="$1"
  local expected_id="$2"
  local actual_id

  actual_id="$(line_value "$file" "Submission ID")"
  if is_blank_or_pending "$actual_id"; then
    add_error "$file must include a non-placeholder 'Submission ID' value."
  elif [[ "$actual_id" != "$expected_id" ]]; then
    add_error "$file Submission ID '$actual_id' must match filename-derived ID '$expected_id'."
  fi
}

latest_non_prep_submission() {
  local dir="$1"
  local prefix="$2"
  local candidate

  while IFS= read -r candidate; do
    if ! is_prep_only "$candidate"; then
      echo "$candidate"
    fi
  done < <(find "$dir" -maxdepth 1 -type f -name "$prefix-[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-submission.md" | sort)
}

submission_id_from_file() {
  basename "$1" "-submission.md"
}

requires_c1_closure_evidence() {
  local g0_status="$1"
  local ua_status="$2"

  [[ "$g0_status" == "PASS" || "$ua_status" == "COMPLETE" ]]
}

requires_d4_closure_evidence() {
  local g0_status="$1"
  local ua_status="$2"

  [[ "$g0_status" == "PASS" || "$ua_status" == "COMPLETE" ]]
}

validate_status_pair() {
  local gate_id="$1"
  local gate_value="$2"
  local action_id="$3"
  local action_value="$4"

  case "$gate_value" in
    PASS|PENDING|FAIL) ;;
    *) add_error "$gate_id has unknown status '$gate_value' in $CHECKLIST_PATH." ;;
  esac

  case "$action_value" in
    COMPLETE|IN_PROGRESS|PENDING) ;;
    *) add_error "$action_id has unknown status '$action_value' in $TRACKER_PATH." ;;
  esac

  if [[ "$gate_value" == "PASS" && "$action_value" != "COMPLETE" ]]; then
    add_error "$gate_id is pass but $action_id is not complete."
  fi

  if [[ "$action_value" == "COMPLETE" && "$gate_value" != "PASS" ]]; then
    add_error "$action_id is complete but $gate_id is not pass."
  fi
}

validate_c1_matrix() {
  local matrix_path="$1"
  local inventory_path="$2"
  local expected_header="| Clause ID | Source artifact | Source section / page | Requirement under review | Outcome | Notes / rationale | Required mitigation or fallback |"
  local header_line
  local clause_id
  local row
  local row_count
  local source_artifact
  local source_section
  local outcome
  local notes_rationale
  local mitigation

  if [[ ! -f "$matrix_path" ]]; then
    add_error "C1 clause matrix not found at: $matrix_path"
    return
  fi

  if is_prep_only "$matrix_path"; then
    add_error "C1 clause matrix is still marked evidence_status: prep_only: $matrix_path"
  fi

  header_line="$(grep -E '^\|[[:space:]]*Clause ID[[:space:]]*\|' "$matrix_path" | head -n 1 || true)"
  if [[ "$(normalize_markdown_row "$header_line")" != "$expected_header" ]]; then
    add_error "$matrix_path must use the canonical C1 clause matrix header."
  fi

  for clause_id in C1-1 C1-2 C1-3 C1-4; do
    row_count="$(grep -Ec "^\|[[:space:]]*$clause_id[[:space:]]*\|" "$matrix_path" || true)"
    row="$(grep -E "^\|[[:space:]]*$clause_id[[:space:]]*\|" "$matrix_path" | head -n 1 || true)"

    if [[ "$row_count" -eq 0 ]]; then
      add_error "C1 clause matrix is missing row $clause_id."
      continue
    fi

    if [[ "$row_count" -gt 1 ]]; then
      add_error "$matrix_path must include exactly one row for $clause_id; found $row_count."
      continue
    fi

    source_artifact="$(awk -F'|' '{print $3}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    source_section="$(awk -F'|' '{print $4}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    outcome="$(normalize_status "$(awk -F'|' '{print $6}' <<<"$row")")"
    notes_rationale="$(awk -F'|' '{print $7}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    mitigation="$(awk -F'|' '{print $8}' <<<"$row" | sed 's/^ *//;s/ *$//')"

    if is_blank_or_pending "$source_artifact"; then
      add_error "$matrix_path row $clause_id must reference a source artifact."
    elif [[ "$C1_INVENTORY_HAS_MATRIX_REFERENCE" -eq 1 ]] &&
      ! grep -Fqx -- "$source_artifact" <<<"$C1_INVENTORY_MATRIX_REFERENCES"; then
      add_error "$matrix_path row $clause_id source artifact '$source_artifact' must appear as an Artifact ID or Filename / location in $inventory_path with Used in clause matrix = yes."
    fi

    if is_blank_or_pending "$source_section"; then
      add_error "$matrix_path row $clause_id must reference a source section or page."
    fi

    case "$outcome" in
      PASS|FAIL|NEEDSCLARIFICATION|ACCEPTABLE|ACCEPTABLE_WITH_CONDITIONS|NOT_ACCEPTABLE) ;;
      *) add_error "$matrix_path row $clause_id has placeholder or unknown outcome '$outcome'." ;;
    esac

    case "$outcome" in
      FAIL|NEEDSCLARIFICATION|ACCEPTABLE_WITH_CONDITIONS|NOT_ACCEPTABLE)
        if is_blank_or_pending "$notes_rationale"; then
          add_error "$matrix_path row $clause_id must include notes / rationale for non-pass outcomes."
        fi

        if is_blank_or_pending "$mitigation"; then
          add_error "$matrix_path row $clause_id must include required mitigation or fallback for non-pass outcomes."
        fi
        ;;
    esac
  done
}

validate_c1_artifact_inventory() {
  local inventory_path="$1"
  local expected_header="| Artifact ID | Filename / location | Artifact type | Source / owner | Date received | Used in clause matrix | Notes |"
  local header_line
  local row
  local artifact_id
  local filename_location
  local artifact_type
  local source_owner
  local date_received
  local used_in_clause_matrix
  local row_count=0
  local matrix_reference_count=0

  C1_INVENTORY_MATRIX_REFERENCES=$'\n'
  C1_INVENTORY_HAS_MATRIX_REFERENCE=0

  if [[ ! -f "$inventory_path" ]]; then
    add_error "C1 artifact inventory not found at: $inventory_path"
    return
  fi

  if is_prep_only "$inventory_path"; then
    add_error "C1 artifact inventory is still marked evidence_status: prep_only: $inventory_path"
  fi

  header_line="$(grep -E '^\|[[:space:]]*Artifact ID[[:space:]]*\|' "$inventory_path" | head -n 1 || true)"
  if [[ "$(normalize_markdown_row "$header_line")" != "$expected_header" ]]; then
    add_error "$inventory_path must use the canonical C1 artifact inventory header."
  fi

  while IFS= read -r row; do
    artifact_id="$(awk -F'|' '{print $2}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    filename_location="$(awk -F'|' '{print $3}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    artifact_type="$(awk -F'|' '{print $4}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    source_owner="$(awk -F'|' '{print $5}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    date_received="$(awk -F'|' '{print $6}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    used_in_clause_matrix="$(normalize_status "$(awk -F'|' '{print $7}' <<<"$row")")"

    if [[ "$artifact_id" == "Artifact ID" || "$artifact_id" =~ ^-+$ ]]; then
      continue
    fi

    row_count=$((row_count + 1))

    if is_blank_or_pending "$artifact_id"; then
      add_error "$inventory_path row $row_count must include a non-placeholder Artifact ID."
    fi

    if is_blank_or_pending "$filename_location"; then
      add_error "$inventory_path row $row_count must include a non-placeholder Filename / location."
    fi

    if is_blank_or_pending "$artifact_type"; then
      add_error "$inventory_path row $row_count must include a non-placeholder Artifact type."
    fi

    if is_blank_or_pending "$source_owner"; then
      add_error "$inventory_path row $row_count must include a non-placeholder Source / owner."
    fi

    if is_blank_or_pending "$date_received"; then
      add_error "$inventory_path row $row_count must include a non-placeholder Date received."
    elif [[ ! "$date_received" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
      add_error "$inventory_path row $row_count must include Date received in YYYY-MM-DD format."
    fi

    case "$used_in_clause_matrix" in
      YES|NO) ;;
      *) add_error "$inventory_path row $row_count must mark Used in clause matrix as yes or no." ;;
    esac

    if [[ "$used_in_clause_matrix" == "YES" ]]; then
      matrix_reference_count=$((matrix_reference_count + 1))
      C1_INVENTORY_MATRIX_REFERENCES+="$artifact_id"$'\n'
      C1_INVENTORY_MATRIX_REFERENCES+="$filename_location"$'\n'
    fi
  done < <(grep -E '^\|' "$inventory_path" || true)

  if [[ "$row_count" -eq 0 ]]; then
    add_error "$inventory_path must include at least one artifact row."
  fi

  if [[ "$matrix_reference_count" -eq 0 ]]; then
    add_error "$inventory_path must include at least one artifact marked Used in clause matrix = yes."
  else
    C1_INVENTORY_HAS_MATRIX_REFERENCE=1
  fi
}

validate_c1_closure_evidence() {
  local submission
  local latest_submission=""
  local submission_id
  local matrix_path
  local inventory_path
  local recommendation

  while IFS= read -r submission; do
    latest_submission="$submission"
  done < <(latest_non_prep_submission "$C1_EVIDENCE_DIR" "C1")

  if [[ -z "$latest_submission" ]]; then
    add_error "C1 is marked for closure but no non-prep C1 submission exists in $C1_EVIDENCE_DIR."
    return
  fi

  submission_id="$(submission_id_from_file "$latest_submission")"
  require_submission_id_matches_file "$latest_submission" "$submission_id"
  require_filled_line "$latest_submission" "Submitted by"
  require_filled_line "$latest_submission" "Reviewer"
  require_date_line "$latest_submission" "Date"
  require_filled_line "$latest_submission" "Partner"
  require_filled_line "$latest_submission" "Partner artifact bundle location"
  require_filled_line "$latest_submission" "Decision owner"
  require_date_line "$latest_submission" "Sign-off date"

  recommendation="$(line_value "$latest_submission" "Final legal recommendation" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  case "$recommendation" in
    acceptable|acceptable_with_conditions|not_acceptable) ;;
    *) add_error "$latest_submission must include a final legal recommendation of acceptable, acceptable_with_conditions, or not_acceptable." ;;
  esac

  matrix_path="$C1_EVIDENCE_DIR/$submission_id-clause-matrix.md"
  inventory_path="$C1_EVIDENCE_DIR/$submission_id-artifact-inventory.md"
  validate_c1_artifact_inventory "$inventory_path"
  validate_c1_matrix "$matrix_path" "$inventory_path"

  if grep -E '^- Result:[[:space:]]*`?pending`?[[:space:]]*$' "$C1_CONTROL_PATH" >/dev/null; then
    add_error "C1 closure evidence exists, but $C1_CONTROL_PATH still has Result: pending."
  fi
}

validate_d4_partner_list() {
  local partner_list_path="$1"
  local expected_header="| Organization / Partner | Partner type | Primary contact | Contact channel | Priority | Status | Notes |"
  local header_line
  local provider_count=0
  local frontline_count=0
  local invalid_type_rows=0
  local duplicate_rows=0
  local row
  local organization
  local partner_type
  local organization_key
  local seen_organizations=$'\n'

  D4_PROVIDER_TARGET_COUNT=0
  D4_FRONTLINE_ORG_TARGET_COUNT=0

  if [[ ! -f "$partner_list_path" ]]; then
    add_error "D4 partner list not found at: $partner_list_path"
    return
  fi

  if is_prep_only "$partner_list_path"; then
    add_error "D4 partner list is still marked evidence_status: prep_only: $partner_list_path"
  fi

  header_line="$(grep -E '^\|[[:space:]]*Organization / Partner[[:space:]]*\|' "$partner_list_path" | head -n 1 || true)"
  if [[ "$(normalize_markdown_row "$header_line")" != "$expected_header" ]]; then
    add_error "$partner_list_path must use the canonical D4 partner-list header."
  fi

  while IFS= read -r row || [[ -n "$row" ]]; do
    [[ "$row" =~ ^\| ]] || continue
    [[ "$row" == *"---"* ]] && continue
    [[ "$row" == *"Organization / Partner"* ]] && continue

    organization="$(awk -F'|' '{print $2}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    partner_type="$(awk -F'|' '{print $3}' <<<"$row" | tr '[:upper:]' '[:lower:]' | sed 's/^ *//;s/ *$//')"

    if is_blank_or_pending "$organization"; then
      continue
    fi

    organization_key="$(echo "$organization" | tr '[:upper:]' '[:lower:]')"
    if [[ "$seen_organizations" == *$'\n'"$organization_key"$'\n'* ]]; then
      duplicate_rows=$((duplicate_rows + 1))
    else
      seen_organizations+="$organization_key"$'\n'
    fi

    if [[ "$partner_type" == "provider" ]]; then
      provider_count=$((provider_count + 1))
    elif [[ "$partner_type" == "frontline organization" ]]; then
      frontline_count=$((frontline_count + 1))
    else
      invalid_type_rows=$((invalid_type_rows + 1))
    fi
  done < "$partner_list_path"

  if (( invalid_type_rows > 0 )); then
    add_error "$partner_list_path has $invalid_type_rows row(s) with a partner type other than provider or frontline organization."
  fi

  if (( duplicate_rows > 0 )); then
    add_error "$partner_list_path has $duplicate_rows duplicate organization / partner row(s)."
  fi

  if (( provider_count < 5 || provider_count > 10 )); then
    add_error "$partner_list_path must identify 5-10 provider targets; found $provider_count."
  fi

  if (( frontline_count < 2 || frontline_count > 3 )); then
    add_error "$partner_list_path must identify 2-3 frontline organization targets; found $frontline_count."
  fi

  D4_PROVIDER_TARGET_COUNT="$provider_count"
  D4_FRONTLINE_ORG_TARGET_COUNT="$frontline_count"
}

validate_d4_artifact_inventory() {
  local inventory_path="$1"
  local expected_header="| Artifact ID | Filename / location | Artifact type | Source / owner | Date captured | Supports outreach-log row | Notes |"
  local header_line
  local row
  local artifact_id
  local filename_location
  local artifact_type
  local source_owner
  local date_captured
  local supports_outreach_log
  local row_count=0
  local outreach_reference_count=0

  D4_ARTIFACT_REFERENCES=$'\n'
  D4_HAS_OUTREACH_ARTIFACT_REFERENCE=0

  if [[ ! -f "$inventory_path" ]]; then
    add_error "D4 artifact inventory not found at: $inventory_path"
    return
  fi

  if is_prep_only "$inventory_path"; then
    add_error "D4 artifact inventory is still marked evidence_status: prep_only: $inventory_path"
  fi

  header_line="$(grep -E '^\|[[:space:]]*Artifact ID[[:space:]]*\|' "$inventory_path" | head -n 1 || true)"
  if [[ "$(normalize_markdown_row "$header_line")" != "$expected_header" ]]; then
    add_error "$inventory_path must use the canonical D4 artifact inventory header."
  fi

  while IFS= read -r row; do
    artifact_id="$(awk -F'|' '{print $2}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    filename_location="$(awk -F'|' '{print $3}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    artifact_type="$(awk -F'|' '{print $4}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    source_owner="$(awk -F'|' '{print $5}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    date_captured="$(awk -F'|' '{print $6}' <<<"$row" | sed 's/^ *//;s/ *$//')"
    supports_outreach_log="$(normalize_status "$(awk -F'|' '{print $7}' <<<"$row")")"

    if [[ "$artifact_id" == "Artifact ID" || "$artifact_id" =~ ^-+$ ]]; then
      continue
    fi

    row_count=$((row_count + 1))

    if is_blank_or_pending "$artifact_id"; then
      add_error "$inventory_path row $row_count must include a non-placeholder Artifact ID."
    fi

    if is_blank_or_pending "$filename_location"; then
      add_error "$inventory_path row $row_count must include a non-placeholder Filename / location."
    fi

    if is_blank_or_pending "$artifact_type"; then
      add_error "$inventory_path row $row_count must include a non-placeholder Artifact type."
    fi

    if is_blank_or_pending "$source_owner"; then
      add_error "$inventory_path row $row_count must include a non-placeholder Source / owner."
    fi

    if is_blank_or_pending "$date_captured"; then
      add_error "$inventory_path row $row_count must include a non-placeholder Date captured."
    elif [[ ! "$date_captured" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
      add_error "$inventory_path row $row_count must include Date captured in YYYY-MM-DD format."
    fi

    case "$supports_outreach_log" in
      YES|NO) ;;
      *) add_error "$inventory_path row $row_count must mark Supports outreach-log row as yes or no." ;;
    esac

    if [[ "$supports_outreach_log" == "YES" ]]; then
      outreach_reference_count=$((outreach_reference_count + 1))
      D4_ARTIFACT_REFERENCES+="$artifact_id"$'\n'
      D4_ARTIFACT_REFERENCES+="$filename_location"$'\n'
    fi
  done < <(grep -E '^\|' "$inventory_path" || true)

  if [[ "$row_count" -eq 0 ]]; then
    add_error "$inventory_path must include at least one artifact row."
  fi

  if [[ "$outreach_reference_count" -eq 0 ]]; then
    add_error "$inventory_path must include at least one artifact marked Supports outreach-log row = yes."
  else
    D4_HAS_OUTREACH_ARTIFACT_REFERENCE=1
  fi
}

validate_d4_outreach_log() {
  local outreach_log_path="$1"
  local inventory_path="$2"
  local expected_header="date,organization_or_partner,contact_name,contact_role,channel,owner,attempt_number,outcome,next_step,source_artifact"
  local header_seen=0
  local data_rows=0
  local invalid_rows=0
  local invalid_date_rows=0
  local invalid_attempt_rows=0
  local missing_artifact_rows=0
  local raw_row
  local row

  D4_OUTREACH_EXECUTION_ROW_COUNT=0

  if [[ ! -f "$outreach_log_path" ]]; then
    add_error "D4 outreach log not found at: $outreach_log_path"
    return
  fi

  while IFS= read -r raw_row || [[ -n "$raw_row" ]]; do
    row="${raw_row%$'\r'}"
    if [[ -z "$(trim_value "$row")" ]]; then
      continue
    fi

    if [[ "$header_seen" -eq 0 ]]; then
      header_seen=1
      if [[ "$row" != "$expected_header" ]]; then
        add_error "$outreach_log_path must use the canonical D4 outreach CSV header."
      fi
      continue
    fi

    IFS=, read -r date organization contact_name contact_role channel owner attempt_number outcome next_step source_artifact <<<"$row"

    [[ -n "$date$organization$owner$outcome" ]] || continue
    data_rows=$((data_rows + 1))

    if is_blank_or_pending "$date" || is_blank_or_pending "$organization" || is_blank_or_pending "$owner" || is_blank_or_pending "$outcome"; then
      invalid_rows=$((invalid_rows + 1))
    fi

    if [[ ! "$date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
      invalid_date_rows=$((invalid_date_rows + 1))
    fi

    if [[ ! "$attempt_number" =~ ^[1-9][0-9]*$ ]]; then
      invalid_attempt_rows=$((invalid_attempt_rows + 1))
    fi

    if is_blank_or_pending "$source_artifact"; then
      missing_artifact_rows=$((missing_artifact_rows + 1))
    elif [[ "$D4_HAS_OUTREACH_ARTIFACT_REFERENCE" -eq 1 ]] &&
      ! grep -Fqx -- "$source_artifact" <<<"$D4_ARTIFACT_REFERENCES"; then
      add_error "$outreach_log_path source_artifact '$source_artifact' must appear as an Artifact ID or Filename / location in $inventory_path with Supports outreach-log row = yes."
    fi
  done < "$outreach_log_path"

  if [[ "$header_seen" -eq 0 ]]; then
    add_error "$outreach_log_path must include the canonical D4 outreach CSV header."
  fi

  if (( data_rows == 0 )); then
    add_error "$outreach_log_path must include at least one dated outreach execution row."
  fi

  if (( invalid_rows > 0 )); then
    add_error "$outreach_log_path has $invalid_rows row(s) missing date, organization, owner, or outcome."
  fi

  if (( invalid_date_rows > 0 )); then
    add_error "$outreach_log_path has $invalid_date_rows row(s) with a non-YYYY-MM-DD date."
  fi

  if (( invalid_attempt_rows > 0 )); then
    add_error "$outreach_log_path has $invalid_attempt_rows row(s) with a missing or non-positive attempt_number."
  fi

  if (( missing_artifact_rows > 0 )); then
    add_error "$outreach_log_path has $missing_artifact_rows row(s) missing source_artifact traceability."
  fi

  D4_OUTREACH_EXECUTION_ROW_COUNT="$data_rows"
}

validate_d4_closure_evidence() {
  local submission
  local latest_submission=""
  local submission_id
  local partner_list_path
  local outreach_log_path
  local inventory_path
  local readiness
  local submitted_attempt_count
  local submitted_partner_count
  local submitted_org_count

  while IFS= read -r submission; do
    latest_submission="$submission"
  done < <(latest_non_prep_submission "$D4_EVIDENCE_DIR" "D4")

  if [[ -z "$latest_submission" ]]; then
    add_error "D4 is marked for closure but no non-prep D4 submission exists in $D4_EVIDENCE_DIR."
    return
  fi

  submission_id="$(submission_id_from_file "$latest_submission")"
  require_submission_id_matches_file "$latest_submission" "$submission_id"
  require_filled_line "$latest_submission" "Submitted by"
  require_date_line "$latest_submission" "Date"
  require_filled_line "$latest_submission" "Outreach owner"
  require_positive_integer_line "$latest_submission" "Number of dated contact attempts recorded"
  require_positive_integer_line "$latest_submission" "Number of partners targeted"
  require_positive_integer_line "$latest_submission" "Number of organizations targeted"

  submitted_attempt_count="$(line_value "$latest_submission" "Number of dated contact attempts recorded")"
  submitted_partner_count="$(line_value "$latest_submission" "Number of partners targeted")"
  submitted_org_count="$(line_value "$latest_submission" "Number of organizations targeted")"

  readiness="$(line_value "$latest_submission" "Is D4 auditable from the attached artifacts" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  if [[ "$readiness" != "yes" ]]; then
    add_error "$latest_submission must mark D4 as auditable from attached artifacts."
  fi

  partner_list_path="$D4_EVIDENCE_DIR/$submission_id-partner-list.md"
  outreach_log_path="$D4_EVIDENCE_DIR/$submission_id-outreach-log.csv"
  inventory_path="$D4_EVIDENCE_DIR/$submission_id-artifact-inventory.md"

  validate_d4_partner_list "$partner_list_path"
  validate_d4_artifact_inventory "$inventory_path"
  validate_d4_outreach_log "$outreach_log_path" "$inventory_path"

  if [[ "$submitted_attempt_count" =~ ^[1-9][0-9]*$ && "$submitted_attempt_count" -ne "$D4_OUTREACH_EXECUTION_ROW_COUNT" ]]; then
    add_error "$latest_submission Number of dated contact attempts recorded ($submitted_attempt_count) must match outreach log execution rows ($D4_OUTREACH_EXECUTION_ROW_COUNT)."
  fi

  if [[ "$submitted_partner_count" =~ ^[1-9][0-9]*$ && "$submitted_partner_count" -ne "$D4_PROVIDER_TARGET_COUNT" ]]; then
    add_error "$latest_submission Number of partners targeted ($submitted_partner_count) must match provider rows in the partner list ($D4_PROVIDER_TARGET_COUNT)."
  fi

  if [[ "$submitted_org_count" =~ ^[1-9][0-9]*$ && "$submitted_org_count" -ne "$D4_FRONTLINE_ORG_TARGET_COUNT" ]]; then
    add_error "$latest_submission Number of organizations targeted ($submitted_org_count) must match frontline organization rows in the partner list ($D4_FRONTLINE_ORG_TARGET_COUNT)."
  fi
}

require_file "$CHECKLIST_PATH" "Gate 0 checklist"
require_file "$TRACKER_PATH" "Gate 0 user action tracker"
require_file "$C1_CONTROL_PATH" "C1 control document"

if [[ ${#errors[@]} -eq 0 ]]; then
  c1_gate_status="$(gate_status "G0-3")"
  c1_action_status="$(action_status "UA-1")"
  d4_gate_status="$(gate_status "G0-8")"
  d4_action_status="$(action_status "UA-3")"

  validate_status_pair "G0-3" "$c1_gate_status" "UA-1" "$c1_action_status"
  validate_status_pair "G0-8" "$d4_gate_status" "UA-3" "$d4_action_status"

  if requires_c1_closure_evidence "$c1_gate_status" "$c1_action_status"; then
    validate_c1_closure_evidence
  fi

  if requires_d4_closure_evidence "$d4_gate_status" "$d4_action_status"; then
    validate_d4_closure_evidence
  fi
fi

if [[ ${#errors[@]} -gt 0 ]]; then
  echo "BLOCKED: v22.0 Gate 0 evidence intake is inconsistent."
  for error in "${errors[@]}"; do
    echo "- $error"
  done
  exit 1
fi

echo "OK: v22.0 Gate 0 C1/D4 evidence intake is internally consistent."
