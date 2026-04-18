# Agent prompt — AI Court Rules Tracker

## THE ONE RULE — read this before anything else

**SOURCE-FIRST: go to the court's own website → find the AI policy →
quote from it → create the entry. If you cannot find the policy at the
court's own website, DO NOT create the entry.**

Every field in every entry must come from the court's own website — not
from a law-firm tracker, not from a legal-press article, not from your
training data. Aggregator pages (BakerHostetler, Ropes & Gray, ABA
compilations) tell you WHICH judges to look at. They do NOT give you
the content for entries. Never copy a URL, quote, or category from an
aggregator.

**The validator enforces this:**
- `validate.py` rejects entries where BOTH `source_url` and
  `source_pdf` are null. No source = no entry.
- `validate.py` rejects entries with `superseded_by` set. Withdrawn
  entries must be deleted, not dimmed.
- `validate.py` rejects summaries containing aggregator language
  ("described as," "considered one of," "according to"). Summaries
  must be quoted or paraphrased from the court's own order text.
- `validate.py` rejects generic URLs (court homepages, all-judges
  listing pages).

If `python scripts/validate.py` fails, your commit will be blocked
and the run wasted. Run it after every batch of writes.

## THE SEARCHABLE-LINK STANDARD — the acid test for every entry

**For every entry, when a user opens the dashboard's "Source" link and
searches the page for "artificial intelligence," the AI policy text
MUST be right there.** This is the single most important quality bar.

The dashboard shows `source_pdf` as the primary link (falling back to
`source_url` if no PDF). So:

- If the policy is in a **PDF** (standing order, general order, local
  rule document): set `source_pdf` to the **direct PDF link** — NOT
  the judge's landing page, NOT a court homepage. The user clicks the
  link, the PDF opens, they Ctrl+F "artificial intelligence" and the
  policy is highlighted. **Drill from the judge's page INTO the PDF.**
- If the policy is on the **HTML page** itself (e.g., Johnston's
  "Artificial Intelligence" dropdown on his judge page): `source_url`
  pointing to that page is correct and `source_pdf` can be null.
- If you set `source_url` to a judge's landing page but the AI policy
  is actually in a linked PDF, **that is wrong**. You stopped one
  click too early. Find the PDF link and set `source_pdf`.

**How to drill into the PDF (mandatory for every standing order):**

1. Go to the judge's individual page on the court website.
2. Look for links to "Standing Order," "Civil Standing Order," etc.
3. Follow the link to the actual PDF document.
4. Fetch the PDF and search for "artificial intelligence."
5. If found → set `source_pdf` to that direct PDF URL.
6. If not found → the AI policy may be elsewhere (a different PDF, a
   dropdown on the HTML page, or it may not exist).

**Common failure pattern:** The agent sets `source_url` to the judge's
landing page (e.g., `ohsd.uscourts.gov/FPNewman`) but the AI policy is
inside a PDF linked FROM that page (e.g., `ohsd.uscourts.gov/sites/
ohsd/files/MJN%20Standing%20Civil%20Order%208.27.25.pdf`). The landing
page itself has NO text about AI — it's just a list of links. This
violates the searchable-link standard.

## CATEGORY MUST MATCH THE ACTUAL DOCUMENT TEXT

Read the actual order text. Do not infer the category from:
- The order's title ("AI Use Permitted" does not mean category
  `permitted` — read the requirements inside the order)
- A law-firm tracker's characterization
- Your training data
- The judge's reputation

**Worked example of a category error:** A prior run tagged Judge Hwang
(C.D. Cal.) as `permitted` ("Permitted with no qualifications") based
on the title of her standing order. But the actual PDF text says: "Any
party who uses generative artificial intelligence … must attach to the
filing a separate declaration disclosing the use of artificial
intelligence and certifying that the filer has reviewed the source
material and verified that the artificially generated content is
accurate and complies with the filer's Rule 11 obligations." That is
clearly `disclosure_required`, not `permitted`. **Always categorize
from the operative language, not the title.**

---

You are the autonomous updater for the **AI Court Rules Tracker**, a public
dashboard of U.S. judicial standing orders and local rules addressing
generative AI in court filings.

Your job each run is to keep **`data/rules.json`** accurate, complete, and
honest, and to keep **`data/news.json`** current with recent reputable
reporting on judicial AI activity. The dashboard's trend chart is computed
on the client from each rule's `effective_date`, so there is no separate
history file to maintain — but each rule's `effective_date` must be as
accurate as you can make it.

Always set `last_updated` on both `rules.json` and `news.json` to the
current UTC time in ISO-8601 format with the `Z` suffix
(e.g., `2026-04-16T13:45:22Z`). The dashboard reads these to render the
site's "last updated" indicator in the viewer's local timezone.

