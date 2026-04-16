#!/usr/bin/env python3
"""Append today's category counts to data/history.json.

If a snapshot for today already exists, replace it. This is invoked by the
weekly agent run after rules.json is updated, so the trend chart on the
dashboard reflects the new state.
"""
from __future__ import annotations

import json
from collections import Counter
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
RULES_PATH = REPO / "data" / "rules.json"
HISTORY_PATH = REPO / "data" / "history.json"


def main() -> None:
    data = json.loads(RULES_PATH.read_text())
    rules = data.get("rules", [])
    cats = list(data.get("categories", {}).keys())

    by_cat = Counter(r.get("category", "no_explicit_rule") for r in rules)
    by_jur = Counter(r.get("jurisdiction") for r in rules)

    snapshot = {
        "date": date.today().isoformat(),
        "total_rules": len(rules),
        "by_jurisdiction": {
            "federal": by_jur.get("federal", 0),
            "state": by_jur.get("state", 0),
        },
        "by_category": {c: by_cat.get(c, 0) for c in cats},
        "note": None,
    }

    if HISTORY_PATH.exists():
        history = json.loads(HISTORY_PATH.read_text())
    else:
        history = {"schema_version": "1.0.0", "snapshots": []}

    snaps = history.get("snapshots", [])
    snaps = [s for s in snaps if s.get("date") != snapshot["date"]]
    snaps.append(snapshot)
    snaps.sort(key=lambda s: s["date"])
    history["snapshots"] = snaps

    HISTORY_PATH.write_text(json.dumps(history, indent=2) + "\n")
    print(f"Wrote snapshot for {snapshot['date']}: {snapshot['total_rules']} rules.")


if __name__ == "__main__":
    main()
