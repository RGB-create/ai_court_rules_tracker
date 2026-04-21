# AI Court Rules Tracker

**Where U.S. courts stand on generative AI.**

A continuously-updating public dashboard of U.S. judicial standing orders,
general orders, administrative orders, and local rules that address
generative AI. The dashboard covers federal courts, state courts, and
guidance directed at courts and the judiciary themselves.

**Live dashboard:** https://rgb-create.github.io/final_project/

---

## What this dashboard tracks

Each tracked rule is classified along a spectrum — from outright prohibition
through disclosure-and-verification regimes to affirmative permission — and
visualized as an interactive U.S. map with search, category filters, and a
cumulative-rules-over-time chart.

The dashboard has five tabs:

- **Federal courts** — federal district, circuit, and specialty-court
  orders and rules directed at litigants and attorneys.
- **State courts** — state trial, appellate, and supreme-court orders
  and rules directed at litigants and attorneys.
- **Guidance for courts & judiciary** — AI policies directed at judges,
  court staff, and judicial operations.
- **In the news** — curated recent reporting on judicial AI activity.
- **About** — methodology, disclaimers, and contact information.

Judicial approaches to generative AI are still new and rapidly evolving.
By categorizing rules by type and tracking them over time, this dashboard
aims to illuminate which kinds of rules — and which levels of strictness
or openness toward AI — are proving popular, spreading across
jurisdictions, and may one day become dominant.

---

## How it works

This project was built with [Claude Code](https://docs.anthropic.com/en/docs/claude-code),
Anthropic's agentic coding tool. An autonomous agent, powered by Claude
and running as a [GitHub Action](https://github.com/anthropics/claude-code-base-action),
updates the dataset on a weekly schedule. Each run, the agent:

1. Searches the web for new or updated judicial orders addressing AI.
2. Reads publicly-available court websites and PDF documents to extract
   rule details.
3. Classifies each rule along the dashboard's category taxonomy.
4. Writes structured updates to the dataset, which are validated against
   a strict schema before being committed.

The goal with source URLs is to bring users directly to the primary source
of each rule or order through publicly accessible court websites and PDFs.

Because some court websites block automated access, and because automated
data gathering is inherently imperfect, there is a human in the loop who
performs regular data verification, maintenance, and spot-checks.

---

## Repository layout

```
final_project/
├── data/
│   ├── rules.json              # Canonical dataset; one entry per order/rule
│   └── news.json               # Curated news articles + tag vocabulary
├── docs/                       # GitHub Pages site (vanilla HTML/CSS/JS)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── scripts/
│   ├── validate.py             # Schema validator (CI gate)
│   └── url_audit.py            # URL reachability checker
├── .github/workflows/
│   ├── update.yml              # Weekly autonomous agent update
│   └── pages.yml               # Dashboard deployment
├── AGENT_PROMPT.md             # Agent worker instructions
└── README.md
```

---

## Data schema

See [`AGENT_PROMPT.md`](AGENT_PROMPT.md) for the full schema, category
definitions, and editorial rules. The schema is intentionally strict so
that the dashboard can render reliably and so that misclassified or
unverified entries are visible rather than hidden.

---

## Local development

The dashboard is fully static. To preview locally:

```bash
python3 -m http.server 8080 --directory .
```

Then open `http://localhost:8080/docs/`. To validate the dataset:

```bash
python3 scripts/validate.py
```

---

## Disclaimer

This dashboard is informational only and is **not legal advice**. The
information presented may not be entirely accurate, complete, or current.
Always consult the order itself and current court guidance before relying
on any entry. This is an ongoing project that is continuously being
updated and improved.

Questions, corrections, and suggestions are welcome at
eguo@jd27.law.harvard.edu.