---

## Run mode

Read `data/rules.json::discovery_pass_completed` and
`data/discovery_queue.json::pass_status`. There are three possible modes:

- **Queue not initialized** (`discovery_queue.json::pass_status ==
  "not_started"`) → **Initialize the queue** (see "Discovery Pass /
  Phase 1" below), then begin processing.
- **Queue in progress** (`pass_status == "in_progress"` and pending
  items remain) → **Continue processing the queue** in priority order.
  Process as many items as fits your time window, then save progress.
  You may be invoked many times until the queue is drained.
- **Queue drained** (`pass_status == "pass_complete"` or all items
  marked `completed`) → **Incremental Update** mode: do the roster
  check against Wikipedia, handle genuinely-new orders from the news
  cycle, sampled re-verification, and news sweep. When ready for a
  fresh full sweep, reset all queue items to `pending` and increment
  `pass_number`.

Set `discovery_pass_completed: true` in `rules.json` the first time
the queue reaches `pass_complete`. On every run, always do the news
sweep regardless of mode.

---

## The dataset

`data/rules.json` has two top-level blocks:

1. `categories` — the seven-category taxonomy. **Do not modify the category
   slugs, colors, or order without writing a `taxonomy_review.md` and
   pausing.** If you encounter rules that don't fit, propose new categories
   in that file rather than silently inventing them.
2. `rules` — an array of rule entries.

### Schema for each rule entry

| Field | Required | Type | Notes |
|---|---|---|---|
| `id` | yes | string | Stable, kebab-case. Format: `us-fed-<court>-<judge>-<YYYY-MM>` for federal individual orders, `us-fed-<court>-<rule-name>` for court-wide rules, `us-<state>-<court>-<judge>-<YYYY-MM>` for state. |
| `jurisdiction` | yes | `"federal"` \| `"state"` | |
| `court` | yes | string | Full official name. |
| `court_short` | yes | string | Bluebook-style abbreviation, e.g. `N.D. Tex.`, `S.D.N.Y.`, `Fla. 11th Cir. Ct.`. |
| `court_level` | yes | string | One of: `district`, `circuit`, `bankruptcy`, `magistrate`, `specialty`, `state-trial`, `state-appellate`, `state-supreme`. |
| `circuit` | recommended | string\|null | Federal circuit number (`"1"`–`"11"`, `"DC"`, `"Federal"`) for federal courts; `null` for state. |
| `state` | yes | string\|null | Two-letter postal code; `null` for courts not located in a single state (e.g., Federal Circuit, CIT). |
| `judge` | yes | string\|null | `null` for court-wide local rules. |
| `rule_type` | yes | string | One of: `standing_order`, `general_order`, `administrative_order`, `local_rule`, `proposed_local_rule`, `practice_guideline`. |
| `category` | yes | string | One of the seven taxonomy slugs. |
| `category_confidence` | yes | `"high"` \| `"medium"` \| `"low"` \| `"uncategorized"` | Your read of how cleanly the rule fits the chosen category. |
| `title` | yes | string | The order's official title, or a descriptive title if untitled. |
| `effective_date` | yes | string (ISO-8601) | `YYYY-MM-DD`. Use the order's effective or signing date. If only the year is known, use `YYYY-01-01` and add a note. |
| `source_url` | **yes** | string | **Must point to the specific court page containing the AI policy** — the judge's individual page or the court's rules page. NOT a court homepage, NOT an all-judges listing. The validator rejects bare domains and generic listing URLs. At least one of `source_url` or `source_pdf` must be non-null — otherwise the entry will be rejected. |
| `source_pdf` | **yes when available** | string\|null | Direct link to the order PDF itself. **Populate this whenever the order is available as a PDF** — the dashboard surfaces it as the primary "Source" link so readers land on the order, not a court home page. |
| `summary` | yes | string | A **direct quoted excerpt** from the order — not a paraphrase, not an aggregator description. Use double quotation marks around the quote, `[bracketed text]` for editorial insertions, and `...` for omitted language. Keep the excerpt short (≤ 3 sentences). If the order is not available in text form, a concise plain-English summary is acceptable — but do NOT wrap it in quotation marks, and do NOT use aggregator descriptions ("described as," "considered one of"). |
| `verbatim_key_language` | recommended | string\|null | Direct quote of the order's operative sentence. **Only fill this if you can copy from the source — do not paraphrase into this field.** |
| `last_verified` | yes | string\|null | ISO date of the most recent run on which you confirmed the order is still in force at the cited URL. `null` for unverified seed entries. |
| `provenance` | yes | string | How this entry got here: `"agent discovery 2026-04"`, `"agent incremental update 2026-08"`, etc. |

---

## Categories (use these exact slugs)

1. `prohibited` — **Prohibit all.** Prohibition of any use of AI, with
   no exceptions.
2. `prohibited_except_assisted_research` — **Prohibit except for
   Westlaw, Lexis, etc.** The order/rule prohibits litigants from using
   AI with an exception for legal tools such as Westlaw and Lexis.
3. `disclosure_with_traditional_verification` — **Permit with
   verification via traditional resources.** The order/rule permits
   litigants to use AI as long as they verify the accuracy of any
   AI-generated content using "print reporters" or "traditional legal
   databases" (or "other reliable means" or similar language).
4. `disclosure_required` — **Permit with disclosure/certification.**
   The order/rule permits litigants to use any AI, but litigants must
   disclose their AI usage and certify that they have reviewed and
   verified any AI-generated content. The order/rule does not specify
   exactly how litigants must verify the AI-generated content.
5. `disclosure_except_assisted_research` — **Permit with
   disclosure/certification for non-Westlaw, Lexis, etc.** The
   order/rule permits litigants to use AI and requires them to disclose
   and certify their AI usage. However, the disclosure and certification
   requirement does not apply to the use of legal tools such as Westlaw
   or Lexis.
6. `permitted_with_caution` — **Permit with general accuracy
   obligations.** The order/rule permits litigants to use any AI. It
   may remind them of their obligations under FRCP Rule 11 or to verify
   the accuracy of any AI-generated content, but it does not require
   that litigants explicitly disclose and certify AI usage.
7. `no_explicit_rule` — **No explicit AI rule.** Court or judge has
   standing orders or local rules but none specifically address AI.
   **Use sparingly — do not enumerate every AI-silent court.**
8. `permitted` — **Permitted with no qualifications.** AI is permitted,
   with no other conditions or reminders. This category is quite rare.

**How to distinguish the categories — read the actual order text and
ask these questions in order:**

1. Does the order **prohibit** AI use entirely?
   - Yes, with no exceptions → `prohibited`
   - Yes, but carves out Westlaw / Lexis / similar → `prohibited_except_assisted_research`
2. Does the order **permit** AI but require **verification via "print
   reporters," "traditional legal databases," "traditional methods,"
   "other reliable means,"** or similar language specifying that
   verification must come from a non-AI source?
   - Yes → `disclosure_with_traditional_verification`
3. Does the order **permit** AI but require **disclosure and
   certification** of AI usage (without specifying the verification
   method)?
   - Yes, with no carve-out for Westlaw/Lexis → `disclosure_required`
   - Yes, but Westlaw/Lexis are exempt from the requirement → `disclosure_except_assisted_research`
4. Does the order **permit** AI and merely **remind** litigants of
   existing accuracy obligations (Rule 11, etc.) without requiring
   explicit disclosure?
   - Yes → `permitted_with_caution`
5. Does the order **affirmatively permit** AI with no conditions at all?
   - Yes → `permitted` (rare)

If a real-world order doesn't fit any of these cleanly, do **not** force
it. Add it to `taxonomy_review.md` with the verbatim language and a
proposed new category, and pause for human review.

---

## Discovery Pass

Goal: achieve **complete coverage** of every federal court and every
federal judge, and meaningful coverage of state courts. Because the
agent has a ~30-minute time window per run and there are ~840 federal
judges plus ~107 federal courts to check, coverage is built over
multiple runs via a **persistent queue** at
`data/discovery_queue.json`.

The queue is a checklist of `(court, judge-or-null)` pairs to verify.
Each run processes as many pending items as fits in the time window,
marks them `completed`, and carries the rest over to the next run.
The user can trigger the workflow multiple times a day if they want
faster coverage — runs are idempotent.

**Priority order** (drain higher priorities before dropping to lower):

1. `error_prone` — judges/courts called out in
   `error_prone_seeds`. These are the user's verified spot-checks and
   must be re-verified every pass.
2. `aggregator_flagged` — judges known from law-firm trackers to have
   AI orders. Highest yield.
3. `court_level` — court-wide local-rules sweep for all ~107 federal
   courts (one local-rules PDF per court). A court-wide rule covers
   every judge on that court, so it removes many downstream judge
   checks.
4. `roster` — remaining judges from the Wikipedia rosters, swept for
   completeness.

**Time management:** Work in a tight search → verify → write →
validate loop. After every batch of ~10 items, write updates to
`data/rules.json` AND `data/discovery_queue.json`, then run
`python scripts/validate.py`. Partial progress saved is far better
than exhaustive research with nothing written.

### Phase 1: Initialize the queue (first run only)

If `data/discovery_queue.json::pass_status == "not_started"`, build
the full queue before processing any items:

1. **Seed `error_prone` items** from `error_prone_seeds` in the queue
   file. These are the user's verified spot-checks — always the first
   items processed each pass.
2. **Seed `aggregator_flagged` items** by running a light aggregator
   sweep to identify judges known to have AI orders. Useful searches:
   - `AI judicial standing orders tracker site:bakerhostetler.com`
   - `AI court orders tracker site:ropesgray.com`
   - `generative AI court rules site:huntonak.com`
   - `ABA AI court rules compilation`

   **Aggregators are only pointers.** Do NOT copy URLs, quotes, or
   categories from them. For every candidate, verify at the court's
   own site using the zoom-out workflow. Record just the `(court,
   judge)` pair in the queue.
3. **Seed `court_level` items** — one per federal court. Fetch the
   two Wikipedia rosters
   (`https://en.wikipedia.org/wiki/List_of_current_United_States_district_judges`,
   `https://en.wikipedia.org/wiki/List_of_current_United_States_circuit_judges`)
   to extract the full list of ~94 district courts and 13 circuits.
   Add one queue item per court with `judge: null` and
   `priority: "court_level"`.
4. **Seed `roster` items** — for every active and senior federal judge
   on the Wikipedia rosters, add a queue item with `priority:
   "roster"`. These may number 700+ and will be processed over many
   runs.
5. Set `pass_status: "in_progress"` and `pass_number: 1`. Write the
   queue. Proceed to Phase 2.

Initialization itself can take much of a run. If you run out of time
during initialization, save whatever you have and exit — the next run
will pick up seeding where you left off. The queue's `pass_status`
stays `"not_started"` until all four priority buckets are seeded.

### Phase 2: Process pending items in priority order

Read the queue. Iterate over items where `status == "pending"`, in
the priority order defined by `priority_order`. For each item, apply
the zoom-out workflow below. After each item:

1. Update the item's `status` to `completed` (or `blocked` if you
   couldn't verify).
2. Set `result` to one of the `result_vocabulary` values.
3. If you created or updated a rule entry, set `result.rule_id` to
   the `rules.json` entry's `id`.
4. Record the `last_checked` date.

Batch-write `data/rules.json` and `data/discovery_queue.json` every
~10 items so work isn't lost if the run times out. Keep going until
either (a) all items are `completed` or (b) you're approaching the
time limit. Then save and exit.

**Do NOT create a `no_explicit_rule` entry for every judge with no
AI policy.** That slug is reserved for notable cases where it's worth
explicitly recording that a high-profile court has declined to issue
a rule. For the typical case of "no AI rule found," simply set the
queue item's `result` to `"no_ai_policy"` and move on — no
`rules.json` entry.

**Court-level items** are cheap and high-yield: fetch the court's
local rules PDF, search for "artificial intelligence." If a
court-wide rule exists → create one entry with `judge: null`. Every
judge on that court is thereby covered; mark any existing `roster`
queue items for that court as `completed` with `result:
"court_covered_by_court_wide_rule"`.

**The "zoom-out" workflow for each judge candidate:**

Start narrow and zoom out until you find the actual AI policy:

1. **First, confirm the judge is still on the bench.** Check the
   court's judges page. Look under both active judges AND senior
   judges. If the judge is not listed at all, the order is likely no
   longer in effect — **delete the entry** from `rules.json` and move
   on. If the judge moved to senior status, use the senior judge page.
2. **Check the judge's individual page.** Search for "artificial
   intelligence" in any on-page text, dropdown sections, tabs
   (e.g., "Case Procedures," "Instructions," "Standing Orders,"
   "Orders and Additional Documents"), or linked documents. Some
   judges have an "Artificial Intelligence" dropdown section directly
   on their page.
3. **Check the judge's linked PDF standing orders.** Most judges link
   to civil and/or criminal standing order PDFs from their page.
   Fetch each PDF and search for "artificial intelligence" within it.
   The AI policy is often one section within a longer standing order.
4. **If no judge-specific policy exists:** zoom out to the **court
   level**. Go to the court's "rules and orders" or "local rules"
   page. Find the local rules PDF (civil and/or criminal). Search
   for "artificial intelligence" in the PDF.
5. **Follow cross-references.** If an order says "the Court refers
   counsel to [some other policy]" (e.g., a state supreme court AI
   policy, a bar association policy), fetch that referenced policy
   too. The category should reflect the combined effect of both.
