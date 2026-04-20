# Discovery Run: 2026-04-20

## Summary
- **Mode**: Discovery queue processing (127 pending `court_with_judges` items)
- **Rules added**: 3 new federal judge AI standing orders
- **Time invested**: ~30 minutes of active research and verification
- **Strategy**: Aggregator refresh + targeted judge searches + legal article mining

## New Rules Added

### 1. Jeffrey N. Cole (N.D. Ill.)
- **ID**: `us-fed-ndil-cole-2023-08`
- **Category**: `disclosure_required`
- **Key requirement**: Disclosure required for AI used in **both research AND drafting** — broader than most orders
- **Source**: Judge's case procedures page on ilnd.uscourts.gov
- **Note**: Magistrate Judge; order cautions that AI use doesn't excuse Rule 11 obligations

### 2. Arun Subramanian (S.D.N.Y.)
- **ID**: `us-fed-nysd-subramanian-2023-08`
- **Category**: `permitted_with_caution`
- **Key requirement**: "Use of ChatGPT or other such tools is not prohibited, but counsel must at all times personally confirm for themselves the accuracy of any research conducted by these means"
- **Source**: Individual Practices in Civil Cases PDF (revised March 14, 2025)
- **Note**: Minimally restrictive approach — no affirmative disclosure requirement, relies on existing Rule 11

### 3. Kai N. Scott (E.D. Pa.)
- **ID**: `us-fed-edpa-scott-2025-03`
- **Category**: `disclosure_required`
- **Key requirement**: Must disclose AI use for legal citations, identify specific AI program used, and certify accuracy
- **Effective date**: March 3, 2025
- **Source**: https://www.paed.uscourts.gov/sites/paed/files/documents/procedures/scopol.pdf
- **Note**: Judge confirmed to E.D. Pa. in 2022; has sanctioned attorneys for citing hallucinated cases

## Research Process

### Aggregator Refresh (Phase 1.5)
Attempted to access:
- Ropes & Gray AI Court Order Tracker → 403 error
- Baker Hostetler tracker → no indexed results
- Bloomberg Law tracker → 404 error on WebFetch

Successfully mined:
- Legal news articles from Law360, Bloomberg Law Analysis
- Academic and bar association compilations

### Judge Identification
Found references to multiple judges via web search:
- **Verified and added**: Cole, Subramanian, Scott
- **Mentioned but not findable**: John L. Kane (D. Colo.), José R. Arteaga (E.D. Pa. - magistrate), James L. Graham (S.D. Ohio), Fred W. Slaughter (C.D. Cal.)
- **Already in database**: Kobayashi (D. Haw.), Palk (W.D. Okla.), Wang (D. Colo.), Garcia Marmolejo (S.D. Tex.), most S.D.N.Y. judges, N.D. Ga. judges

### Verification Challenges
- **WebFetch tool unavailable**: API errors prevented direct PDF reading
- **Court site accessibility**: Many `.uscourts.gov` domains returned no results via site: searches
- **Source confirmation**: Relied on quoted language from legal news articles and court website searches

## Queue Progress
- **Starting pending items**: 127 (all `court_with_judges` priority)
- **Items processed**: Partial court-level searches for ~15-20 courts (N.D. Ind., S.D. Ind., Iowa districts, Kansas, Kentucky districts, Louisiana districts, Massachusetts, Michigan districts, etc.)
- **Result**: Most courts searched returned no AI orders; focused shifted to targeted judge searches from legal article citations

## Quality Notes
- All three new entries include **verbatim key language** quoted from search results about the actual orders
- All entries have **source_url** pointing to judge-specific pages (not court homepages or all-judges listings)
- All entries cite **provenance** explaining discovery method and date
- Cole entry notes source_pdf is null because AI policy is on HTML page (case procedures dropdown section)
- Scott entry has direct PDF link to procedures document

## Known Gaps / Future Work
1. **Judges mentioned but not verified**:
   - John L. Kane (D. Colo.) — search found mentions but no accessible standing order
   - José R. Arteaga (E.D. Pa., magistrate) — mentioned in May 2025 article but no findable order
   - James L. Graham (S.D. Ohio) — mentioned as having AI order but not locatable
   - Fred W. Slaughter (C.D. Cal.) — mentioned in aggregator summary but no AI order found on court site

2. **Bankruptcy court general orders**: Search results mentioned W.D. Okla. Bankruptcy Court and N.D. Tex. Bankruptcy Court AI orders, but court sites didn't return results

3. **D.C. District judges**: No AI orders found for Contreras, Chutkan, or Reyes despite searching

## Validation
- ✅ `python scripts/validate.py` passes with 45 rules, 17 news articles
- ⚠️  3 existing entries have warnings (Johnston, Coleman, Cole) about null source_pdf for standing orders — all three have AI policies on HTML pages (dropdowns or embedded text), not separate PDFs

## Next Run Recommendations
1. **Continue court_with_judges queue**: 127 items remain pending; prioritize large districts (E.D. Mich., W.D. Mich., D. Mass., D. Md., Minn., Miss., Mo. districts, etc.)
2. **Individual judge enumeration**: For courts like E.D. Pa., S.D.N.Y., N.D. Cal., C.D. Cal. that have many individual orders, systematically check every active judge
3. **Bankruptcy courts**: Attempt direct visits to W.D. Okla. and N.D. Tex. bankruptcy court websites
4. **State courts**: Begin Florida state trial courts (already have 11th and 17th circuits), Texas state courts, other large-state trial courts

## Token Budget
- Used: ~107k / 200k tokens
- Remaining: ~93k tokens
- Note: WebFetch failures and extensive web searches consumed more tokens than planned; future runs should use more targeted searches

---
**Total rules in database**: 45 (was 42)  
**Run duration**: ~45 minutes  
**Commit**: Ready for commit with 3 new entries
