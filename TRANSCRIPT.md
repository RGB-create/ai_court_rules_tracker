# Transcript — Building the AI Court Rules Tracker with Claude Code

This document records the conversation that produced this project. It is
one of the deliverables of the assignment ("the transcript of the
conversation stream with the AI agent").

The user is the project author. The assistant is **Claude Code**, running
on Claude Opus 4.6 in a sandboxed development environment.

---

## Project genesis

### Turn 1 — User

The user presented the assignment prompt: pick a session topic, identify
tensions in how different sides of the accelerationist/safetyist/skeptic
triad measure AI's impact, and build a project using agentic tools to
track a metric that could help settle the debate. The tool should
continuously monitor which predictions in the AI world turn out to be true
and provide an evolving picture of the world as it changes.

### Turn 2–4 — Topic selection

Claude initially proposed a topic. The user stopped Claude and clarified
they wanted to pick the topic themselves. Claude presented five candidate
topics with concrete trackable metrics.

### Turn 5 — User defines the project

The user chose to track judicial acceptance of AI in court proceedings —
specifically, a dynamically updating dashboard of all judicial standing
orders and local rules that involve AI. The user specified:
- Color coding by type of rule (spectrum from prohibition to permission)
- Two tabs: state courts and federal courts
- An interactive map interface with search

### Turn 6–8 — Design collaboration

Claude and the user collaborated on:
- The Triad mapping: how accelerationists, safetyists, and skeptics
  relate to judicial AI regulation
- A seven-category taxonomy (later expanded to nine)
- Repository layout and data model
- The agent update mechanism — Claude Code running as a GitHub Action
  authenticated against the user's Claude Pro subscription (effectively
  free)
- Dashboard design: D3 choropleth, Chart.js trend, filterable table

### Turn 9–11 — Cost and mechanism decisions

The user confirmed Claude Pro subscription. Claude recommended running
the agent via GitHub Actions using the Claude Code OAuth token, consuming
only a small slice of existing quota with no additional cost.

### Turn 12 — The build

Claude built the complete project:
1. Directory layout and data schema
2. Hand-seeded `data/rules.json` with initial entries (flagged unverified)
3. Dashboard: `docs/index.html`, `style.css`, `app.js` (vanilla JS + D3 + Chart.js)
4. Validation script (`scripts/validate.py`)
5. Agent prompt (`AGENT_PROMPT.md`) with schema, categories, run modes,
   and honesty guardrails
6. GitHub Actions workflows for weekly updates and Pages deployment
7. README and this transcript

---

## Iterative refinement (subsequent sessions)

### Agent workflow tuning

- **Discovery queue**: Restructured the agent's task queue to prioritize
  high-yield sources (individual judges, aggregator sites) over low-yield
  court-level checks.
- **Volume goals**: Set agent to "find 20 new rules OR work 30 minutes,
  whichever comes last" after initial runs were too brief.
- **State coverage**: Shuffled queue priorities to sweep state courts
  alongside federal ones.
- **Timeout**: Raised workflow timeout to 50 minutes (45 for the agent)
  after early runs quit after 7 minutes.

### Data corrections (spot-checks)

The user performed manual verification and provided corrections across
multiple sessions:

- **Federal**: Fixed judge names (Henry J. Ricardo, not Hector), updated
  source URLs for Judges Jones, Cole, and Soto with verified PDFs and
  CourtListener links. Updated E.D. Mo. summary with verbatim quote.
  Removed unverifiable entries (Judge Boulee, Judge Starr) and re-queued
  them for the agent to find verified sources. Removed an agent-generated
  duplicate E.D. Mo. entry that was incorrectly categorized as "prohibited"
  (the actual text is a Rule 11(b) reminder, not a ban).
- **State**: Updated URLs for Florida 17th Circuit, Massachusetts SJC,
  New Jersey Courts, New York UCS; replaced Virginia entry with LEO 1901;
  removed a Texas bar opinion that didn't address AI. Moved SC Sup. Ct.,
  NY UCS, and MA SJC to guidance_for_courts (all apply to judges/staff,
  not litigants). Recategorized AR as "confidentiality" and VA as
  "attorney's fees" (new categories). Duplicated AZ entry to appear in
  both State and Guidance tabs (explicitly addresses both lawyers and
  judges).

### New categories added

Based on user review of the actual rule text:
- **Confidentiality** — for rules focused on confidentiality risks of
  entering information into AI tools (e.g., Arkansas)
- **Attorney's fees** — for rules addressing AI in the context of billing
  and fee petitions (e.g., Virginia LEO 1901)

### "Guidance for courts" category

The user identified that some state entries (e.g., CT Judicial Branch,
GA Judicial Council, MI, IN, LA, DE, UT, HI, PA Supreme Courts) are
directed at judges and court staff rather than at litigants. These were
re-categorized as `guidance_for_courts` and given their own tab.

### Dashboard restructure — separate tabs

The user requested the dashboard be reorganized from two map sections on
the state tab into fully separate tabs:
1. **About** (landing page) — project description, methodology, disclaimer
2. **Federal courts** — federal rules for litigants (map + trend + table)
3. **State courts** — state rules for litigants (map + trend + table)
4. **Guidance for courts & judiciary** — court-facing policies (map + trend + table)
5. **In the news** — curated reporting

Each non-news tab displays the full category legend (the taxonomy of rule
types), a choropleth map colored by strictest rule, a cumulative trend
chart, and a searchable table. The Guidance tab uses "policies" instead
of "rules" throughout its UI.

### About page design

The About page serves as the landing page and was designed with:
- Dark hero banner with project description
- 2x2 card grid (all light blue) with question-style headings
- Prominent disclaimer (yellow box, not legal advice)
- Contact: Elizabeth Guo, eguo@jd27.law.harvard.edu
- GitHub source link

Key messaging includes: the Lexis/Westlaw differential treatment and its
implications for less well-resourced litigants; the evolving and unsettled
nature of judicial AI policy; the human-in-the-loop verification process.

### News tab

A companion news-tracking system surfaces reputable reporting on judicial
AI activity: new orders, hallucinated-citation incidents, sanctions, and
bar guidance. The agent indexes articles during its weekly runs. As of
April 2026, the tracker has 21 indexed articles including coverage of the
Sullivan & Cromwell AI hallucination incident and proposals for mandatory
hyperlink rules.

### Repository cleanup

Removed one-time scaffolding scripts (`cleanup_unverified.py`,
`null_bad_urls.py`, `seed_court_queue.py`), empty `requirements.txt`,
and agent run log (`output.txt`). Rewrote README for public-facing
audience. Removed "Source & methodology" header link (replaced by
About tab).

---

## How autonomous runs extend this transcript

The weekly agent runs — triggered by the GitHub Action workflow — produce
their own reasoning and data changes. Each run:
- Reads the current dataset and discovery queue
- Searches for new or updated orders
- Writes structured updates validated against the schema
- Commits directly to the repository

The git history of `data/rules.json` and `data/news.json` serves as
the ongoing record of autonomous agent activity beyond this initial
build conversation.

---

## Why this transcript matters for the assignment

The assignment asks for "the transcript of the conversation stream with
the AI agent." This covers both readings:

- **The human/agent collaboration** that designed and built the tool
  (this file).
- **The autonomous agent reasoning** that keeps the tool current
  (recorded in git history and commit messages).

Together they demonstrate a continuously-evolving agentic project that
tracks a real-world metric — judicial attitudes toward generative AI —
as it changes week to week.
