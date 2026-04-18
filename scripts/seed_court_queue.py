#!/usr/bin/env python3
"""One-time seeding script for the discovery queue.

Adds court_level queue items for every federal court that isn't already
present, so the agent can skip slow Wikipedia init and jump straight
to processing court-wide local-rules sweeps.

Run once locally; not part of CI.
"""
from __future__ import annotations

import json
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
QUEUE_PATH = REPO / "data" / "discovery_queue.json"

CIRCUITS = [
    "1st Cir.", "2d Cir.", "3d Cir.", "4th Cir.", "5th Cir.",
    "6th Cir.", "7th Cir.", "8th Cir.", "9th Cir.", "10th Cir.",
    "11th Cir.", "D.C. Cir.", "Fed. Cir.",
]

DISTRICTS = [
    "N.D. Ala.", "M.D. Ala.", "S.D. Ala.",
    "D. Alaska",
    "D. Ariz.",
    "E.D. Ark.", "W.D. Ark.",
    "C.D. Cal.", "E.D. Cal.", "N.D. Cal.", "S.D. Cal.",
    "D. Colo.",
    "D. Conn.",
    "D. Del.",
    "D.D.C.",
    "M.D. Fla.", "N.D. Fla.", "S.D. Fla.",
    "M.D. Ga.", "N.D. Ga.", "S.D. Ga.",
    "D. Haw.",
    "D. Idaho",
    "C.D. Ill.", "N.D. Ill.", "S.D. Ill.",
    "N.D. Ind.", "S.D. Ind.",
    "N.D. Iowa", "S.D. Iowa",
    "D. Kan.",
    "E.D. Ky.", "W.D. Ky.",
    "E.D. La.", "M.D. La.", "W.D. La.",
    "D. Me.",
    "D. Md.",
    "D. Mass.",
    "E.D. Mich.", "W.D. Mich.",
    "D. Minn.",
    "N.D. Miss.", "S.D. Miss.",
    "E.D. Mo.", "W.D. Mo.",
    "D. Mont.",
    "D. Neb.",
    "D. Nev.",
    "D.N.H.",
    "D.N.J.",
    "D.N.M.",
    "E.D.N.Y.", "N.D.N.Y.", "S.D.N.Y.", "W.D.N.Y.",
    "E.D.N.C.", "M.D.N.C.", "W.D.N.C.",
    "D.N.D.",
    "N.D. Ohio", "S.D. Ohio",
    "E.D. Okla.", "N.D. Okla.", "W.D. Okla.",
    "D. Or.",
    "E.D. Pa.", "M.D. Pa.", "W.D. Pa.",
    "D.R.I.",
    "D.S.C.",
    "D.S.D.",
    "E.D. Tenn.", "M.D. Tenn.", "W.D. Tenn.",
    "E.D. Tex.", "N.D. Tex.", "S.D. Tex.", "W.D. Tex.",
    "D. Utah",
    "D. Vt.",
    "E.D. Va.", "W.D. Va.",
    "E.D. Wash.", "W.D. Wash.",
    "N.D.W. Va.", "S.D.W. Va.",
    "E.D. Wis.", "W.D. Wis.",
    "D. Wyo.",
    "D.P.R.",
    "D. Guam", "D.N. Mar. I.", "D.V.I.",
    "CIT",
]


def main() -> int:
    queue = json.loads(QUEUE_PATH.read_text())
    items = queue.setdefault("items", [])

    existing_court_keys = {
        (i.get("court_short"), i.get("judge"))
        for i in items
    }

    added = 0
    for court in CIRCUITS + DISTRICTS:
        key = (court, None)
        if key in existing_court_keys:
            continue
        items.append({
            "priority": "court_level",
            "court_short": court,
            "judge": None,
            "status": "pending",
            "result": None,
            "last_checked": None,
            "note": "Court-wide local-rules sweep: fetch the court's local rules PDF and search for AI policy."
        })
        added += 1

    QUEUE_PATH.write_text(json.dumps(queue, indent=2) + "\n")
    print(f"Added {added} court_level items. Total queue items: {len(items)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
