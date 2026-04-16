# AI Court Rules Tracker

A continuously-updating, public dashboard of U.S. judicial standing orders
and local rules addressing generative AI in court filings.

The project ingests court orders that speak to AI use, classifies each
along a seven-point spectrum from outright prohibition to affirmative
permission, and visualizes the result as an interactive U.S. map with
search, category filters, and a cumulative trend chart. The dataset is
maintained by an autonomous weekly Claude Code agent that runs as a GitHub
Action.

This is the second deliverable of a final-project assignment whose
descriptive question is: across the accelerationist / safetyist / skeptic
"Triad," who is more accurate about where the U.S. judiciary is heading
on generative AI? The metric this dashboard tracks — the count and
distribution of judicial AI orders over time — is designed to make that
debate empirical rather than rhetorical.

The accompanying short paper (deliverable 1) and the conversation
transcript that produced this codebase (deliverable 3,
[`TRANSCRIPT.md`](TRANSCRIPT.md)) live alongside this README.

---

## Live dashboard

Once GitHub Pages is enabled (see *Setup* below), the dashboard is
published at `https://<your-github-username>.github.io/final_project/`.

It has two tabs (Federal | State), a U.S. map color-coded by the strictest
rule currently in force in each state, a category-filterable legend, a
search box, a cumulative-rules-over-time chart, and a sortable detail
table.

---

## Repository layout

```
final_project/
├── data/
│   ├── rules.json              # Canonical dataset; one entry per order/rule
│   └── history.json            # Time-series of category counts
├── docs/                       # GitHub Pages site (vanilla HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── scripts/
│   ├── validate.py             # Schema validator (CI gate)
│   └── compute_history.py      # Appends today's snapshot to history.json
├── .github/workflows/
│   ├── update.yml              # Weekly agent run
│   └── pages.yml               # Dashboard deployment
├── AGENT_PROMPT.md             # The prompt the agent reads each run
├── TRANSCRIPT.md               # Conversation that built this project
└── README.md
```

---

## How the autonomous updater works

A scheduled GitHub Action (`.github/workflows/update.yml`) runs every
Monday at 13:00 UTC and on manual trigger. It:

1. Checks out the repo.
2. Invokes the `anthropics/claude-code-base-action`, passing the contents
   of `AGENT_PROMPT.md` as the prompt.
3. The agent reads the current dataset, decides whether this is a
   "discovery pass" (first real run) or an "incremental update," and
   uses web search + web fetch to find new or changed orders.
4. The agent writes structured updates to `data/rules.json`, runs the
   validator and the history script, and commits.
5. The push to the branch triggers `pages.yml`, which redeploys the
   dashboard with the new data.

The agent reasons over a strict schema and a fixed seven-category
taxonomy (defined in `AGENT_PROMPT.md`). If it encounters a rule that
doesn't fit any category, the prompt instructs it to surface the
mismatch in `taxonomy_review.md` rather than silently invent a new
slug.

---

## Setup (one-time, by you)

### 1. Push this repo to GitHub

```bash
git push -u origin claude/ai-impact-tracking-tool-YOHsc
```

Open a PR into `main` if you want, or merge directly. The dashboard
deploys from whichever branch GitHub Pages is configured to read.

### 2. Add your Claude Code OAuth token as a repo secret

The agent authenticates against your existing Claude Pro subscription
via an OAuth token, so each weekly run consumes a small slice of your
Pro quota instead of being billed to a separate API balance.

Generate the token locally:

```bash
claude setup-token
```

Copy the resulting token. Then in GitHub:

1. Open the repo's **Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Name: `CLAUDE_CODE_OAUTH_TOKEN`. Value: paste the token. Save.

(Alternatively, if you'd rather use pay-as-you-go API billing, add
`ANTHROPIC_API_KEY` instead. The workflow will use whichever is set,
preferring the OAuth token.)

### 3. Enable GitHub Pages

In the repo's **Settings → Pages**:

- Source: **GitHub Actions**.

The first push to the deployment branch will trigger `pages.yml` and
publish the dashboard.

### 4. Run the first discovery pass

Open the **Actions** tab, pick **Weekly agent update**, click **Run
workflow**, and trigger it manually. Optionally add a note like "first
discovery pass" — it'll show up in the commit message.

The discovery pass will replace the hand-seeded entries with verified
ones, set `discovery_pass_completed: true`, and write a summary log to
`transcripts/runs/<date>-discovery.md`. It typically takes 5–15 minutes
and consumes a modest amount of your Claude Pro quota (roughly equivalent
to a long interactive coding session).

### 5. Sit back

After the discovery pass, the workflow runs automatically every Monday.
You can also re-run manually any time. Each run commits its changes
directly to the branch and re-deploys the dashboard.

---

## Development & local testing

The dashboard is fully static. To preview locally:

```bash
cd final_project
python3 -m http.server 8080 --directory .
```

Then open `http://localhost:8080/docs/`. The dashboard will fetch
`../data/rules.json`, which works because we're serving the repo root.
(In the deployed version, the build step in `pages.yml` flattens
`data/` next to `index.html` and rewrites the fetch path accordingly.)

To validate the dataset:

```bash
python3 scripts/validate.py
```

To recompute the trend snapshot:

```bash
python3 scripts/compute_history.py
```

---

## Data schema

See [`AGENT_PROMPT.md`](AGENT_PROMPT.md) for the full schema, category
definitions, and rules the agent must follow. The schema is intentionally
strict so that the dashboard can render reliably and so that misclassified
or unverified entries are visible rather than hidden.

Hand-seeded entries (the five orders that ship with the initial commit)
have `last_verified: null` and a `provenance` note indicating they need
verification on the first agent run. The dashboard renders them with an
`unverified` flag.

---

## Caveats

- This is a research artifact for a course project, **not legal advice**.
- The seven-category taxonomy is provisional; the discovery pass is
  designed to surface mismatches via `taxonomy_review.md`.
- State-level coverage will lag federal-court coverage because state
  judicial orders are less consistently published online.
- The federal map uses state-level granularity (each state colored by the
  strictest federal rule in force in any federal court located there). A
  true federal-judicial-district map is a planned follow-up; it requires
  the agent to bootstrap a district-boundary GeoJSON file into `docs/geo/`.
