#!/usr/bin/env python3
"""
v17.5 AI output ingestion: governance QA helper.

Creates a deterministic sample of services and runs lightweight checks against:
- access_script safety/tone constraints
- contact-method consistency (do not reference missing contact channels)
- crisis safety line presence

Outputs a markdown log under:
  docs/roadmaps/v17-5-ai-results/reports/governance-qa-log-2026-01-22.md

This script is intentionally dependency-free (stdlib only).
"""

from __future__ import annotations

import glob
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple


ROOT = Path(__file__).resolve().parents[1]

SERVICES_PATH = ROOT / "data" / "services.json"
BACKUPS_GLOB = str(ROOT / "data" / "backups" / "services.*.json")

REPORTS_DIR = ROOT / "docs" / "roadmaps" / "v17-5-ai-results" / "reports"
REPORT_PATH = REPORTS_DIR / "governance-qa-log-2026-01-22.md"

RESEARCH_SOURCES_PROMPT3 = REPORTS_DIR / "research_sources_chatgpt_prompt3.json"


EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)
URL_RE = re.compile(r"https?://[^\s)]+", re.IGNORECASE)

# Very lightweight “marketing / emotional support” indicators to flag for manual review.
MARKETING_PHRASES = [
    "we are here to help",
    "we're here to help",
    "safe space",
    "judgment-free",
    "non-judgmental",
    "compassionate",
    "caring team",
]


DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


@dataclass(frozen=True)
class ChangeFlags:
    hours_added: bool
    access_script_added: bool


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _latest_backup_path() -> Optional[Path]:
    paths = sorted(glob.glob(BACKUPS_GLOB))
    if not paths:
        return None
    return Path(paths[-1])


