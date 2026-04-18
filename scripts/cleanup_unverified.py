#!/usr/bin/env python3
"""One-time cleanup: remove all entries that fail the new hard validator
rules (no source, superseded/withdrawn, aggregator summaries).

Fixes Kang 2025-07 with user-provided URLs. Removes Kang 2023-09
(superseded by 2025-07). Nulls Martínez-Olguín URLs (wrong court
domain — agent will re-verify with correct C.D. Cal. URLs).

Run once locally; not part of CI.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
RULES_PATH = REPO / "data" / "rules.json"

AGGREGATOR_RED_FLAGS = [
    re.compile(r"\bdescribed as\b", re.I),
    re.compile(r"\bconsidered (one of|among)\b", re.I),
    re.compile(r"\baccording to\b", re.I),
    re.compile(r"\bwidely regarded\b", re.I),
    re.compile(r"\bnotable for\b", re.I),
    re.compile(r"\bone of the (first|most|earliest)\b", re.I),
]


def should_remove(r: dict) -> str | None:
    rid = r.get("id", "?")

    if r.get("superseded_by"):
        return f"superseded_by={r['superseded_by']}"

    if not r.get("source_url") and not r.get("source_pdf"):
        return "both source_url and source_pdf are null"

    summary = r.get("summary", "")
    for pat in AGGREGATOR_RED_FLAGS:
        if pat.search(summary):
            return f"aggregator language in summary: {pat.pattern}"

    return None


def main() -> int:
    data = json.loads(RULES_PATH.read_text())
    rules = data.get("rules", [])

    # --- Fix Kang 2025-07 with user-provided URLs ---
    for r in rules:
        if r["id"] == "us-fed-ndca-kang-2025-07":
            r["source_url"] = "https://cand.uscourts.gov/judges/phk/kang-peter-h"
            r["source_pdf"] = (
                "https://cand.uscourts.gov/sites/default/files/"
                "standing-orders/PHK-Civil-Standing-Order_2025.7.16.pdf"
            )
            r["category_confidence"] = "high"
            r["provenance"] = "user-verified URLs 2026-04-18; quote from standing order PDF"
            print(f"  FIXED: {r['id']} — added user-provided URLs")

    # --- Null Martínez-Olguín URLs (wrong domain: cand != cacd) ---
    for r in rules:
        if r["id"] == "us-fed-cdca-martinez-olguin-2025-10":
            r["source_url"] = None
            r["source_pdf"] = None
            r["provenance"] += "; URLs nulled: pointed to cand.uscourts.gov (N.D. Cal.) but judge is C.D. Cal. (cacd.uscourts.gov)"
            print(f"  FIXED: {r['id']} — nulled wrong-domain URLs")

    # --- Remove entries that fail validation ---
    kept = []
    removed = []
    for r in rules:
        reason = should_remove(r)
        if reason:
            removed.append((r["id"], reason))
            print(f"  REMOVED: {r['id']} — {reason}")
        else:
            kept.append(r)

    data["rules"] = kept
    RULES_PATH.write_text(json.dumps(data, indent=2) + "\n")

    print(f"\nRemoved {len(removed)} entries. Kept {len(kept)} entries.")
    print("Run validate.py to confirm.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
