#!/usr/bin/env python3
"""
v17.5 roadmap helper: validate normalized AI outputs and generate a merge readiness report.

Reads:
- Normalized outputs: docs/roadmaps/v17-5-ai-results/normalized/batch{1..4}_output.json
- Batch inputs: docs/roadmaps/2026-01-21-v17-5-batch{1..4}.json
- services.json: data/services.json
- research_sources reports: docs/roadmaps/v17-5-ai-results/reports/research_sources_chatgpt_prompt{1..4}.json

Writes:
- docs/roadmaps/v17-5-ai-results/reports/merge-readiness.md
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple


ROOT = Path(__file__).resolve().parents[1]

REPORT_PATH = ROOT / "docs" / "roadmaps" / "v17-5-ai-results" / "reports" / "merge-readiness.md"

SERVICES_PATH = ROOT / "data" / "services.json"

ALLOWED_HOURS_KEYS = {"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "notes"}
ALLOWED_ITEM_KEYS = {"id", "hours", "access_script"}

_TIME_RE = re.compile(r"^([0-1]\d|2[0-3]):[0-5]\d$")
_URL_RE = re.compile(r"^https?://", re.IGNORECASE)


@dataclass(frozen=True)
class BatchFiles:
    batch_num: int
    batch_input: Path
    normalized_output: Path
    research_sources_report: Path
    expected_count: int


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_ids_from_list(path: Path) -> List[str]:
    data = _read_json(path)
    if not isinstance(data, list):
        raise ValueError(f"Expected list JSON: {path}")
    ids: List[str] = []
    for item in data:
        if not isinstance(item, dict) or not isinstance(item.get("id"), str) or not item["id"]:
            raise ValueError(f"Invalid id item in: {path}")
        ids.append(item["id"])
    return ids


def _extract_urls(value: Any) -> List[str]:
    urls: List[str] = []
    if value is None:
        return urls

    if isinstance(value, str):
        if _URL_RE.match(value.strip()):
            urls.append(value.strip())
        return urls

    if isinstance(value, list):
        for v in value:
            urls.extend(_extract_urls(v))
        return urls

    if isinstance(value, dict):
        # Common shapes
        for key in ("url", "source_url", "sources", "links"):
            if key in value:
                urls.extend(_extract_urls(value[key]))
        # Also scan values shallowly
        for v in value.values():
            urls.extend(_extract_urls(v))
        return urls

    return urls


def _validate_normalized_batch(
    files: BatchFiles, service_ids: Set[str]
) -> Tuple[Dict[str, Any], List[str]]:
    """
    Returns (stats, anomalies). Raises on hard failures.
    """
    anomalies: List[str] = []

    batch_ids = _load_ids_from_list(files.batch_input)
    out = _read_json(files.normalized_output)
    if not isinstance(out, list):
        raise ValueError(f"Expected normalized output list: {files.normalized_output}")

    if len(out) != files.expected_count:
        raise ValueError(f"Batch {files.batch_num}: expected {files.expected_count} items, got {len(out)}")

    out_ids: List[str] = []
    hours_nonnull = 0
    access_nonnull = 0

    for item in out:
        if not isinstance(item, dict):
            raise ValueError(f"Batch {files.batch_num}: item is not an object")
        if set(item.keys()) != ALLOWED_ITEM_KEYS:
            raise ValueError(
                f"Batch {files.batch_num}: invalid keys for id={item.get('id')}: {sorted(item.keys())}"
            )

        service_id = item.get("id")
        if not isinstance(service_id, str) or not service_id:
            raise ValueError(f"Batch {files.batch_num}: invalid id value")
        out_ids.append(service_id)

        if service_id not in service_ids:
            anomalies.append(f"Batch {files.batch_num}: id not found in data/services.json: {service_id}")

        hours = item.get("hours")
        if hours is not None:
            if not isinstance(hours, dict):
                raise ValueError(f"Batch {files.batch_num}: hours is not object/null for id={service_id}")
            hours_nonnull += 1

            bad_keys = [k for k in hours.keys() if k not in ALLOWED_HOURS_KEYS]
            if bad_keys:
                raise ValueError(f"Batch {files.batch_num}: invalid hours keys for id={service_id}: {bad_keys}")

            for day in ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"):
                if day not in hours:
                    continue
                day_obj = hours[day]
                if not isinstance(day_obj, dict):
                    raise ValueError(f"Batch {files.batch_num}: day hours not object for id={service_id} day={day}")
                open_t = day_obj.get("open")
                close_t = day_obj.get("close")
                if not isinstance(open_t, str) or not _TIME_RE.match(open_t):
                    raise ValueError(
                        f"Batch {files.batch_num}: invalid open time for id={service_id} day={day}: {open_t!r}"
                    )
                if not isinstance(close_t, str) or not _TIME_RE.match(close_t):
                    raise ValueError(
                        f"Batch {files.batch_num}: invalid close time for id={service_id} day={day}: {close_t!r}"
                    )

        access_script = item.get("access_script")
        if access_script is not None:
            if not isinstance(access_script, str):
                raise ValueError(f"Batch {files.batch_num}: access_script not string/null for id={service_id}")
            if not access_script.strip():
                # normalized should never emit blank strings
                raise ValueError(f"Batch {files.batch_num}: access_script is blank for id={service_id}")
            access_nonnull += 1

    # Hard requirement: exact match to batch input IDs (order + membership)
    if out_ids != batch_ids:
        missing = sorted(set(batch_ids) - set(out_ids))
        extra = sorted(set(out_ids) - set(batch_ids))
        raise ValueError(
            "\n".join(
                [
                    f"Batch {files.batch_num}: normalized IDs do not match batch input IDs.",
                    f"- missing from output: {missing[:10]}{' ...' if len(missing) > 10 else ''}",
                    f"- extra in output: {extra[:10]}{' ...' if len(extra) > 10 else ''}",
                ]
            )
        )

    # Evidence report scan (best-effort, not a hard failure)
    evidence = _read_json(files.research_sources_report)
    urls = _extract_urls(evidence.get("research_sources"))
    actionable_urls = sorted({u for u in urls if _URL_RE.match(u)})

    if not actionable_urls:
        anomalies.append(f"Batch {files.batch_num}: research_sources contains no actionable URLs")

    stats = {
        "batch": files.batch_num,
        "expected_count": files.expected_count,
        "hours_nonnull": hours_nonnull,
        "access_script_nonnull": access_nonnull,
        "actionable_urls_count": len(actionable_urls),
        "sample_urls": actionable_urls[:5],
        "normalized_output": str(files.normalized_output.relative_to(ROOT)),
        "batch_input": str(files.batch_input.relative_to(ROOT)),
        "research_sources_report": str(files.research_sources_report.relative_to(ROOT)),
    }
    return stats, anomalies


def _write_report(stats: Sequence[Dict[str, Any]], anomalies: Sequence[str]) -> None:
    lines: List[str] = []
    lines.append("# v17.5 AI Output Ingestion — Merge Readiness Report")
    lines.append("")
    lines.append(f"- Generated: `{_utc_now_iso()}`")
    lines.append(f"- Scope: normalized ChatGPT outputs only (Batches 1–4)")
    lines.append("")

    lines.append("## Summary")
    total_expected = sum(s["expected_count"] for s in stats)
    total_hours = sum(s["hours_nonnull"] for s in stats)
    total_access = sum(s["access_script_nonnull"] for s in stats)
    total_urls = sum(s["actionable_urls_count"] for s in stats)
    lines.append("")
    lines.append(f"- Total records: **{total_expected}**")
    lines.append(f"- Records with non-null `hours`: **{total_hours}**")
    lines.append(f"- Records with non-null `access_script`: **{total_access}**")
    lines.append(f"- Evidence URLs (actionable, de-duped per batch): **{total_urls}**")
    lines.append("")

    lines.append("## Per-Batch Stats")
    lines.append("")
    lines.append("| Batch | Records | hours non-null | access_script non-null | evidence URLs | Normalized output | Evidence report |")
    lines.append("| ---: | ---: | ---: | ---: | ---: | --- | --- |")
    for s in stats:
        lines.append(
            "| {batch} | {expected_count} | {hours_nonnull} | {access_script_nonnull} | {actionable_urls_count} | `{normalized_output}` | `{research_sources_report}` |".format(
                **s
            )
        )
    lines.append("")

    lines.append("## Preconditions (Phase 3)")
    lines.append("")
    lines.append("- ✅ Normalized outputs parse as JSON arrays")
    lines.append("- ✅ Output IDs match batch inputs (order + membership)")
    lines.append("- ✅ All IDs exist in `data/services.json` (post-normalization)")
    lines.append("- ✅ Hours keys are lowercase and times are `HH:MM` where present")
    lines.append("")

    lines.append("## Anomalies / Follow-ups")
    lines.append("")
    if anomalies:
        for a in anomalies:
            lines.append(f"- ⚠️ {a}")
    else:
        lines.append("- None")
    lines.append("")

    lines.append("## Stop Point")
    lines.append("")
    if anomalies:
        lines.append("- This ingestion is **merge-ready**, but anomalies should be reviewed during Phase 6 governance QA.")
    else:
        lines.append("- This ingestion is **merge-ready** with no detected anomalies.")
    lines.append("")

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    services = _read_json(SERVICES_PATH)
    if not isinstance(services, list):
        raise ValueError("data/services.json is not a list")
    service_ids = {s["id"] for s in services if isinstance(s, dict) and isinstance(s.get("id"), str)}

    batches = [
        BatchFiles(
            batch_num=1,
            batch_input=ROOT
            / "docs"
            / "roadmaps"
            / "v17-5-ai-results"
            / "batches"
            / "2026-01-21-v17-5-batch1.json",
            normalized_output=ROOT / "docs" / "roadmaps" / "v17-5-ai-results" / "normalized" / "batch1_output.json",
            research_sources_report=ROOT
            / "docs"
            / "roadmaps"
            / "v17-5-ai-results"
            / "reports"
            / "research_sources_chatgpt_prompt1.json",
            expected_count=50,
        ),
        BatchFiles(
            batch_num=2,
            batch_input=ROOT
            / "docs"
            / "roadmaps"
            / "v17-5-ai-results"
            / "batches"
            / "2026-01-21-v17-5-batch2.json",
            normalized_output=ROOT / "docs" / "roadmaps" / "v17-5-ai-results" / "normalized" / "batch2_output.json",
            research_sources_report=ROOT
            / "docs"
            / "roadmaps"
            / "v17-5-ai-results"
            / "reports"
            / "research_sources_chatgpt_prompt2.json",
            expected_count=50,
        ),
        BatchFiles(
            batch_num=3,
            batch_input=ROOT
            / "docs"
            / "roadmaps"
            / "v17-5-ai-results"
            / "batches"
            / "2026-01-21-v17-5-batch3.json",
            normalized_output=ROOT / "docs" / "roadmaps" / "v17-5-ai-results" / "normalized" / "batch3_output.json",
            research_sources_report=ROOT
            / "docs"
            / "roadmaps"
            / "v17-5-ai-results"
            / "reports"
            / "research_sources_chatgpt_prompt3.json",
            expected_count=50,
        ),
        BatchFiles(
            batch_num=4,
            batch_input=ROOT
            / "docs"
            / "roadmaps"
            / "v17-5-ai-results"
            / "batches"
            / "2026-01-21-v17-5-batch4.json",
            normalized_output=ROOT / "docs" / "roadmaps" / "v17-5-ai-results" / "normalized" / "batch4_output.json",
            research_sources_report=ROOT
            / "docs"
            / "roadmaps"
            / "v17-5-ai-results"
            / "reports"
            / "research_sources_chatgpt_prompt4.json",
            expected_count=46,
        ),
    ]

    stats: List[Dict[str, Any]] = []
    anomalies: List[str] = []
    for b in batches:
        s, a = _validate_normalized_batch(b, service_ids)
        stats.append(s)
        anomalies.extend(a)

    _write_report(stats, anomalies)
    print(f"✅ Wrote merge readiness report: {REPORT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