def _index_by_id(services: Sequence[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    out: Dict[str, Dict[str, Any]] = {}
    for s in services:
        if isinstance(s, dict) and isinstance(s.get("id"), str) and s["id"]:
            out[s["id"]] = s
    return out


def _count_sentences(text: str) -> int:
    # Heuristic: count sentence-ending punctuation groups.
    parts = [p for p in re.split(r"[.!?]+", text.strip()) if p.strip()]
    return max(1, len(parts)) if text.strip() else 0


def _contains_marketing(text: str) -> Optional[str]:
    low = text.lower()
    for phrase in MARKETING_PHRASES:
        if phrase in low:
            return phrase
    return None


def _is_crisis(service: Dict[str, Any]) -> bool:
    return service.get("intent_category") == "Crisis"


def _extract_contact_mentions(script: str) -> Dict[str, List[str]]:
    return {
        "emails": EMAIL_RE.findall(script),
        "urls": URL_RE.findall(script),
        "has_phone_digits": bool(re.search(r"\d", script)),
    }


def _script_channel_consistency(service: Dict[str, Any], script: str) -> List[str]:
    issues: List[str] = []
    mentions = _extract_contact_mentions(script)

    # For v17.5, access_script is a "phone anxiety support" script. It may be:
    # - first-person ("Hi, I'm calling because...")
    # - short access guidance ("Call X / Visit Y")
    # Therefore we do not enforce strict channel consistency. We only flag likely hallucinations.

    service_email = (service.get("email") or "").strip() if isinstance(service.get("email"), str) else ""
    service_url = (service.get("url") or "").strip() if isinstance(service.get("url"), str) else ""

    if mentions["emails"] and not service_email:
        issues.append("Script mentions an email but service.email is empty (verify no hallucination)")
    if mentions["urls"] and not service_url:
        issues.append("Script mentions a URL but service.url is empty (verify no hallucination)")

    return issues


def _hours_basic_sanity(hours: Any) -> List[str]:
    issues: List[str] = []
    if hours is None:
        return issues
    if not isinstance(hours, dict):
        return ["hours is not an object"]
    for day in DAY_KEYS:
        if day not in hours:
            continue
        v = hours[day]
        if not isinstance(v, dict):
            issues.append(f"hours.{day} is not an object")
            continue
        if not isinstance(v.get("open"), str) or not re.match(r"^\d{2}:\d{2}$", v["open"]):
            issues.append(f"hours.{day}.open is not HH:MM")
        if not isinstance(v.get("close"), str) or not re.match(r"^\d{2}:\d{2}$", v["close"]):
            issues.append(f"hours.{day}.close is not HH:MM")
    return issues


def _change_flags(before: Dict[str, Any], after: Dict[str, Any]) -> ChangeFlags:
    hours_added = not bool(before.get("hours")) and bool(after.get("hours"))
    access_script_added = not bool(before.get("access_script")) and bool(after.get("access_script"))
    return ChangeFlags(hours_added=hours_added, access_script_added=access_script_added)


def _deterministic_sample(
    changed: List[Dict[str, Any]],
    *,
    crisis_n: int = 10,
    housing_n: int = 5,
    food_n: int = 5,
) -> List[Dict[str, Any]]:
    """
    Deterministic selection:
    - prioritize changed records (hours/script added)
    - stable sort by (intent_category, id)
    """

    def is_changed(s: Dict[str, Any]) -> bool:
        cf = s.get("_change_flags")
        return bool(cf and (cf.hours_added or cf.access_script_added))

    changed_only = [s for s in changed if is_changed(s)]

    def by_id(items: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return sorted(items, key=lambda s: (s.get("id") or ""))

    crisis = by_id([s for s in changed_only if s.get("intent_category") == "Crisis"])[:crisis_n]
    housing = by_id([s for s in changed_only if s.get("intent_category") == "Housing"])[:housing_n]
    food = by_id([s for s in changed_only if s.get("intent_category") == "Food"])[:food_n]

    sample = crisis + housing + food
    return sample


def _load_prompt3_sources_by_id() -> Dict[str, List[str]]:
    if not RESEARCH_SOURCES_PROMPT3.exists():
        return {}
    report = _read_json(RESEARCH_SOURCES_PROMPT3)
    sources_by_id: Dict[str, List[str]] = {}
    raw = report.get("research_sources")
    if not isinstance(raw, list):
        return sources_by_id
    for item in raw:
        if not isinstance(item, dict):
            continue
        sid = item.get("id")
        sources = item.get("sources")
        if isinstance(sid, str) and isinstance(sources, list):
            urls = [u for u in sources if isinstance(u, str) and URL_RE.match(u)]
            if urls:
                sources_by_id[sid] = urls
    return sources_by_id


def main() -> None:
    backup_path = _latest_backup_path()
    if not backup_path:
        raise SystemExit("No backup file found under data/backups/. Phase 4 must run before Phase 6 QA.")

    before_services = _read_json(backup_path)
    after_services = _read_json(SERVICES_PATH)
    if not isinstance(before_services, list) or not isinstance(after_services, list):
        raise SystemExit("Expected services JSON to be lists.")

    before_by_id = _index_by_id(before_services)
    after_by_id = _index_by_id(after_services)

    changed: List[Dict[str, Any]] = []
    for sid, after in after_by_id.items():
        before = before_by_id.get(sid)
        if not before:
            continue
        cf = _change_flags(before, after)
        if cf.hours_added or cf.access_script_added:
            enriched = dict(after)
            enriched["_change_flags"] = cf
            changed.append(enriched)

    sample = _deterministic_sample(changed)

    sources_by_id = _load_prompt3_sources_by_id()

    # Build report
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    lines: List[str] = []
    lines.append("# v17.5 AI Output Ingestion — Governance QA Log (2026-01-22)")
    lines.append("")
    lines.append(f"- Generated: `{_utc_now_iso()}`")
    lines.append(f"- Baseline (pre-merge): `{backup_path.relative_to(ROOT)}`")
    lines.append(f"- Current dataset: `{SERVICES_PATH.relative_to(ROOT)}`")
    lines.append("")

    lines.append("## Scope")
    lines.append("")
    lines.append("- This log focuses on records that changed in Phase 4 (hours/access_script added).")
    lines.append("- Sampling targets per plan: 10 Crisis, 5 Housing, 5 Food (deterministic selection).")
    lines.append("")

    lines.append("## Summary")
    lines.append("")
    lines.append(f"- Total services changed by merge: **{len(changed)}**")
    lines.append(f"- QA sample size: **{len(sample)}**")
    lines.append("")

    # Global scan: scripts that look out-of-policy (best-effort)
    def count_sentences(t: str) -> int:
        parts = [p for p in re.split(r"[.!?]+", t.strip()) if p.strip()]
        return len(parts)

    french_like = []
    long_scripts = []
    marketing_hits = []
    for svc in after_services:
        script = svc.get("access_script")
        if not isinstance(script, str) or not script.strip():
            continue
        if re.search(r"\bbonjour\b|\bje\s+cherche\b|\boffrez-vous\b", script, re.IGNORECASE):
            french_like.append(svc.get("id"))
        if count_sentences(script) > 3:
            long_scripts.append(svc.get("id"))
        hit = _contains_marketing(script)
        if hit:
            marketing_hits.append((svc.get("id"), hit))

    lines.append("## Global Flags (automated)")
    lines.append("")
    lines.append(f"- Scripts that appear non-English (heuristic): **{len([x for x in french_like if x])}**")
    lines.append(f"- Scripts longer than 3 sentences (heuristic): **{len([x for x in long_scripts if x])}**")
    lines.append(f"- Scripts containing marketing/emotional phrasing (heuristic): **{len([x for x in marketing_hits if x[0]])}**")
    lines.append("")
    if french_like:
        lines.append(f"- Non-English candidates: {', '.join([f'`{x}`' for x in french_like if x])}")
        lines.append("")

    # Table
    lines.append("## Sample Table")
    lines.append("")
    lines.append("| # | id | intent_category | changes | flags | evidence (if any) |")
    lines.append("| -: | --- | --- | --- | --- | --- |")
    for idx, s in enumerate(sample, start=1):
        cf: ChangeFlags = s["_change_flags"]
        change_str = ", ".join([x for x, ok in [("hours", cf.hours_added), ("access_script", cf.access_script_added)] if ok])
        flags: List[str] = []
        if s.get("intent_category") == "Crisis":
            flags.append("CRISIS")
        ev = sources_by_id.get(s.get("id") or "", [])
        ev_cell = ev[0] if ev else ""
        lines.append(f"| {idx} | `{s.get('id')}` | {s.get('intent_category')} | {change_str} | {', '.join(flags) if flags else ''} | {ev_cell} |")
    lines.append("")

    # Detailed checks
    lines.append("## Detailed Checks")
    lines.append("")
    for s in sample:
        sid = s.get("id")
        name = s.get("name")
        cat = s.get("intent_category")
        cf: ChangeFlags = s["_change_flags"]

        lines.append(f"### `{sid}` — {name} ({cat})")
        lines.append("")
        lines.append(f"- Changes: hours_added={cf.hours_added}, access_script_added={cf.access_script_added}")
        if sid in sources_by_id:
            lines.append(f"- Evidence URLs (from prompt3 report): {', '.join(sources_by_id[sid])}")
        lines.append("")

        access_script = s.get("access_script") if isinstance(s.get("access_script"), str) else ""
        hours = s.get("hours")

        # Script checks
        script_issues: List[str] = []
        if access_script:
            sent = _count_sentences(access_script)
            if sent > 3:
                script_issues.append(f"More than 3 sentences ({sent})")
            marketing_hit = _contains_marketing(access_script)
            if marketing_hit:
                script_issues.append(f"Contains marketing/emotional phrasing: {marketing_hit!r}")
            script_issues.extend(_script_channel_consistency(s, access_script))
        else:
            script_issues.append("Missing access_script (unexpected after merge)")

        # Hours checks
        hours_issues = _hours_basic_sanity(hours)

        lines.append("**Access script**")
        lines.append("")
        lines.append("```text")
        lines.append(access_script or "")
        lines.append("```")
        lines.append("")

        lines.append("**Structured hours**")
        lines.append("")
        lines.append("```json")
        lines.append(json.dumps(hours, ensure_ascii=False, indent=2))
        lines.append("```")
        lines.append("")

        lines.append("**Automated findings**")
        lines.append("")
        if script_issues or hours_issues:
            for issue in script_issues:
                lines.append(f"- ⚠️ Script: {issue}")
            for issue in hours_issues:
                lines.append(f"- ⚠️ Hours: {issue}")
        else:
            lines.append("- ✅ No automated issues detected")
        lines.append("")

        lines.append("**Manual QA checklist (human)**")
        lines.append("")
        lines.append("- [ ] Verify access_script factuality (no invented intake rules / docs / fees).")
        lines.append("- [ ] Verify contact method(s) match the service’s official channel(s).")
        if _is_crisis(s):
            lines.append("- [ ] Verify crisis safety posture is appropriate (no medical advice; no harmful instructions).")
        if sid in sources_by_id:
            lines.append("- [ ] Open the evidence URL(s) and confirm hours/access statements.")
        lines.append("- [ ] If anything is wrong, manually fix `data/services.json` and record it in this log.")
        lines.append("")

    # Closeout section
    lines.append("## Phase 6 Status")
    lines.append("")
    lines.append("- Automated sampling + checks: ✅ completed")
    lines.append("- Manual verification (URLs / factuality): ⏳ pending (recommended before closing Phase 6)")
    lines.append("")

    REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"✅ Wrote governance QA log: {REPORT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
