#!/usr/bin/env python3
"""
v17.5 roadmap helper: normalize Deep Research outputs into merge-ready JSON.

Inputs:
- Raw ChatGPT outputs (Option A JSON objects):
  docs/audits/v17-5/ai-results/raw/ChatGPT - Prompt {1..4} - Deep Research Result.txt
- Batch input files (used to validate ID membership/order):
  docs/audits/v17-5/ai-results/batches/2026-01-21-v17-5-batch{1..4}.json

Outputs:
- Merge-ready arrays:
  docs/audits/v17-5/ai-results/normalized/batch{1..4}_output.json
- Preserved evidence (as-is, for governance QA):
  docs/audits/v17-5/ai-results/reports/research_sources_chatgpt_prompt{1..4}.json

Normalization:
- Lowercase hours day keys (monday..sunday, notes)
- Normalize time strings to leading-zero HH:MM where possible
- Correct known ID drift(s) only when validated against batch inputs
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


ROOT = Path(__file__).resolve().parents[1]

RAW_DIR = ROOT / "docs" / "audits" / "v17-5" / "ai-results" / "raw"
NORMALIZED_DIR = ROOT / "docs" / "audits" / "v17-5" / "ai-results" / "normalized"
REPORTS_DIR = ROOT / "docs" / "audits" / "v17-5" / "ai-results" / "reports"

BATCH_INPUT_PATHS = {
    1: ROOT / "docs" / "audits" / "v17-5" / "ai-results" / "batches" / "2026-01-21-v17-5-batch1.json",
    2: ROOT / "docs" / "audits" / "v17-5" / "ai-results" / "batches" / "2026-01-21-v17-5-batch2.json",
    3: ROOT / "docs" / "audits" / "v17-5" / "ai-results" / "batches" / "2026-01-21-v17-5-batch3.json",
    4: ROOT / "docs" / "audits" / "v17-5" / "ai-results" / "batches" / "2026-01-21-v17-5-batch4.json",
}

CHATGPT_RAW_PATHS = {
    1: RAW_DIR / "ChatGPT - Prompt 1 - Deep Research Result.txt",
    2: RAW_DIR / "ChatGPT - Prompt 2 - Deep Research Result.txt",
    3: RAW_DIR / "ChatGPT - Prompt 3 - Deep Research Result.txt",
    4: RAW_DIR / "ChatGPT - Prompt 4 - Deep Research Result.txt",
}


_TIME_RE = re.compile(r"^(\d{1,2}):([0-5]\d)$")


DAY_KEY_MAP = {
    "monday": "monday",
    "tuesday": "tuesday",
    "wednesday": "wednesday",
    "thursday": "thursday",
    "friday": "friday",
    "saturday": "saturday",
    "sunday": "sunday",
    "notes": "notes",
    # Title Case variants
    "Monday": "monday",
    "Tuesday": "tuesday",
    "Wednesday": "wednesday",
    "Thursday": "thursday",
    "Friday": "friday",
    "Saturday": "saturday",
    "Sunday": "sunday",
    "Notes": "notes",
}


@dataclass(frozen=True)
class BatchPaths:
    batch_num: int
    batch_input: Path
    chatgpt_raw: Path
    batch_output: Path
    research_sources_out: Path


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_time(value: Any) -> Optional[str]:
    if not isinstance(value, str):
        return None
    m = _TIME_RE.match(value.strip())
    if not m:
        return None
    hour = int(m.group(1))
    minute = int(m.group(2))
    if hour < 0 or hour > 23:
        return None
    return f"{hour:02d}:{minute:02d}"


def _normalize_hours(hours: Any) -> Optional[Dict[str, Any]]:
    if hours is None:
        return None
    if not isinstance(hours, dict):
        return None

    out: Dict[str, Any] = {}
    for key, value in hours.items():
        mapped = DAY_KEY_MAP.get(key)
        if not mapped:
            continue

        if mapped == "notes":
            if isinstance(value, str) and value.strip():
                out["notes"] = value.strip()
            continue

        # day object
        if not isinstance(value, dict):
            continue
        open_t = _normalize_time(value.get("open"))
        close_t = _normalize_time(value.get("close"))
        if open_t is None or close_t is None:
            continue
        out[mapped] = {"open": open_t, "close": close_t}

    # If we ended up with an empty object, treat it as null
    return out or None


def _load_batch_ids(path: Path) -> List[str]:
    data = _read_json(path)
    if not isinstance(data, list):
        raise ValueError(f"Expected batch input to be a list: {path}")
    ids: List[str] = []
    for item in data:
        if not isinstance(item, dict) or not isinstance(item.get("id"), str) or not item["id"]:
            raise ValueError(f"Invalid item in batch input: {path}")
        ids.append(item["id"])
    return ids


def _apply_id_fixes(batch_num: int, output_ids: List[str], batch_ids: List[str]) -> Tuple[List[str], List[Tuple[str, str]]]:
    """
    Applies known, validated ID corrections.
    Returns (fixed_ids, applied_fixes[(from,to)]).
    """

    applied: List[Tuple[str, str]] = []
    fixed = list(output_ids)

    # Known drift observed in ChatGPT Prompt 1:
    # - expected: telephone-aid-line-kingston-talk
    # - got:      telephone-aid-line-kingston
    if batch_num == 1:
        wrong = "telephone-aid-line-kingston"
        correct = "telephone-aid-line-kingston-talk"
        if wrong in fixed or correct in fixed:
            # Only apply if the correction makes membership match the batch input.
            if correct in batch_ids and wrong not in batch_ids:
                fixed = [correct if x == wrong else x for x in fixed]
                if wrong in output_ids:
                    applied.append((wrong, correct))

    return fixed, applied


def _normalize_chatgpt_batch(paths: BatchPaths) -> None:
    batch_ids = _load_batch_ids(paths.batch_input)
    raw = _read_json(paths.chatgpt_raw)
    if not isinstance(raw, dict) or "processed_batch_output" not in raw:
        raise ValueError(f"ChatGPT raw output is not Option A JSON: {paths.chatgpt_raw}")

    processed = raw.get("processed_batch_output")
    if not isinstance(processed, list):
        raise ValueError(f"processed_batch_output is not a list: {paths.chatgpt_raw}")

    # Validate baseline shape
    output_ids: List[str] = []
    for item in processed:
        if not isinstance(item, dict):
            raise ValueError(f"Invalid item (not object): {paths.chatgpt_raw}")
        if set(item.keys()) != {"id", "hours", "access_script"}:
            raise ValueError(f"Invalid keys in {paths.chatgpt_raw}: {sorted(item.keys())}")
        if not isinstance(item.get("id"), str) or not item["id"]:
            raise ValueError(f"Invalid id in {paths.chatgpt_raw}")
        output_ids.append(item["id"])

    # Apply known ID fixes (validated)
    fixed_ids, applied_fixes = _apply_id_fixes(paths.batch_num, output_ids, batch_ids)

    # Build normalized output list with normalized hours + corrected IDs
    normalized: List[Dict[str, Any]] = []
    for item, fixed_id in zip(processed, fixed_ids):
        hours_norm = _normalize_hours(item.get("hours"))
        access_script = item.get("access_script")
        access_script_norm: Optional[str]
        if isinstance(access_script, str) and access_script.strip():
            access_script_norm = access_script.strip()
        else:
            access_script_norm = None

        normalized.append(
            {
                "id": fixed_id,
                "hours": hours_norm,
                "access_script": access_script_norm,
            }
        )

    # Enforce exact ID alignment with batch input (order + membership)
    normalized_ids = [x["id"] for x in normalized]
    if normalized_ids != batch_ids:
        missing = sorted(set(batch_ids) - set(normalized_ids))
        extra = sorted(set(normalized_ids) - set(batch_ids))
        raise ValueError(
            "\n".join(
                [
                    f"Batch {paths.batch_num}: output IDs do not match batch input IDs (order + membership).",
                    f"- batch input: {paths.batch_input}",
                    f"- chatgpt raw: {paths.chatgpt_raw}",
                    f"- normalized:  {paths.batch_output}",
                    f"- missing: {missing[:10]}{' ...' if len(missing) > 10 else ''}",
                    f"- extra:   {extra[:10]}{' ...' if len(extra) > 10 else ''}",
                ]
            )
        )

    # Write normalized batch output
    _write_json(paths.batch_output, normalized)

    # Write research_sources report (preserve as-is, but add metadata)
    research_sources = raw.get("research_sources")
    report = {
        "batch": paths.batch_num,
        "provider": "chatgpt",
        "source_file": str(paths.chatgpt_raw.relative_to(ROOT)),
        "extracted_at": _utc_now_iso(),
        "applied_id_fixes": [{"from": f, "to": t} for (f, t) in applied_fixes],
        "research_sources": research_sources,
    }
    _write_json(paths.research_sources_out, report)


def main() -> None:
    NORMALIZED_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    batches: List[BatchPaths] = []
    for batch_num in [1, 2, 3, 4]:
        batches.append(
            BatchPaths(
                batch_num=batch_num,
                batch_input=BATCH_INPUT_PATHS[batch_num],
                chatgpt_raw=CHATGPT_RAW_PATHS[batch_num],
                batch_output=NORMALIZED_DIR / f"batch{batch_num}_output.json",
                research_sources_out=REPORTS_DIR / f"research_sources_chatgpt_prompt{batch_num}.json",
            )
        )

    for paths in batches:
        _normalize_chatgpt_batch(paths)
        print(f"✅ Normalized batch {paths.batch_num} → {paths.batch_output.relative_to(ROOT)}")
        print(f"   Evidence → {paths.research_sources_out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
