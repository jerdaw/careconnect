#!/usr/bin/env python3
"""
v17.5 roadmap helper: regenerate AI batch input files from data/services.json.

Why:
- The AI prompts for v17.5 need contact + process fields (url/address/application_process/etc.) to avoid hallucinations.
- Keeping the batch membership stable makes it easy to retry or compare runs.

This script:
- Reads the existing batch files in docs/roadmaps/v17-5-ai-results/batches to preserve ID order and grouping.
- Rebuilds each record from data/services.json with the fields the AI prompt expects.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional


ROOT = Path(__file__).resolve().parents[1]

BATCH_PATHS = [
    ROOT / "docs" / "roadmaps" / "v17-5-ai-results" / "batches" / "2026-01-21-v17-5-batch1.json",
    ROOT / "docs" / "roadmaps" / "v17-5-ai-results" / "batches" / "2026-01-21-v17-5-batch2.json",
    ROOT / "docs" / "roadmaps" / "v17-5-ai-results" / "batches" / "2026-01-21-v17-5-batch3.json",
    ROOT / "docs" / "roadmaps" / "v17-5-ai-results" / "batches" / "2026-01-21-v17-5-batch4.json",
]

SERVICES_PATH = ROOT / "data" / "services.json"


_BRACKET_CITATION_RE = re.compile(r"\s*\[[0-9,\s]+\]")


def _strip_bracket_citations(text: Optional[str]) -> Optional[str]:
    if text is None:
        return None
    cleaned = _BRACKET_CITATION_RE.sub("", text).strip()
    return cleaned or None


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _service_to_ai_record(service: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": service.get("id"),
        "name": service.get("name"),
        "intent_category": service.get("intent_category"),
        "url": service.get("url") or None,
        "phone": service.get("phone") or None,
        "email": service.get("email") or None,
        "address": service.get("address") or None,
        "hours_text": _strip_bracket_citations(service.get("hours_text")),
        "application_process": _strip_bracket_citations(service.get("application_process")),
        "documents_required": _strip_bracket_citations(service.get("documents_required")),
        "eligibility": _strip_bracket_citations(service.get("eligibility")),
        "fees": _strip_bracket_citations(service.get("fees")),
        "description": _strip_bracket_citations(service.get("description")),
        "existing": {
            "has_hours": bool(service.get("hours")),
            "has_access_script": bool(service.get("access_script")),
        },
    }


def main() -> None:
    services: List[Dict[str, Any]] = _read_json(SERVICES_PATH)
    service_map: Dict[str, Dict[str, Any]] = {s["id"]: s for s in services if "id" in s}

    missing_ids: List[str] = []

    for batch_path in BATCH_PATHS:
        batch: List[Dict[str, Any]] = _read_json(batch_path)
        ids_in_order = [item.get("id") for item in batch]

        rebuilt: List[Dict[str, Any]] = []
        for service_id in ids_in_order:
            if not service_id or service_id not in service_map:
                if service_id:
                    missing_ids.append(service_id)
                continue
            rebuilt.append(_service_to_ai_record(service_map[service_id]))

        _write_json(batch_path, rebuilt)
        print(f"Wrote {batch_path.relative_to(ROOT)} ({len(rebuilt)} services)")

    if missing_ids:
        print("")
        print("Warning: some batch IDs were not found in data/services.json:")
        for service_id in missing_ids:
            print(f"- {service_id}")


if __name__ == "__main__":
    main()
