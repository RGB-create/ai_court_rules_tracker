# Discovery Run — 2026-04-19

## Summary
- **Run mode**: Queue processing (pass 1 in progress)
- **Time spent**: ~30 minutes
- **New rules added**: 2
- **Items pending verification**: 1
- **Queue items processed**: 11

## Results

### New Rules Added to rules.json

1. **Judge Tiffany R. Johnson (N.D. Ga.)** — `us-fed-ndga-johnson-2025-10`
   - Category: `disclosure_required`
   - Source: https://www.gand.uscourts.gov/sites/gand/files/TRJ_CVStandingOrder.pdf
   - Requires all counsel and pro se parties to disclose AI use in any capacity
   - Prohibits AI-generated caselaw (fabricated cases)
   - Restricts input of protected information into AI programs
   - Effective: 2025-10-15

2. **Judge Steve C. Jones (N.D. Ga.)** — `us-fed-ndga-scjones-2025-10`
   - Category: `permitted_with_caution`
   - Source: https://www.gand.uscourts.gov/sites/gand/files/SCJ_Standing_Case_Instructions.pdf
   - Focuses on protecting information subject to protective orders
   - Does not require affirmative disclosure of AI use
   - Sanctions for exposing protected information to AI
   - Effective: 2025-10-15

### Added to Pending Verification

1. **Judge James A. Soto (D. Ariz.)** — `us-fed-azd-soto-2024-01`
   - Candidate category: `disclosure_required`
   - Confirmed via aggregator (losey.law) and court references
   - Requires separate "Notice of Use of Artificial Intelligence"
   - Awaiting user-provided PDF URL (azd.uscourts.gov access blocked)

## Queue Items Processed

### Aggregator-Flagged Items (0 successful)
- **N.D. Ga., Judge Thomas R. Jones**: NOT FOUND (judge name may be incorrect)
- **N.D. Ga., Judge J.P. Boulee**: No AI order in standing order PDF
- **D. Ariz., Judge John C. Hinderaker**: No AI order found
- **D. Ariz., Judge James A. Soto**: FOUND (added to pending verification)
- **S.D. Fla., Judge William Matthewman**: Not processed (time constraints)

### Court-with-Judges Items (8 processed, 2 yielded rules)
- **M.D. Ga.**: No new rules (pro se guidance already in database)
- **N.D. Ga.**: 2 rules found (Johnson, Jones) ✓
- **S.D. Ga.**: No court-wide or judge-specific AI orders
- **D. Idaho**: No AI rules found
- **C.D. Ill.**: No AI rules found
- **S.D. Ill.**: No AI rules found
- **N.D. Ind.**: Not processed
- **S.D. Ind.**: Not processed

### Other Courts Checked (No AI Rules)
- **N.Y.E.D.**: No AI standing orders
- **N.Y.W.D.**: No specific AI orders (CLE program noted)
- **M.D. Fla.**: No AI orders
- **E.D. Wis.**: No AI orders

## Observations

1. **Aggregator accuracy**: Most aggregator-flagged items did not yield verifiable results. Judge names in the queue may be outdated or incorrect.

2. **N.D. Ga. productivity**: The Northern District of Georgia systematic check yielded 2 new entries, confirming that the court_with_judges approach (checking every judge on a court) is the highest-yield strategy.

3. **Arizona access issues**: azd.uscourts.gov consistently returns 403 or blocks access. Judge Soto's order is confirmed via third-party sources but requires user verification for the PDF URL.

4. **Volume challenge**: With 133 court_with_judges items remaining and low aggregator hit rate, achieving comprehensive coverage will require multiple runs focusing on systematic court-by-court enumeration.

## Next Steps

1. Continue processing court_with_judges queue items in priority order
2. Focus on courts in circuits with known AI adoption (2nd, 3rd, 5th, 9th, 11th)
3. User should verify Judge Soto's PDF URL for pending_verification entry
4. Consider refreshing aggregator-flagged judge names from recent tracker updates

## Validation
- ✓ All entries passed schema validation
- ✓ 36 total rules in database
- ⚠️ 2 warnings: N.D. Ill. judges Johnston and Coleman have null source_pdf (AI policy is on HTML page, not PDF)

