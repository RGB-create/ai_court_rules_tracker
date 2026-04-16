#!/usr/bin/env python3
"""Validate data/rules.json against the project schema.

Exits non-zero on any validation error. Used in CI to prevent the agent
from committing malformed data.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
RULES_PATH = REPO / "data" / "rules.json"

REQUIRED_FIELDS = [
    "id", "jurisdiction", "court", "court_short", "court_level",
    "state", "judge", "rule_type", "category", "category_confidence",
    "title", "effective_date", "source_url", "summary",
]
ALLOWED_JURISDICTIONS = {"federal", "state"}
ALLOWED_CONFIDENCE = {"high", "medium", "low", "uncategorized"}


def main() -> int:
    data = json.loads(RULES_PATH.read_text())
    cats = data.get("categories", {})
    rules = data.get("rules", [])
    errors: list[str] = []

    if not cats:
        errors.append("categories block is empty")

    seen_ids: set[str] = set()
    for i, r in enumerate(rules):
        loc = f"rules[{i}] (id={r.get('id', '?')})"
        for f in REQUIRED_FIELDS:
            if f not in r:
                errors.append(f"{loc}: missing required field '{f}'")
        if r.get("id") in seen_ids:
            errors.append(f"{loc}: duplicate id")
        seen_ids.add(r.get("id"))
        if r.get("jurisdiction") not in ALLOWED_JURISDICTIONS:
            errors.append(f"{loc}: jurisdiction must be one of {ALLOWED_JURISDICTIONS}")
        if r.get("category") and r.get("category") not in cats:
            errors.append(f"{loc}: category '{r['category']}' not defined in categories block")
        if r.get("category_confidence") and r["category_confidence"] not in ALLOWED_CONFIDENCE:
            errors.append(f"{loc}: category_confidence must be one of {ALLOWED_CONFIDENCE}")

    if errors:
        print("VALIDATION FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1
    print(f"OK: {len(rules)} rules validated against schema.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
