# AI Court Rules Tracker

A public, continuously-updating index of U.S. judicial standing orders,
general orders, administrative orders, and local rules that address
generative AI in court filings.

Each tracked rule is classified along an eight-point spectrum — from
outright prohibition through disclosure-and-verification regimes to
affirmative permission — and visualized as an interactive U.S. map with
search, category filters, a table view, and a cumulative-rules-over-time
chart. A companion "In the news" tab surfaces reputable reporting on new
orders, hallucinated-citation incidents, sanctions, and bar ethics
guidance.

The dashboard is informational and is not legal advice.

---

## Live dashboard

Once GitHub Pages is enabled (see *Setup* below), the dashboard is
published at `https://<your-github-username>.github.io/final_project/`.

It has three tabs:

- **Federal courts** — federal district, circuit, and specialty-court
  orders and rules.
- **State courts** — state trial, appellate, and supreme-court orders
  and rules.
- **In the news** — curated recent reporting on judicial AI activity.

Each of the first two tabs includes a U.S. map colored by the strictest
rule currently in force in each state, a category-filterable legend, a
keyword search, a cumulative trend chart, and a sortable detail table.

---

## Repository layout

```
final_project/
├── data/
│   ├── rules.json              # Canonical dataset; one entry per order/rule
│   └── news.json               # Curated news articles + locked tag vocabulary
├── docs/                       # GitHub Pages site (vanilla HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── scripts/
│   └── validate.py             # Schema validator (CI gate)
├── .github/workflows/
│   ├── update.yml              # Scheduled weekly update
│   └── pages.yml               # Dashboard deployment
├── AGENT_PROMPT.md             # Update-worker instructions
└── README.md
```

The trend chart on the dashboard is computed on the client directly from
each rule's `effective_date`, so there is no separate history file to
maintain.

---

## How updates work

A scheduled GitHub Action (`.github/workflows/update.yml`) runs every
Monday at 13:00 UTC and on manual trigger. Each run:

1. Checks out the repo.
2. Invokes `anthropics/claude-code-base-action` with the instructions in
   `AGENT_PROMPT.md`.
3. The worker reads the current dataset, decides whether this is a
   "discovery pass" (first real run) or an "incremental update," uses
   web search + web fetch to find new or changed orders, and writes
   structured updates to `data/rules.json` and `data/news.json`.
4. The validator in `scripts/validate.py` runs as a gate on the changes.
5. The worker commits directly to the branch.
6. The push triggers `pages.yml`, which redeploys the dashboard with the
   new data.

The worker reasons over a strict schema and a fixed eight-category
taxonomy (defined in `AGENT_PROMPT.md`). If it encounters a rule that
doesn't fit any category, the prompt instructs it to surface the
mismatch in `taxonomy_review.md` rather than silently invent a new
slug.

---

## Setup (one-time)

### 1. Push this repo to GitHub

```bash
git push -u origin claude/ai-impact-tracking-tool-YOHsc
```

The dashboard deploys from whichever branch GitHub Pages is configured
to read.

### 2. Add an API credential as a repo secret

The update workflow needs one of:

- `CLAUDE_CODE_OAUTH_TOKEN` — generated locally via `claude setup-token`
  (uses your Claude Pro subscription).
- `ANTHROPIC_API_KEY` — pay-as-you-go API balance.

In the repo's **Settings → Secrets and variables → Actions**, click
**New repository secret** and add whichever you prefer. The workflow
uses the OAuth token if both are present.

If neither secret is set, the workflow no-ops with a helpful message
rather than failing.

### 3. Enable GitHub Pages

In the repo's **Settings → Pages**:

- Source: **GitHub Actions**.

The first push to the deployment branch triggers `pages.yml` and
publishes the dashboard.

### 4. Run the first discovery pass

Open the **Actions** tab, pick **Weekly agent update**, click **Run
workflow**, and trigger it manually. The discovery pass replaces the
hand-seeded entries with verified ones, sets
`discovery_pass_completed: true`, and writes a summary log to
`transcripts/runs/<date>-discovery.md`.

### 5. Sit back

After the discovery pass, the workflow runs automatically every Monday.
You can re-run manually any time. Each run commits directly to the
branch and redeploys the dashboard.

---

## Development & local testing

The dashboard is fully static. To preview locally:

```bash
cd final_project
python3 -m http.server 8080 --directory .
```

Then open `http://localhost:8080/docs/`. The dashboard fetches
`../data/rules.json`, which works because the server is rooted at the
repo root. (In the deployed version, `pages.yml` flattens `data/` next
to `index.html` and rewrites the fetch path accordingly.)

To validate the dataset:

```bash
python3 scripts/validate.py
```

---

## Data schema

See [`AGENT_PROMPT.md`](AGENT_PROMPT.md) for the full schema, category
definitions, and editorial rules. The schema is intentionally strict so
that the dashboard can render reliably and so that misclassified or
unverified entries are visible rather than hidden.

Entries that ship with the initial commit are hand-seeded with
`last_verified: null` and a `provenance` note indicating they need
reconciliation against the primary source on the first automated run.
The dashboard renders them with an `unverified` flag.

---

## Caveats

- This is an informational project, **not legal advice**. Always
  consult the order itself and current court guidance before relying
  on any entry.
- The eight-category taxonomy is provisional; mismatches should be
  surfaced via `taxonomy_review.md`.
- State-level coverage will lag federal-court coverage because state
  judicial orders are less consistently published online.
- The federal map uses state-level granularity (each state colored by
  the strictest federal rule in force in any federal court located
  there). A true federal-judicial-district map is a planned follow-up;
  it requires a district-boundary GeoJSON file in `docs/geo/`.
