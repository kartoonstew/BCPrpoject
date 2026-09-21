# Campaign summaries — worker completion report

STATUS: ready_for_review

Task: /root/campaign_summaries (`docs/agent-work/campaign-summaries/PLAN.md`).
Workspace: `/Users/ryanstewart/App_dev/BlackCompany`, baseline `715a0b7`, no commits/pushes made by the worker.

## Changed paths and behavior

Content and data

- `data/campaign.json` — regenerated: 207 records (8 writings, 2 visual records, 197 IC posts). New `session-three` document (62 blocks, 3341 words) with `dateKind: added`, `addedAt: 2026-09-21`, no clock time. `fourth-ur-annals` re-imported in place: `published` unchanged (`2026-07-03T23:16:42.683000+00:00`), 111 blocks / 4589 words, `updatedAt: 2026-09-21`, `download` = expanded source, `originalDownload` = original filing. `captains-briefing`, `session-two`, `session-three` carry `summary: true` and `summaryOrder: 1..3`. Top-level `dateBasis` now states that supplied writings are labelled with their archive-addition date.
- `assets/campaign/session-three.docx` (new, 25,785 bytes) and `assets/campaign/fourth-ur-annals-s1-s3.docx` (new, 28,565 bytes) — bundled approved sources. `assets/campaign/fourth-ur-annals.docx` is untouched and still served as the original filing.

Importer

- `scripts/import-campaign.py` — added `SUPPLEMENTS` (supplied writings with explicit added-date provenance), `EXPANDED` (reviewed source superseding an exported copy while the export file stays bundled), `REVELATIONS` (seven reviewed contents labels), `SUMMARY_ORDER`, a `--supplied` folder (default `~/Downloads`) with fallback to the committed bundle, and a `--check` mode that rebuilds into a scratch folder, writes nothing, and compares `data/campaign.json` plus every bundled asset byte-for-byte. Assertions now require 8 writings, 3 summaries in session order, and 7 revelations.

UI

- `campaign.js` — new `Session summaries` tab beside Everything / Writings & maps / In-character posts; `filterCampaign` gained `kind: 'summaries'` and an exported `orderRecords` helper so session order is honoured in both the scene overview and the chronological feed; summary cards render a collapsed source-grounded preview and a link to the full reader; added-date records drop the clock and show "Added to the archive" in the entry stamp, day heading and header tally; the month control reads "Filed / added in" and the related line reads "Session order · Record dates in UTC" for summaries, "Oldest first · Record dates in UTC" otherwise; the document reader uses a curated contents list when a record provides one and shows original-filing vs updated-source provenance with both downloads. Data/import cache-buster moved to `summaries1`.
- `campaign-recaps.js` — new `summaryPreviews` export for the three summaries; briefing refreshed to `through: 2026-09-21` with a `throughNote` ("archive-addition date, not a Discord publishing time"), a corrected current position, six new beats (18 total) and three new threads (7 total) covering the Ditch contract, Two Tower/Ashweir/Drumford, the White Rose and Bormanz, the duel and Crispus's killing, Croaker's close, the Captain's unstated work, what the Ditch's name records, and the unnamed Catastrophe at Scales. Bormanz's fate is explicitly left open; no Catastrophe detail is invented.
- `campaign.css` — wrap for the taller archive tally, parchment-theme overrides for the summary preview disclosure, briefing note, and rail provenance.
- `index.html`, `app.js`, `campaign-scenes.js` — module/style/data cache-busting to `summaries1` so the recap module is fetched once under the new version.

Docs and tests

- `docs/campaign-archive.md`, `README.md` — counts (8 writings / 207 records), the session-summaries filter, added-date vs original-filing provenance, the expanded Fourth Ur source, reimport/`--check` usage, and the updated verification scope.
- `tests/campaign.test.mjs` — unzips DOCX files in Node (`node:zlib`) and asserts block types, paragraph text and word counts for both new sources; asserts every original Fourth Ur passage survives; seven revelation TOC targets in reading order; three-summary membership/order plus a synthetic-date `orderRecords` guard; preview length and source links; supplied-date and updated-source provenance; briefing coverage with restored beat `sources` **and** `scenes` validation, Bormanz, the Catastrophe guard, and content guards for the corrected statements (Mercy's nod, no patron-service claim, no Anatomium arrival, Sallow's Fist beat, no invented burial).
- `scripts/qa-campaign.mjs` — extended browser QA (summaries filter, previews, composition, reset, revelation links, provenance, mobile) with three new screenshots.

## Verification

| Command | Exit | Result |
| --- | --- | --- |
| `python3 scripts/import-campaign.py` (baseline, before edits) | 0 | `diff -q` against the previous `data/campaign.json`: identical — the committed archive was reproducible before this change. |
| `python3 scripts/import-campaign.py` | 0 | `Imported 207 records: 8 writings (3 session summaries), 2 visual attachments, 197 posts…` |
| `python3 scripts/import-campaign.py --check` | 0 | `Import check passed without writing: data/campaign.json and all 18 bundled assets reproduce exactly from the approved sources.` The same run is repeated with the supplied folder empty (bundled fallback) and passes. SHA-256 of `data/campaign.json` plus `assets/campaign/*` is identical before and after every check run. |
| `python3 scripts/import-campaign.py --check --ic /tmp/qa-ic-tamper` | 1 | Tampered IC body: `CHECK FAILED — nothing was written: data/campaign.json differs from a fresh import`; bundle hashes unchanged. |
| `python3 scripts/import-campaign.py --check --docs /tmp/qa-docs-bytes` | 1 | Tampered attachment bytes: `CHECK FAILED — nothing was written: assets/campaign/session-two.docx differs from the imported source bytes`; bundle hashes unchanged. |
| `npm test` | 0 | `tests 43 / pass 43 / fail 0`. New cases: DOCX paragraph fidelity, original-passage retention, seven revelations, three-summary membership/order, summary ordering under synthetic dates, preview search (`hide a lie`), provenance, briefing guards (including restored `scenes` validation), the corrected-statement guards, and the rereading-scene recap guard. |
| `npm run build` | 0 | `Static site prepared in dist/.` |
| `git diff --check` | 0 | No whitespace errors. |
| `node scripts/qa-campaign.mjs` (headless Chrome, local server on 127.0.0.1:4173) | 0 | Full campaign QA pass, including the new summaries/revelation/provenance checks. |

