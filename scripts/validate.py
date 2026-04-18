#!/usr/bin/env python3
"""Validate data/rules.json against the project schema.

Exits non-zero on any validation error. Used in CI to prevent the agent
from committing malformed data.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

REPO = Path(__file__).resolve().parent.parent
RULES_PATH = REPO / "data" / "rules.json"
NEWS_PATH = REPO / "data" / "news.json"

RULE_REQUIRED_FIELDS = [
    "id", "jurisdiction", "court", "court_short", "court_level",
    "state", "judge", "rule_type", "category", "category_confidence",
    "title", "effective_date", "source_url", "summary",
]
ALLOWED_JURISDICTIONS = {"federal", "state"}
ALLOWED_CONFIDENCE = {"high", "medium", "low", "uncategorized"}

# URL patterns that almost always indicate a generic court page rather
# than the specific page containing the AI policy. These are the most
# common failure modes from prior agent runs — reject them in CI so
# they cannot ship.
GENERIC_URL_PATTERNS = [
    # All-judges listing pages without a specific judge identifier.
    re.compile(r"/judges/?$", re.I),
    re.compile(r"/judges-information/?$", re.I),
    re.compile(r"/judges-info/?$", re.I),
    re.compile(r"/judges-info/active-judges/?$", re.I),
    re.compile(r"/judges-info/senior-judges/?$", re.I),
    re.compile(r"/active-judges/?$", re.I),
    re.compile(r"/senior-judges/?$", re.I),
    re.compile(r"/judges-list/?$", re.I),
    re.compile(r"/judges-schedules-procedures/?$", re.I),
    re.compile(r"/judge-orders/?$", re.I),
    re.compile(r"/judge_display\.php/?$", re.I),  # missing ?LastName= query
    # Generic "rules and orders" listing — only allowed when it's a
    # court-wide local_rule entry; checked separately below.
]


def is_bare_domain(url: str) -> bool:
    """True if URL has no meaningful path beyond '/'."""
    p = urlparse(url)
    return p.path in ("", "/") and not p.query


def is_generic_listing(url: str) -> bool:
    return any(p.search(url) for p in GENERIC_URL_PATTERNS)

NEWS_REQUIRED_FIELDS = [
    "id", "title", "publication", "url",
    "published_date", "date_added", "summary", "topic_tags",
]


def validate_rules(errors: list[str]) -> int:
    data = json.loads(RULES_PATH.read_text())
    cats = data.get("categories", {})
    rules = data.get("rules", [])

    if not cats:
        errors.append("rules.json: categories block is empty")

    seen_ids: set[str] = set()
    for i, r in enumerate(rules):
        loc = f"rules[{i}] (id={r.get('id', '?')})"
        for f in RULE_REQUIRED_FIELDS:
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

        # URL quality gates — catch generic court pages and all-judges
        # listings, which were a recurring failure mode.
        url = r.get("source_url")
        if url:
            if is_bare_domain(url):
                errors.append(
                    f"{loc}: source_url '{url}' is a bare domain (court "
                    "homepage). Must point to the specific page that contains "
                    "the AI policy or links to the AI rule PDF."
                )
            elif is_generic_listing(url):
                errors.append(
                    f"{loc}: source_url '{url}' is a generic all-judges or "
                    "judges-information listing page. Must point to the "
                    "specific judge's page or specific rules page."
                )

        # source_pdf, when set, must look like a PDF link.
        pdf = r.get("source_pdf")
        if pdf:
            if is_bare_domain(pdf):
                errors.append(
                    f"{loc}: source_pdf '{pdf}' is a bare domain, not a "
                    "direct PDF link."
                )
            # Most PDF URLs end in .pdf or contain /files/ paths; warn if neither.
            elif ".pdf" not in pdf.lower() and "/files/" not in pdf.lower() and "/file/" not in pdf.lower():
                errors.append(
                    f"{loc}: source_pdf '{pdf}' does not look like a direct "
                    "PDF link (no '.pdf' or '/files/' in URL). If the PDF is "
                    "served from a different path, ignore this; otherwise fix."
                )
    return len(rules)


def validate_news(errors: list[str]) -> int:
    if not NEWS_PATH.exists():
        return 0
    data = json.loads(NEWS_PATH.read_text())
    vocab = data.get("tag_vocabulary", {})
    articles = data.get("articles", [])

    seen_urls: set[str] = set()
    seen_ids: set[str] = set()
    for i, a in enumerate(articles):
        loc = f"news.articles[{i}] (id={a.get('id', '?')})"
        for f in NEWS_REQUIRED_FIELDS:
            if f not in a:
                errors.append(f"{loc}: missing required field '{f}'")
        if a.get("id") in seen_ids:
            errors.append(f"{loc}: duplicate id")
        seen_ids.add(a.get("id"))
        if a.get("url") in seen_urls:
            errors.append(f"{loc}: duplicate url")
        seen_urls.add(a.get("url"))
        for t in a.get("topic_tags", []) or []:
            if vocab and t not in vocab:
                errors.append(f"{loc}: topic_tag '{t}' not defined in tag_vocabulary")
    return len(articles)


def main() -> int:
    errors: list[str] = []
    n_rules = validate_rules(errors)
    n_articles = validate_news(errors)

    if errors:
        print("VALIDATION FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1
    print(f"OK: {n_rules} rules, {n_articles} news articles validated against schema.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
