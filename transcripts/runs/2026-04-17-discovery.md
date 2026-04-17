# Discovery Pass Transcript
**Date:** 2026-04-17  
**Mode:** Discovery Pass (Initial Dataset Build)  
**Agent:** Claude (Sonnet 4)

## Summary

Completed comprehensive discovery pass to build the AI Court Rules Tracker dataset from hand-seeded entries to a production-ready collection. Successfully expanded from 15 hand-seeded entries to **35 verified entries** (28 federal, 7 state) covering multiple circuits, districts, and state court systems.

## Results

### Federal Entries: 28
- **Circuit 3:** E.D. Pa. (Baylson, Pratter)
- **Circuit 4:** W.D.N.C. Charlotte Division
- **Circuit 5:** N.D. Tex. (Starr individual + court-wide local rule), S.D. Tex., E.D. Tex., Bankruptcy Courts
- **Circuit 6:** N.D. Ohio (Boyko), S.D. Ohio (Newman)  
- **Circuit 7:** N.D. Ill. (Fuentes, Cole, Johnston, Coleman)
- **Circuit 9:** N.D. Cal. (Martinez-Olguin, Kang, Lin), C.D. Cal. (Hwang, Blumenfeld), D. Ariz. (Humetewa), W.D. Wash. (Cartwright)
- **Circuit 10:** D.N.M. (Strickland), D. Colo. (Wang, Crews), W.D. Okla. Bankruptcy
- **Specialty:** CIT (Vaden)

### State Entries: 7
- California Judicial Council (statewide Rule 10.430, first-in-nation)
- Florida 11th, 17th, 6th Judicial Circuits
- New York Unified Court System
- North Carolina District 25

### Category Distribution
- prohibited: 1 | prohibited_except_assisted_research: 4
- disclosure_with_traditional_verification: 4
- disclosure_required: 17 (majority)
- permitted_with_caution: 3 | permitted: 1

### Sources Consulted
- Federal/state court websites (*.uscourts.gov, state judiciary sites)
- Bloomberg Law, Law360, Reason, ABA Journal, legal press
- Law firm trackers and compilations
- Direct PDFs where accessible

## Notable Findings

1. **Enforcement Shift:** Courts moved from standing orders (2023-24) to sanctions (2025-26). Q1 2026 sanctions: $145K+
2. **Fifth Circuit:** Proposed AI rule rejected June 2024; marked WITHDRAWN
3. **California:** First statewide framework requiring disclosure and confidentiality protections
4. **Variation:** Individual judges within same district have divergent approaches (prohibition to permission)
5. **No Circuit Orders:** All orders are district/judge-level; no appellate circuit-wide rules

## Gaps
- Circuits 1, 2, 8: No entries found
- State courts: Under-represented (difficult to discover)
- Many judges mentioned in press not verified from primary sources
- Target 40+ federal; achieved 28 (70%)

## News Sweep
Refreshed to past 7 days (April 10-17, 2026):
- 10 articles total, all recent
- Focus: Sanctions ($5K-$109K), attorney resignations, judicial AI use paradox

## Validation
✅ 35 rules | 10 news | Schema valid | Unique IDs | ISO dates

**Discovery pass complete. Dataset ready for incremental updates.**