Source and count checks

- `session-three.docx`: 62 blocks / 3341 words, identical to the imported record after whitespace normalization (asserted in `npm test`).
- `fourth-ur-annals-s1-s3.docx`: 111 blocks / 4589 words, identical to the imported record; the 76 blocks of the original `fourth-ur-annals.docx` are all present in it (0 missing).
- Seven `REVEALED WHEN …` headings resolve to seven unique, ordered TOC targets; the reader renders 18 heading anchors and clicking each of the seven links scrolls the target heading into view (browser QA).
- Corpus totals: 207 = 8 documents + 2 attachments + 197 IC posts; no duplicate `fourth-ur-annals` id; latest entry is `session-three`.

Screenshots (gitignored `tmp/qa/`, regenerated by the QA run): `campaign-summaries-desktop.png`, `campaign-summaries-mobile.png`, `summary-preview-mobile.png`, `fourth-ur-annals-desktop.png`, plus the refreshed `campaign-desktop.png`, `annals-reader-desktop.png`, `campaign-mobile.png` and scene/tablet shots. Visually reviewed: the summaries filter reads as parchment records with a light preview panel, no horizontal overflow at 390px, and the reader shows the seven revelation labels with both downloads.

Untouched, as instructed: untracked personal PDFs (`Fighter Character Sheet 5.5.pdf`, `dick-nose-mgee-editable.pdf`) and `output/pdf/tulip-*` files were not read into the archive, modified or published. `dist/` and `tmp/` are gitignored.

## Correction pass (review round 1)

1. Source errors in `campaign-recaps.js` — the Session 3 preview and the briefing beat now read "Mercy gave/gives Twitch the nod", matching the source ("I saw Mercy give a nod to Twitch"); no text still attributes the shot to the Captain. Tests seal both.
2. Current position — no longer claims the Company still serves Soulblighter. It now states the last recorded order (World Knot to World Knot to the Anatomium, not back to camp, not looking for the Company, to go to ground until they are found), the dead factor, Mercy's promise to put the spooks in the mud, and that nothing after the Knuckle's departure is narrated. The words "Anatomium" and "arrive" are guarded so no arrival is asserted.
3. Stale framing — the road beat is renamed "The road to Gregor's Ditch". The stale "what happened there is still unknown" thread is replaced with what the recovered account answers (Sallow's Fist, the Collector's massacre at Gregor's, the burial outside the wall) plus the still-open vault rumour. A new source-grounded beat, "What the Ditch is named for", carries the same revelation. The final thread no longer invents who buried the Ditch dead; it now separates the unexplained Catastrophe at Scales from the Ditch's named dead. The `reading-chalk` scene recap stopped claiming the record leaves the Ditch unexplained: it now says the copy read in that scene left it out and points to the answered account.
4. Ordering and labels — `draw()` no longer re-sorts summaries by posting date. A single exported `orderRecords` comparator is used by `filterCampaign` and by both views, and the month/date labels were corrected to "Filed / added in" and "Session order · Record dates in UTC" (with "Oldest first · Record dates in UTC" elsewhere). A synthetic-date unit test proves session order wins over posting order, and the browser QA asserts the order and labels in the scene overview and the feed.
5. `--check` — rebuilt to be truly read-only (scratch folder, no writes), comparing both the JSON and every bundled asset byte-for-byte, with bundled fallback when the supplied folder is absent. Positive, negative-content and negative-byte runs are recorded above.

Briefing is now 18 beats / 7 threads; `docs/campaign-archive.md` and the browser QA expectations were updated with it.

## Risks and limits

- The Session 3 record has no Discord timestamp, so `published` is the archive-addition date `2026-09-21T00:00:00Z`, used only for ordering and month filtering. The UI never shows a clock for it; the briefing and docs state the distinction. Wording of that label is an editorial choice Astra may reword.
- Clearing filters resets the record-type tab to Everything (existing behaviour); the summaries tab is deliberately not sticky.
- `scripts/import-campaign.py --check` needs the Discord export (default `~/discord-export/...`); the approved DOCX may come from `--supplied` (default `~/Downloads`) or fall back to the committed bundle.
- Session ordering is enforced by comparator and unit test rather than by an authored `sortIndex` field, so a future summary must carry `summaryOrder`.

## Decisions for Astra

None blocking. For review: (1) confirm the added-date label/wording for Session 3, and whether the briefing's `through: 2026-09-21` coverage marker is preferred over a post-only marker; (2) confirm that the expanded Fourth Ur source should be the primary download with the first filing kept as `originalDownload`.

Next checkpoint: none — work is complete and awaiting root review of the diff against `715a0b7`.
