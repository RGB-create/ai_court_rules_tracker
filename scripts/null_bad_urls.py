#!/usr/bin/env python3
"""One-time cleanup: null out source_url/source_pdf values that fail
the new URL pattern validation, so the dataset validates cleanly while
the agent re-verifies them over subsequent runs.

For each entry whose source_url matches a known-bad pattern (bare
domain, generic listing page), this script:
  - sets source_url to null
  - sets source_pdf to null (since if the source_url is wrong, the
    associated PDF is suspect too)
  - sets last_verified to null
  - sets category_confidence to 'low'
  - appends a provenance note flagging the entry for re-verification

Run once locally; not part of CI.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "scripts"))
from validate import is_bare_domain, is_generic_listing  # noqa: E402

RULES_PATH = REPO / "data" / "rules.json"


def main() -> int:
    data = json.loads(RULES_PATH.read_text())
    rules = data.get("rules", [])

    n_cleaned = 0
    for r in rules:
        url = r.get("source_url")
        if not url:
            continue
        if is_bare_domain(url) or is_generic_listing(url):
            old_url = r.get("source_url")
            r["source_url"] = None
            r["source_pdf"] = None
            r["last_verified"] = None
            r["category_confidence"] = "low"
            note = (
                f"URL '{old_url}' nulled by cleanup; needs re-verification "
                "via zoom-out workflow"
            )
            existing_provenance = r.get("provenance", "")
            r["provenance"] = (
                f"{existing_provenance}; {note}" if existing_provenance else note
            )
            n_cleaned += 1
            print(f"  - Cleaned {r['id']}: nulled '{old_url}'")

    RULES_PATH.write_text(json.dumps(data, indent=2) + "\n")
    print(f"\nCleaned {n_cleaned} entries. Run validate.py to confirm.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