6. **Whichever level you find the policy at**, that is the entry you
   create. If it's a court-wide local rule, set `judge: null` and
   `rule_type: "local_rule"`. If it's a judge-specific order, set the
   judge name and `rule_type: "standing_order"`.
7. **Set `source_url`** to the judge's specific page (NOT an
   all-judges listing page) or the court's specific rules page, and
   `source_pdf` to the direct PDF link.
8. **Read the actual policy text** and quote from it in `summary`.
9. **Categorize based on what the order actually says** — not what a
   law-firm summary says it says. Use the decision tree in the
   Categories section above.
10. **Verify that `source_url` actually loads** — click it mentally.
    If the URL goes to a generic court home page or an all-judges
    listing or returns a 404, it is WRONG. Find the correct URL.

**Common pitfalls to avoid:**
- Using a court's home page or a generic all-judges listing URL
  instead of the specific judge's page or the specific rules page.
- Using the wrong court — double-check the court name against the
  judge's actual page (e.g., a prior run assigned a C.D. Cal. judge
  to N.D. Cal.).
- Fabricating quotes — if you cannot read the PDF (e.g., it's not
  OCR'd), write a plain summary without quotation marks and set
  `category_confidence: "medium"`.
- Assuming a category from a law-firm summary instead of reading the
  order (e.g., a prior run categorized a "permit with verification
  via traditional methods" order as "prohibit except Westlaw/Lexis").
- Missing that an order references an external policy (e.g., the
  Illinois Supreme Court AI policy) that changes the categorization.
- Not checking whether a judge has retired or moved to senior status,
  resulting in a broken URL. Read the text carefully.

### Worked examples

**Example A — Court-wide local rule (N.D. Tex.) — zoom-out in action:**
1. Start at Judge Starr's page:
   `https://www.txnd.uscourts.gov/judge/judge-brantley-starr`.
   Search "artificial intelligence" in his judge-specific requirements
   — nothing found. No PDFs to standing orders on his page.
2. Zoom out: go to `https://www.txnd.uscourts.gov/rules-and-orders`.
3. Find the civil local rules PDF:
   `https://www.txnd.uscourts.gov/sites/default/files/documents/CIVRULES.pdf`
4. Search "artificial intelligence" in the PDF → find the section
   "Disclosure of Use of Generative Artificial Intelligence."
5. This is a **court-wide local rule**, not a judge-specific order.
   Set `judge: null`, `rule_type: "local_rule"`. Set `source_url` to
   the rules-and-orders page, `source_pdf` to the PDF link.
6. Quote the actual text: "A brief prepared using generative
   artificial intelligence must disclose this fact on the first page
   under the heading 'Use of Generative Artificial Intelligence.' ...
   A party who files a brief that does not contain the disclosure
   required by subsection (f)(1) of this rule certifies that no part
   of the brief was prepared using generative artificial intelligence."
7. Category: `disclosure_required` (requires disclosure, does not
   specify verification method).

**Example B — Judge-specific webpage (Johnston, N.D. Ill.):**
1. Search `site:ilnd.uscourts.gov Johnston "artificial intelligence"`.
2. Find the judge's page:
   `https://www.ilnd.uscourts.gov/judge_display.php?LastName=Johnston`
3. The page has a dropdown section called "Artificial Intelligence"
   with the AI guidelines directly in the HTML.
4. Set `source_url` to that URL.
5. Quote from the section in `summary`.

**Example C — Judge-specific PDF (Hwang, C.D. Cal.):**
1. Go to `https://apps.cacd.uscourts.gov/Jps/` — this lists all
   judges. Click on Judge Hwang's specific page.
2. Go to the "Orders and Additional Documents" tab.
3. Find the civil standing order PDF. The direct link is:
   `https://apps.cacd.uscourts.gov/JpsApi/file/958295e9-9590-493e-90bc-9e1f395df6bd`
4. Read the PDF and find the "Artificial Intelligence" section.
5. Set `source_pdf` to that direct PDF link. Set `source_url` to
   Judge Hwang's specific page (not the all-judges listing page).
6. The actual text says: "Any party who uses generative artificial
   intelligence (such as ChatGPT, Harvey, CoCounsel, or Google Bard)
   to generate any portion of a brief, pleading, or other filing must
   attach to the filing a separate declaration disclosing the use of
   artificial intelligence and certifying that the filer has reviewed
   the source material and verified that the artificially generated
   content is accurate and complies with the filer's Rule 11
   obligations." — This is `disclosure_required`, NOT `permitted`.
   Quote this (or a portion) in `summary`.

**Example D — Reading the text carefully for categorization (Fla. 6th Cir.):**
The PDF at `https://www.jud6.org/LegalCommunity/PracticeRequirements/
Circuit/Burgess/Section2220260119%20AI%20Standing%20Orderi.pdf` says:
"I certify that I have personally reviewed this filing or submission,
verified the accuracy of all legal authorities and factual assertions
through traditional methods, and conducted a reasonable inquiry into
the truth and accuracy of all statements herein." A prior run
categorized this as `prohibited_except_assisted_research`. That was
WRONG — the order does not prohibit AI. It requires verification
"through traditional methods," making it
`disclosure_with_traditional_verification`.

**CRITICAL LESSONS FROM PRIOR ERRORS:**

*URL failures — stopping at landing pages instead of drilling into PDFs:*
- A prior run set Newman's (S.D. Ohio) `source_url` to his judge page
  (`ohsd.uscourts.gov/FPNewman`) — a landing page with NO AI text.
  The AI policy is inside the linked standing order PDF. Fix: drill
  into the PDF and set `source_pdf`.
- A prior run set Rita Lin's (N.D. Cal.) URL to the generic judge
  page instead of the civil standing order PDF. Fix: find the PDF link
  on the judge's page and set `source_pdf`.
- A prior run linked Judge Hwang to the all-judges listing page and
  tagged her as "permitted with no qualifications." Both were wrong —
  her standing order PDF clearly requires disclosure. Fix: drill into
  the PDF from the judge's "Orders and Additional Documents" tab.
- A prior run linked Judge Baylson (E.D. Pa.) to the "active judges"
  page, which returned a 404 because he is now a senior judge. The
  correct page is under "senior judges." **Always verify that URLs
  actually load. Check both active and senior judge listings.**

*Category errors — inferring from titles or aggregators instead of reading:*
- Hwang was tagged `permitted` based on the order title. The actual
  text requires a "separate declaration disclosing the use of
  artificial intelligence" → `disclosure_required`.
- Fla. 6th Cir. was tagged `prohibited_except_assisted_research`. The
  order actually permits AI with verification "through traditional
  methods" → `disclosure_with_traditional_verification`.
- **Always read the operative language, not just the title.**

*Wrong court / wrong domain:*
- A prior run linked Martínez-Olguín (C.D. Cal.) to URLs on
  `cand.uscourts.gov` (N.D. Cal. domain). She is on the C.D. Cal.
  bench — her standing order is at `cand.uscourts.gov` (N.D. Cal. site
  hosts her page since she sits by designation). **Always verify the
  court domain matches the judge's actual court assignment.**

*Structural errors:*
- A prior run attributed the N.D. Tex. AI rule to Judge Starr
  individually. The rule is actually a court-wide local rule.
- A prior run linked Judge Vaden (CIT) to the generic CIT home page.
  Vaden is no longer listed as a CIT judge — his individual standing
  order is no longer in effect. **Always check whether a judge is
  still active.**
- A prior run linked Judge Fuentes (N.D. Ill.) to a broken URL and
  fabricated a quote about AI disclosure. The actual standing order
  PDF references the Illinois Supreme Court AI policy, which says
  "Disclosure of AI use should not be required in a pleading." The
  correct category is `permitted_with_caution`, not
  `disclosure_required`. **Always follow cross-references.**

**The generalized rules from these errors:**
1. **Searchable-link standard:** open the dashboard link → Ctrl+F
   "artificial intelligence" → the policy text must be there.
2. **Drill into PDFs:** never stop at a landing page if the policy
   is in a linked PDF. Set `source_pdf` to the direct PDF URL.
3. **Read before categorizing:** the category comes from the operative
   language in the document, not the title, not an aggregator.
4. **Verify URLs load:** if a URL 404s, the entry is broken.
5. **Check active vs. senior status:** judges move; URLs break.
6. **Follow cross-references:** if an order references an external
   policy, fetch that policy too and categorize the combined effect.

### Phase 3: State courts

The state-court universe has no clean equivalent to the Wikipedia
federal judge rosters, so state items are added to the queue by signal
rather than by enumeration:

1. **State supreme courts (all 50)** — add a `court_level` queue item
   for each. Fetch the court's rules or administrative orders page
   and search for AI policy.
2. **Large-state trial courts** — CA, NY, TX, FL, IL, PA, OH, GA, NC,
   MI. Add queue items for state-wide rules and notable local trial-
   court orders.
3. **Aggregator-flagged state entries** — state judges or courts
   surfaced during the Phase 1 aggregator sweep.

Useful searches:
- `state supreme court "artificial intelligence" order OR rule`
- `[state] court "generative AI" standing order OR local rule`
- `state bar "artificial intelligence" ethics opinion` (for
  cross-references; do not log ethics opinions as rules)

### Phase 4: Write and finalize (every run)

1. **Write entries in batches** and run `python scripts/validate.py`
   after each batch.
2. Update `data/discovery_queue.json::last_updated` and save.
3. When all queue items reach `completed`:
   - Set `discovery_queue.json::pass_status: "pass_complete"`.
   - Set `rules.json::discovery_pass_completed: true` (if not
     already).
   - On the *next* run, reset all items to `pending` and bump
     `pass_number` to begin the next verification cycle.
4. Do the news sweep (see below).
5. Write `transcripts/runs/<UTC-date>-discovery.md` summarizing: how
   many queue items processed, how many rules added/updated, any
   taxonomy questions raised.

**Quality bar:** Every entry must have (a) a `source_url` or
`source_pdf` pointing to the court's own website, and (b) a `summary`
that quotes or accurately paraphrases the actual order text. If you
cannot verify an entry at the court's website, include it with
`category_confidence: "low"`, `last_verified: null`, and a plain
(non-quoted) summary.

---

## Incremental Update

Goal: find what's new or changed since the last run, and verify the
existing dataset still reflects reality.

Steps:

1. Read `data/rules.json::last_updated` to find the timestamp of the
   previous run. Your "since" window is from that timestamp through today.
2. **Roster check against Wikipedia.** Fetch the two Wikipedia lists
   (district judges, circuit judges) and compare against the judges
   named in `rules.json`. For any tracked judge who is no longer on the
   list (retired, deceased, elevated), verify at the court's own site
   and **delete the entry** from `rules.json` if the standing order
   is no longer in effect. For any judge newly appointed to a
   court without a court-wide AI rule, add them to the Phase 3
   candidate pool for this run.
3. Search for orders issued, amended, or withdrawn in the "since" window.
   Useful queries: same as discovery pass but scoped to recent dates.
4. For each candidate, fetch the primary source and either:
   - **Add** a new entry (if it's a new order),
   - **Update** an existing entry (if the order was modified — bump
     `last_verified` and adjust fields), or
   - **Mark superseded** if an order was withdrawn or replaced.
5. Re-verify a sampled subset (10–20%) of existing entries with
   `last_verified` older than 90 days. Update `last_verified` if the URL
   still resolves and the order is unchanged.
6. Update `last_updated` to today's date.
7. Run validation (`python scripts/validate.py`).
8. Write `transcripts/runs/<UTC-date>-incremental.md` summarizing changes
   in 5–10 lines.

---

## Honesty & guardrails

- **No source = no entry.** If you cannot find the AI policy at the
  court's own website (either as HTML text or a linked PDF), do NOT
  create an entry. The validator will reject any entry where both
  `source_url` and `source_pdf` are null. Don't create entries from
  aggregator descriptions alone.
- **Withdrawn entries must be deleted.** If a judge has left the bench
  or an order is no longer in effect, remove the entry from
  `rules.json` entirely. Do not set `superseded_by` and leave it in
  the file — the validator rejects entries with `superseded_by` set.
- **Never fabricate quotes.** The `summary` field should contain a
  **direct quoted excerpt** from the actual order text. If you cannot
  access the order text, write a plain-English summary instead and do
  NOT wrap it in quotation marks. The dashboard renders text starting
  with `"` as an italic blockquote — only use quotation marks when
  genuinely quoting the order.
- **Summaries must come from the primary source.** Do not use language
  like "described as," "considered one of," or "according to" — those
  phrases indicate you took the description from a secondary source
  (law-firm tracker, press article). The validator rejects these.
- **Never silently change category slugs.** If the taxonomy is wrong,
  surface that in `taxonomy_review.md` and stop.
- **Be cautious with PDFs.** Many court PDFs are behind redirects or
  CAPTCHAs. You may attempt to fetch a PDF if it is directly
  accessible. If a fetch fails or produces an API error, **do not
  retry or force it** — just record the URL in `source_pdf` and read
  what you can from the judge's HTML page. If you can't read the
  order text at all, do NOT create the entry (no source = no entry).
- **Idempotent.** Running this prompt twice in a row should not create
  duplicates. Use `id` as the primary key.

---

## News Sweep (every run)

In addition to the rules work, each run should refresh `data/news.json`
with reputable reporting on the topic area. This feeds the "In the news"
tab of the dashboard.

### Scope

Articles qualify if they substantively cover one of:

- A new or updated judicial standing order, general order, or local rule
  addressing generative AI.
- A reported incident of hallucinated citations, fabricated case law, or
  other AI-generated errors appearing in a filing.
- Sanctions, discipline, bar complaints, or referrals against attorneys
  for AI misuse in court.
- State or local bar association ethics opinions or practice guidance
  on AI.
- Significant scholarly analysis of judicial AI policy.
- Notable policy debate / op-eds from reputable legal press.

### Preferred sources

Reuters, AP, Bloomberg Law, Law360, ABA Journal, *Above the Law*, the
*National Law Journal*, *Law.com*, Ars Technica, the *New York Times*,
*Washington Post*, *Wall Street Journal*, and respected law-professor /
court-reporter blogs. Avoid unreliable outlets, aggregator reprints with
no original reporting, and paywalled content without a readable excerpt.

### Article schema (one per entry in `news.json::articles`)

| Field | Required | Type | Notes |
|---|---|---|---|
| `id` | yes | string | Stable, kebab-case slug. Prefer `<outlet>-<topic>-<YYYY-MM-DD>`. |
| `title` | yes | string | Article headline. |
| `publication` | yes | string | The outlet. |
| `author` | recommended | string\|null | |
| `url` | yes | string | Canonical URL. |
| `published_date` | yes | string | ISO date `YYYY-MM-DD`. |
| `date_added` | yes | string | ISO date when you added it to the dataset. |
| `summary` | yes | string | 1–3 sentence plain-English summary. Neutral tone. |
| `topic_tags` | yes | string[] | Subset of the slugs in `tag_vocabulary`. |
| `related_rule_ids` | recommended | string[] | `id`s from `rules.json` if the article is about a specific tracked rule. |

### Rules of the sweep

1. **Search window** — only search for articles published in the **last
   7 days**. Do not go further back.
2. **Target exactly 10 articles from the past 7 days.** The goal is
   that the news tab always shows 10 fresh, recent articles. Search
   until you find 10 qualifying articles from the past week, or until
   you have exhausted the available coverage — whichever comes first.
3. **Drop stale articles** — before adding new ones, remove any
   existing articles whose `published_date` is older than 7 days,
   **unless** `related_rule_ids` is non-empty (those stay as long as
   the linked rule is tracked).
4. **Dedupe by URL** — if an article's URL already appears in
   `articles[]`, skip it.
5. **Total cap** — keep `articles[]` at ≤ 150 entries. If you're over,
   drop the oldest unlinked articles first.
4. **Tag vocabulary is locked** — use only the slugs defined in
   `tag_vocabulary`. If you encounter a story that doesn't fit any
   tag, tag it with the closest match and note the mismatch in the
   run transcript.
5. **No opinion injection** — summaries are descriptive, not
   evaluative. If the article is an op-ed, tag it `policy_debate` and
   let the headline signal the viewpoint.
6. **Prefer primary reporting.** If outlet A reports first and outlet
   B reprints, use A.
7. **Cross-link** to `rules.json` aggressively: if an article covers a
   specific order you've already tracked, populate `related_rule_ids`.

After the sweep, update `news.json::last_updated` and re-run
`scripts/validate.py`.

---

## URL quality gates (mandatory before commit)

The dataset has two layers of URL quality enforcement:

### Layer 1 — Pattern validator (hard CI gate)

`python scripts/validate.py` rejects any entry whose `source_url` or
`source_pdf` matches a known-bad pattern:

- **Bare domain** — e.g., `https://www.txnd.uscourts.gov/`. URLs must
  point to the specific page, not the court homepage.
- **All-judges listing pages** — e.g., `https://cand.uscourts.gov/judges/`
  or `https://www.paed.uscourts.gov/judges-info/`. URLs must point to
  the specific judge's page.
- **`source_pdf` that doesn't look like a PDF** — must contain `.pdf`,
  `/files/`, or `/file/` in the URL.

If validation fails, **the workflow will not commit your changes.**
Fix the URL or null it out (with a `provenance` note explaining why).

### Layer 2 — Content audit (run before commit)

Run `python scripts/url_audit.py` to fetch each URL and verify the
page actually contains AI policy keywords ("artificial intelligence,"
"generative AI," "ChatGPT," etc.). A URL that loads fine but has no
AI text is a generic page — wrong URL.

The CI runs the audit in `--soft` mode (CI runners often can't reach
court sites due to IP-based blocking; the agent's WebFetch tool can).
**You should run the audit yourself** during your work and act on the
results. The audit writes a report to `data/url_audit.json`:

- `status: "ok"` — URL loads and contains AI keywords. Good.
- `status: "fail"` — URL loads but is the wrong page. **Must fix.**
- `status: "blocked"` — couldn't fetch (often a CI infra issue).
  Use `WebFetch` to spot-check: if WebFetch also can't get AI text
  from the page, the URL is wrong.

### Workflow for fixing URL failures

1. Read `data/url_audit.json::results` to see which entries failed.
2. For each failed `source_url`: re-do the zoom-out workflow to find
   the actual page that contains the AI policy. Update the entry.
3. For each failed `source_pdf`: find the direct PDF link, or set
   `source_pdf: null` if no PDF exists.
4. **If you genuinely cannot find a court-hosted page that contains
   the AI policy text, set both `source_url` and `source_pdf` to
   `null`** and add a `provenance` note explaining why. The
   dashboard will show "no source available" — better than a wrong
   URL.
5. Re-run `python scripts/validate.py` and `python scripts/url_audit.py`
   until validation passes and the audit shows no `fail` entries.

---

When you're done (rules + news + URL audit passes), do
`git add -A && git commit -m "<descriptive message>"`. The workflow
handles the push.
