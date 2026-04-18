#!/usr/bin/env python3
"""URL audit for data/rules.json.

Fetches every source_url and source_pdf and verifies:
- The URL responds with HTTP 200.
- For HTML pages: the response body actually contains AI policy keywords
  (a generic court homepage / all-judges listing is the most common
  failure mode — those load fine but contain no AI text).
- For PDFs: the response Content-Type or magic bytes indicate a real
  PDF document.

Writes results to data/url_audit.json. Exits non-zero if any URL is
flagged 'fail' (i.e., loads but is clearly the wrong page). 'Blocked'
URLs (couldn't fetch — timeout, 403, etc.) are reported as warnings
but do not fail the run, since they may be transient.

Flags:
  --soft         Don't exit non-zero on failures.
  --limit N      Audit at most N entries (debugging).
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib import error, request

REPO = Path(__file__).resolve().parent.parent
RULES_PATH = REPO / "data" / "rules.json"
AUDIT_PATH = REPO / "data" / "url_audit.json"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
TIMEOUT_SECONDS = 20
POLITE_DELAY_SECONDS = 0.5
MAX_BODY_BYTES = 4_000_000

AI_KEYWORDS = [
    "artificial intelligence",
    "generative ai",
    "chatgpt",
    "large language model",
    "generative artificial",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


BROWSER_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "identity",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0",
}


def fetch(url: str) -> tuple[int, str, bytes | None, str]:
    req = request.Request(url, headers=BROWSER_HEADERS)
    try:
        with request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            status = resp.getcode()
            ct = resp.headers.get("Content-Type", "")
            body = resp.read(MAX_BODY_BYTES)
            return status, ct, body, ""
    except error.HTTPError as e:
        return e.code, "", None, f"HTTP {e.code}: {e.reason}"
    except error.URLError as e:
        return 0, "", None, f"URLError: {e.reason}"
    except Exception as e:
        return 0, "", None, f"{type(e).__name__}: {e}"


def html_has_ai(body: bytes) -> bool:
    text = body.decode("utf-8", errors="ignore").lower()
    return any(kw in text for kw in AI_KEYWORDS)


def is_pdf(ct: str, body: bytes) -> bool:
    return "pdf" in ct.lower() or body[:5] == b"%PDF-"


def audit_url(url: str, kind: str) -> dict:
    status, ct, body, err = fetch(url)
    time.sleep(POLITE_DELAY_SECONDS)

    if status != 200 or body is None:
        return {
            "url": url,
            "status": "blocked",
            "verified_at": now_iso(),
            "details": err or f"HTTP {status}",
        }

    if kind == "pdf":
        if is_pdf(ct, body):
            return {
                "url": url,
                "status": "ok",
                "verified_at": now_iso(),
                "details": f"HTTP 200; Content-Type='{ct}'; PDF confirmed",
            }
        return {
            "url": url,
            "status": "fail",
            "verified_at": now_iso(),
            "details": (
                f"HTTP 200 but response is not a PDF (Content-Type='{ct}'). "
                "URL likely points to a landing page, not the PDF itself."
            ),
        }

    if html_has_ai(body):
        return {
            "url": url,
            "status": "ok",
            "verified_at": now_iso(),
            "details": "HTTP 200; AI policy keywords present in page body",
        }
    return {
        "url": url,
        "status": "fail",
        "verified_at": now_iso(),
        "details": (
            "HTTP 200 but page body does NOT contain AI keywords "
            "(artificial intelligence, generative AI, ChatGPT, etc.). "
            "URL is likely a generic court page, all-judges listing, "
            "or wrong page entirely."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--soft", action="store_true",
                        help="Do not exit non-zero on URL failures")
    parser.add_argument("--limit", type=int, default=None,
                        help="Audit at most N entries (debugging)")
    args = parser.parse_args()

    rules = json.loads(RULES_PATH.read_text())["rules"]
    if args.limit:
        rules = rules[: args.limit]

    results: dict[str, dict] = {}
    n_pass = n_fail = n_block = 0

    for i, r in enumerate(rules, 1):
        rid = r.get("id", f"?{i}")
        entry: dict[str, dict] = {}

        url = r.get("source_url")
        if url:
            res = audit_url(url, kind="html")
            entry["source_url"] = res
            n_pass += res["status"] == "ok"
            n_fail += res["status"] == "fail"
            n_block += res["status"] == "blocked"

        pdf = r.get("source_pdf")
        if pdf:
            res = audit_url(pdf, kind="pdf")
            entry["source_pdf"] = res
            n_pass += res["status"] == "ok"
            n_fail += res["status"] == "fail"
            n_block += res["status"] == "blocked"

        if entry:
            results[rid] = entry

        if i % 10 == 0:
            print(f"  ...audited {i}/{len(rules)} entries", file=sys.stderr)

    audit = {
        "last_run": now_iso(),
        "summary": {
            "total_entries": len(rules),
            "urls_passed": n_pass,
            "urls_failed": n_fail,
            "urls_blocked": n_block,
        },
        "results": results,
    }
    AUDIT_PATH.write_text(json.dumps(audit, indent=2) + "\n")

    print(
        f"\nURL Audit: {n_pass} passed, {n_fail} failed, "
        f"{n_block} blocked across {len(rules)} entries."
    )
    print(f"Wrote {AUDIT_PATH.relative_to(REPO)}.")

    if n_fail > 0:
        print(f"\nFAILED URLS ({n_fail}) — these must be fixed:", file=sys.stderr)
        for rid, e in results.items():
            for kind in ("source_url", "source_pdf"):
                if kind in e and e[kind]["status"] == "fail":
                    print(f"  - {rid} [{kind}]: {e[kind]['url']}",
                          file=sys.stderr)
                    print(f"      {e[kind]['details']}", file=sys.stderr)

    if n_block > 0:
        print(f"\nBLOCKED URLS ({n_block}) — couldn't fetch (warning only):",
              file=sys.stderr)
        for rid, e in results.items():
            for kind in ("source_url", "source_pdf"):
                if kind in e and e[kind]["status"] == "blocked":
                    print(f"  - {rid} [{kind}]: {e[kind]['url']}",
                          file=sys.stderr)
                    print(f"      {e[kind]['details']}", file=sys.stderr)

    if n_fail > 0 and not args.soft:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
