#!/usr/bin/env python3
"""
v17.5 AI output ingestion: evidence URL spot-check.

This is a lightweight availability check (not full semantic verification):
- Fetches URLs referenced in research_sources (where available)
- Records HTTP status / final URL / page title (best-effort)

Writes:
  docs/audits/v17-5/ai-results/reports/evidence-spotcheck-2026-01-22.md
"""

from __future__ import annotations

import html
import json
import re
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


ROOT = Path(__file__).resolve().parents[1]

REPORTS_DIR = ROOT / "docs" / "audits" / "v17-5" / "ai-results" / "reports"
OUT_PATH = REPORTS_DIR / "evidence-spotcheck-2026-01-22.md"

PROMPT3_SOURCES = REPORTS_DIR / "research_sources_chatgpt_prompt3.json"


URL_RE = re.compile(r"^https?://", re.IGNORECASE)
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _extract_urls_from_prompt3() -> List[Tuple[str, str]]:
    """
    Returns list of (id, url).
    """
    if not PROMPT3_SOURCES.exists():
        return []
    report = _read_json(PROMPT3_SOURCES)
    raw = report.get("research_sources")
    out: List[Tuple[str, str]] = []
    if not isinstance(raw, list):
        return out
    for item in raw:
        if not isinstance(item, dict):
            continue
        sid = item.get("id")
        sources = item.get("sources")
        if not isinstance(sid, str) or not isinstance(sources, list):
            continue
        for u in sources:
            if isinstance(u, str) and URL_RE.match(u.strip()):
                out.append((sid, u.strip()))
    return out


def _fetch(url: str, timeout_s: int = 20) -> Dict[str, Any]:
    """
    Fetches a URL (GET) and returns status, final_url, title (best-effort).
    """
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "kingston-care-connect/1.0 (v17.5 evidence spotcheck)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            status = getattr(resp, "status", None)
            final_url = resp.geturl()
            body = resp.read(200_000)  # cap to avoid huge downloads
            text = body.decode("utf-8", errors="replace")
            m = TITLE_RE.search(text)
            title = html.unescape(m.group(1).strip()) if m else None
            if title:
                title = re.sub(r"\s+", " ", title)
            return {"ok": True, "status": status, "final_url": final_url, "title": title}
    except urllib.error.HTTPError as e:
        return {"ok": False, "status": e.code, "final_url": getattr(e, "url", url), "title": None, "error": "HTTPError"}
    except Exception as e:
        return {"ok": False, "status": None, "final_url": url, "title": None, "error": type(e).__name__}


def main() -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    urls = _extract_urls_from_prompt3()
    # De-dup while keeping first occurrence.
    seen: set[str] = set()
    dedup: List[Tuple[str, str]] = []
    for sid, u in urls:
        if u in seen:
            continue
        seen.add(u)
        dedup.append((sid, u))

    # Limit to a pragmatic spot-check set (Phase 6). Expand later if needed.
    spotcheck = dedup[:15]

    rows: List[Dict[str, Any]] = []
    for sid, u in spotcheck:
        result = _fetch(u)
        rows.append({"id": sid, "url": u, **result})

    lines: List[str] = []
    lines.append("# v17.5 AI Output Ingestion — Evidence Spot-Check (2026-01-22)")
    lines.append("")
    lines.append(f"- Generated: `{_utc_now_iso()}`")
    lines.append(f"- Source: `{PROMPT3_SOURCES.relative_to(ROOT)}` (prompt3 only; other prompts have non-uniform evidence)")
    lines.append(f"- Spot-check size: **{len(rows)}** URLs")
    lines.append("")

    lines.append("## Results")
    lines.append("")
    lines.append("| # | service id | url | status | final url | title | ok |")
    lines.append("| -: | --- | --- | ---: | --- | --- | --- |")
    for i, r in enumerate(rows, start=1):
        title = (r.get("title") or "").replace("|", "\\|")
        lines.append(
            f"| {i} | `{r.get('id')}` | {r.get('url')} | {r.get('status') or ''} | {r.get('final_url') or ''} | {title} | {'✅' if r.get('ok') else '⚠️'} |"
        )
    lines.append("")

    lines.append("## Notes")
    lines.append("")
    lines.append("- This is an **availability + basic plausibility** check. It does not guarantee that the page supports specific hour values.")
    lines.append("- Any `404` or repeated redirects should be handled in Phase 6 governance QA by updating the service URL or selecting a more stable official source.")
    lines.append("")

    OUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"✅ Wrote evidence spot-check report: {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
