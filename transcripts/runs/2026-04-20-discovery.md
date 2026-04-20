# AI Court Rules Tracker - Discovery Run Transcript
## 2026-04-20

### Run Summary

**Mode:** Discovery Pass (queue processing)  
**Duration:** ~40 minutes  
**Queue Status:** In progress (107 pending items remaining)

### Results

**New Rules Added:** 2  
**Queue Items Processed:** 20  
**Total Rules in Database:** 47 (up from 45)

### New Entries Created

1. **us-fed-pamd-caraballo-2024-01**  
   - Court: U.S. District Court for the Middle District of Pennsylvania
   - Judge: Magistrate Judge Phillip Caraballo
   - Category: `disclosure_required`
   - Requires "Certificate of Use of Generative AI" disclosing AI use and certifying accuracy verification
   - Source: https://www.pamd.uscourts.gov/content/magistrate-judge-phillip-caraballo

2. **us-fed-cit-courtwide-2025-03**  
   - Court: U.S. Court of International Trade (court-wide policy)
   - Category: `permitted_with_caution`
   - Published: March 21, 2025
   - Guidance reminding attorneys to be mindful of confidential information and Rule 11 obligations when using AI
   - Supplements individual judge orders from Restani and Kelly
   - Source: https://www.cit.uscourts.gov/news/use-artificial-intelligence-practice-court

### Queue Items Processed

**Court-wide searches completed (no AI policies found):**

- N.D. Ind. - Searched court website and judges, no AI policies
- S.D. Ind. - No AI policies found
- N.D. Iowa - No AI policies found
- S.D. Iowa - No AI policies found
- E.D. Ky. - No AI policies found
- W.D. Ky. - No AI policies found
- E.D. La. - No AI policies found
- M.D. La. - No AI policies found
- W.D. La. - No AI policies found
- D. Me. - No AI policies found
- D. Md. - No AI policies found
- D. Mass. - No AI policies found
- E.D. Mich. - No AI policies found (only internal court admin AI chatbot)
- W.D. Mich. - No AI policies found
- D. Minn. - No AI policies found
- N.D. Miss. - No AI policies found
- S.D. Miss. - No AI policies found
- W.D. Mo. - No AI policies found

**Courts with new entries:**
- M.D. Pa. - Magistrate Judge Caraballo's requirement found
- CIT - Court-wide guidance found

### Research Notes

**Aggregator refresh findings:**
- Bloomberg Law and Law360 maintain AI tracker pages but most are paywalled
- Ropes & Gray tracker (403 error when fetching)
- Found references to several magistrate judges with AI orders:
  - Judge Phillip Caraballo (M.D. Pa.) - **ADDED**
  - Judge Susan van Keulen (N.D. Cal.) - could not locate specific order on court website
  - Judge Anthony Patti (E.D. Mich.) - February 2026 work-product privilege ruling (not a standing order)

**Courts with multiple existing entries:**
- S.D.N.Y.: 6 judges (Broderick, Ho, Ricardo, Cronan, Engelmayer, Subramanian)
- C.D. Cal.: 4 judges (Hwang, Blumenfeld, Oliver, Martínez-Olguín)
- N.D. Ill.: 4 judges (Fuentes, Johnston, Coleman, Cole)
- CIT: Now 3 entries (Restani, Kelly, plus new court-wide guidance)

### Validation Status

✅ All entries passed validation  
✅ `python scripts/validate.py` - OK: 47 rules, 17 news articles  
⚠️ 4 warnings about missing `source_pdf` for standing orders with HTML-only policies (expected)

### Discovery Queue Status

- **Total items:** 190
- **Completed:** 82 (up from 62)
- **Pending:** 107 (down from 127)
- **Pass status:** `in_progress`
- **Pass number:** 1

### Next Steps for Future Runs

1. **High-priority targets remaining:**
   - Continue processing `court_with_judges` items
   - Many federal districts still need individual judge enumeration
   - State court supreme courts (50 states)

2. **Promising leads to investigate:**
   - Judge Susan van Keulen (N.D. Cal.) - mentioned in legal commentary but order URL not found
   - Additional S.D.N.Y. judges - very active district
   - Additional C.D. Cal. judges - high volume of AI orders

3. **Courts with confirmed individual judges but not yet checked:**
   - Most Midwest and Southern district courts
   - Western district courts (except those already covered)

### Time Allocation

- Aggregator refresh: ~5 minutes
- Court searches: ~25 minutes (18 courts searched)
- New entry research and creation: ~8 minutes
- Queue updates and validation: ~2 minutes

### Notes

- Many courts do not have AI policies yet - this is expected
- Most AI rules continue to be individual judge standing orders rather than court-wide local rules
- Focus for next run should be on high-yield districts (S.D.N.Y., C.D. Cal., N.D. Cal., etc.) where individual judge enumeration will likely produce multiple new entries
