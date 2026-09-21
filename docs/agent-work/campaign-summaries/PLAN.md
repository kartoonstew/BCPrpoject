# Campaign summaries — approved implementation contract

Baseline: 715a0b7096a85627b348318526a26fc4e6c9d328. Tracked tree clean; existing untracked personal PDFs and Tulip files are unrelated and must remain untouched/unpublished.

Objective: add the supplied Session 3 recap, update the existing Fourth Ur Annals with its expanded source, and provide an efficient Session summaries filter. Preserve the gritty existing design, all original text, current routes, IC scenes, search and chronology.

One implementation bundle, one Flash writer. Root owns plan/review/integration; worker owns campaign implementation, importer, assets, tests, archive documentation and its REPORT.md. No character sheet changes, no dependencies, no commits/push from worker.

Inputs:
- /Users/ryanstewart/Downloads/S3 Summary Annals.docx
- /Users/ryanstewart/Downloads/The Fourth Ur Annals S1-S3.docx

Product decisions:
- Add “Session 3 · War in the West” as a session summary after the S3 preamble in story/session order. Its ~3341 words remain intact. No invented Discord timestamp: use explicit imported/added date provenance for this supplied file, distinguished from original publication dates.
- Update fourth-ur-annals in place (stable route); new document retains original text plus revelation headings and two Gregor’s passages. Preserve original source download/version if practical. Seven revelations get meaningful clickable TOC entries. Classify as recovered lore, not summary; preserve original filing timestamp, mark updated source separately.
- Exactly three formal session-summary records: captains-briefing, session-two, new session-three. Add an accessible Session summaries filter alongside existing filters without losing current categories. Show summaries in session order. Search/contributor/month must compose correctly and clear/empty states work.
- Each summary offers a concise source-grounded preview and full-account reader. Existing scene recaps and campaign briefing are separate reading aids, not duplicate source records.
- Refresh campaign-to-date overview to include S3's developments; retain unresolved Bormanz fate, avoid inventing Catastrophe details (source names aftermath but does not narrate catastrophe itself). Existing IC scene summaries need only updates where contradicted or coverage affected; don't invent new IC scenes.
- Expected totals: 8 formal writings, 2 visual records, 197 IC posts, 207 total. Existing 12 IC scenes retained.
- Importer must reproducibly retain additions, not drop them next export import. Bundle new DOCX originals locally like existing assets; do not publish unrelated files.

Acceptance: exact normalized paragraph fidelity for new sources; existing historical passages retained; correct three-summary membership/count; no duplicate Fourth Ur; seven revelation links scroll correctly; old readers still work; combined filters/search/reset work; desktop and narrow mobile UI readable; source dates honestly labelled. Run npm test and focused browser QA; provide command outcomes and screenshots plus source/count checks in REPORT.md.

Root reviews actual diff/new files against baseline, returns one consolidated correction if needed, then commits/pushes accepted changes under standing user authorization and verifies Pages deployment.
