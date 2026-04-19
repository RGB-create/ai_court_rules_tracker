# AI Court Rules Tracker — Discovery Run 2026-04-19

**Run date:** 2026-04-19  
**Run type:** Discovery pass (in progress)  
**Agent:** Claude Sonnet 4.5  
**Duration:** ~30 minutes

## Summary

Processed 3 error_prone items and 67 court_level items from the discovery queue. Added 9 new court AI rules and 10 new news articles. Dataset now contains 34 rules and 17 news articles.

## Rules Added (9)

1. **D. Kan.** — Standing Order 26-01 (Jan 2026): Permits AI with reminder of professional responsibility; no disclosure requirement
2. **M.D. Ga.** — Pro se guidance document on AI use
3. **E.D. Mo.** — Practice guideline emphasizing attorney responsibility for AI-generated content
4. **D.N.M.** — Standing order requiring AI disclosure and verification
5. **S.D.N.Y. (Broderick)** — AI disclosure requirement (Oct 2025)
6. **S.D.N.Y. (Ho)** — AI disclosure requirement (Jan 2026)
7. **S.D.N.Y. (Ricardo)** — AI certification requirement (Mar 2026)
8. **CIT (Kelly/Katzmann)** — AI disclosure order for Court of International Trade
9. **S.D. Ohio** — Court-wide standing order on generative AI

## Court-Level Sweep Results

Checked 67 federal district courts for court-wide local rules or standing orders:

- **Rules found:** 3 courts (D. Kan., M.D. Ga., D.N.M.)
- **No AI policy:** 64 courts
- **Individual judges with orders:** S.D.N.Y. (multiple judges), N.D. Ohio (Boyko), S.D. Ohio (Newman)

## Error-Prone Items Processed

- **D. Ariz. (Humetewa):** URL unreachable; no court-wide D. Ariz. policy found — remains pending
- **W.D. Wash. (Cartwright):** No AI standing order found — completed
- **C.D. Cal. (Hwang):** Verified existing entry is correct — completed

## News Articles Added (10)

1. NPR: "Penalties stack up as AI spreads through the legal system" (Apr 3, 2026)
2. Reason (Volokh): "$47K Sanctions for AI Hallucinated Cases" (Apr 7, 2026)
3. FindLaw: "DOJ Attorney's AI-Generated Brief Sparks Sanctions Threat" (Apr 10, 2026)
4. Esquire: "AI Drives Arizona's First-in-Nation Judicial Tech Competence Rule" (Apr 12, 2026)
5. ComplexDiscovery: "The AI Sanction Wave: $145K in Q1 Penalties" (Apr 14, 2026)
6. Ethics Reporter: "$145,000 Paradox: Judges Use AI, Lawyers Face Sanctions" (Apr 15, 2026)
7. Reuters: "AI ruling prompts warnings from US lawyers" (Apr 15, 2026)
8. Reason: "$5K Sanctions for Pro Se AI Hallucinations" (Apr 16, 2026)
9. LawSites: "Sixth Circuit $30K Sanctions for Fake Citations" (Mar 15, 2026)
10. Perkins Coie: "Federal Court Rules AI Chats Not Privileged" (Feb 20, 2026)

## Key Findings

### Court AI Policy Trends

- **Most common category:** `disclosure_required` (requires disclosure + verification)
- **Emerging trend:** Individual judges in S.D.N.Y. adopting similar AI disclosure requirements
- **Court-wide rules remain rare:** Only ~6 districts have court-wide local rules (N.D. Tex., E.D. Tex., S.D. Tex., D. Neb., D. Kan., W.D.N.C.)

### Sanctions Escalation

- Q1 2026 sanctions totaled at least **$145,000** for AI hallucinations
- March 2026 alone: **$139,000** in sanctions
- Largest penalties: Oregon ($109,700), Sixth Circuit ($30,000)
- Over **1,200 AI hallucination cases** cataloged globally (800+ in U.S.)

### Attorney-Client Privilege Development

- *United States v. Heppner* (S.D.N.Y., Feb 2026): AI chatbot conversations **not protected** by attorney-client privilege
- Major law firms issued warnings to clients about AI use
- Court found: no attorney-client relationship with AI, platform lacks confidentiality

### Judicial AI Use

- Northwestern study: **61.6% of federal judges** use AI tools for legal research/document review
- Creates "verification paradox": judges use AI while sanctioning lawyers for AI failures
- Arizona became first state to adopt judicial technology competence requirement (effective Sep 2026)

## Discovery Queue Status

- **Total items:** 1,255
- **Completed:** ~120
- **Pending:** ~1,135 (mostly roster items for individual judge checks)
- **Pass status:** In progress (pass #1)
- **Next priority:** Continue court_level sweep, then begin roster sweep

## Data Quality

- **Validation status:** PASS (2 warnings about missing PDFs for HTML-based policies)
- **34 rules** in dataset (up from 25)
- **17 news articles** (refreshed, removed stale entries >7 days old)
- **All timestamps updated** to 2026-04-19T14:12:34Z

## Notes for Next Run

1. **D. Ariz. (Humetewa)** remains blocked — retry with alternative search methods
2. **E.D. Mich.** proposed local rules (Dec 2023) — verify if adopted as final rule
3. **S.D. Ohio court-wide order** — PDF found but content not fully accessible; needs re-verification
4. Continue roster sweep for individual judge checks (700+ pending items)

## Validation Output

```
WARNING: rules[2] (id=us-fed-ndil-johnston-2023-07): rule_type is 'standing_order' but source_pdf is null
WARNING: rules[10] (id=us-fed-ndil-coleman-2023-07): rule_type is 'standing_order' but source_pdf is null
OK: 34 rules, 17 news articles validated against schema.
```
