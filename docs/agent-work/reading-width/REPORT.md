# Wider campaign reading columns — worker completion report

STATUS: ready_for_review

Task: `/root/reading_width` (`docs/agent-work/reading-width/PLAN.md`).
Workspace: `/Users/ryanstewart/App_dev/BlackCompany`, baseline `97b4162`, no commits or pushes made by the worker.

## Changed paths and behavior

- `campaign.css` — six `max-width` values raised, nothing else touched (token diff of every `max-width:` in the file shows exactly these six and no other change):
  - line 2 `.manuscript-body` `67ch` → `84ch`: the central column of the campaign manuscript readers (`#campaign/read/…`).
  - line 1 `.dispatch-body` (time-line dispatch posts) `68ch` → `85ch`.
  - line 8 `.scene-post .dispatch-body` (IC scene posts) `76ch` → `95ch`.
  - line 8 `.scene-reader` `1040px` → `1200px`, so the scene reader has room for the wider post and recap columns.
  - line 13 `.scene-reader .recap-body p, .scene-reader .recap-body ul` `76ch` → `95ch`.
  - line 13 `.briefing-body` (`Campaign to date`) `960px` → `1180px`.
- `index.html` — cache tag only: `campaign.css?v=summaries1` → `campaign.css?v=wider1` (line 11).
- No typography, colour, spacing, rail, or content change. `data/campaign.json`, `campaign.js`, `campaign-recaps.js`, `campaign-scenes.js` untouched; module/data cache tags left at `summaries1`.

The old caps were the binding constraint, not the containers: at 1440 the manuscript text measured 605.7px inside a 979px card (867px of usable space), so the reading column was capped by `67ch` rather than by the layout. The change raises the caps only where they bind; wherever a container is narrower, the container still decides.

The `ch` caps are computed at the container's inherited 16px, so `84ch` renders as 759.4px and `95ch` as 912.5px in both readers — the +25% figures below are measured pixels, not the nominal `ch` numbers.

## Verification

Measured with Playwright (`/Users/ryanstewart/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`) driving `Google Chrome` headless against `http://127.0.0.1:4173`, hidden scrollbars, 100% zoom. Rendered text column width = `getBoundingClientRect().width` of a paragraph inside the reading column; scripts and raw JSON are in gitignored `tmp/qa/reading-width/`.

| Reader (representative route) | 1440×1000 before → after | 1920×1080 before → after | Δ |
| --- | --- | --- | --- |
| Campaign manuscript — `#campaign/read/first-book` | 605.7 → 759.4 px | 605.7 → 759.4 px | +25.4% |
| Campaign manuscript — `#campaign/read/fourth-ur-annals` | 605.7 → 759.4 px | 605.7 → 759.4 px | +25.4% |
| Campaign manuscript — `#campaign/read/session-three` | 605.7 → 759.4 px | 605.7 → 759.4 px | +25.4% |
| IC scene post body — `#campaign/scene/crossing-caras` | 730.0 → 912.5 px | 730.0 → 912.5 px | +25.0% |
| IC scene recap body text | 429.4 → 536.8 px | 429.4 → 536.8 px | +25.0% |
| Campaign briefing (`Campaign to date`, open) | 884 → 1104 px | 884 → 1104 px | +24.9% |
| Chronological feed dispatch post | 614.7 → 768.4 px | 614.7 → 768.4 px | +25.0% |

Smaller screens keep using the available width and change only where the old cap was still binding:

| Viewport | Manuscript text | IC scene post | Briefing text | Horizontal overflow |
| --- | --- | --- | --- | --- |
| 820×1180 | 458.4 → 458.4 (container-bound) | 700.4 → 700.4 (container-bound) | 674.4 → 674.4 (container-bound) | none |
| 390×844 | 307 → 307 | 315 → 315 | 311 → 311 | none |

The one 820px change is the scene recap cap (`429.4 → 536.8`), which is one of the named restrictive caps; it still fits inside its 752.4px container.

A wider sweep (`tmp/qa/reading-width/sweep-after.json`) at 1024/1100/1280/1366/1440/1600/1920/2560 shows no horizontal overflow at any width. Manuscript text is 646.1/601/759.4/759.4/759.4/759.4/759.4/755 px, scene post 888.1/912.5/912.5/…/890 px, briefing 862.1/910/1072/1104/…/1064 px. At 1024 the manuscript gains to 646.1px (the previous 605.7px cap was still clipping available space); at 2560 the 1400px wrap still governs, as before.

| Command | Exit | Result |
| --- | --- | --- |
| `node tmp/qa/reading-width/measure.mjs` (before, then after) | 0 | JSON receipts `tmp/qa/reading-width/before.json` / `after.json`; no horizontal overflow and zero page errors in all eight viewport/route combinations. |
| `node tmp/qa/reading-width/shots.mjs` | 0 | Screenshots in `tmp/qa/reading-width/after/` (manuscript, scene reader, briefing at 1440/1920/390). |
| `node tmp/qa/reading-width/sweep.mjs` | 0 | Width sweep above, no overflow. |
| `node --test tests/campaign.test.mjs` | 0 | `tests 18 / pass 18 / fail 0` — campaign content, ordering and briefing guards unaffected. |
| `node scripts/qa-campaign.mjs` (headless Chrome, local server) | 0 | Full campaign QA pass: summaries filter and previews, provenance, revelation links, recaps, briefing, search, keyboard controls, tablet layouts, all 12 scenes, table-talk toggle, pagination, mobile navigation. |
| `npm run build` | 0 | `Static site prepared in dist/.`; `dist/index.html` carries `campaign.css?v=wider1`. |

Visually reviewed (screenshots, `tmp/qa/reading-width/after/`): the manuscript card keeps its parchment margins and the body stays centred inside it; the right contents rail, "previous/next writing" links and sticky behaviour are unchanged; the briefing text now fills its card; the IC scene page keeps the seal rail, post meta and recap panel; mobile at 390px is identical to before with no clipping.

Environment note: the workspace sandbox blocks binding 127.0.0.1:4173 and aborts headless Chrome, so the local server and every Playwright run above were executed with command-scoped escalation. `tmp/` stays gitignored; untracked personal PDFs and `output/pdf/tulip-*` files were not touched.

## Risks and limits

- Measure length grows with the width, as requested. Counting rendered characters per line (lines = paragraph height ÷ line-height, sampled over the first eight paragraphs, so the last partial line slightly compresses the numbers): manuscript 23px serif ≈ 59 → 72 chars/line; briefing 16px text ≈ 124 → 137 (beats ≈ 105 → 113); IC scene posts 17px ≈ 87 → 91. The manuscript moves to the long end of a traditional measure; the briefing was already long before this change and is now the widest text on the site. Typography and colours are untouched, and the request was an explicit ~25% widening, so this is reported rather than silently trimmed.
- Width is desktop-driven: at 2560 the page still stops at the 1400px wrap, so ultra-wide screens do not gain beyond the measured 759/912 px columns.
- No unit tests were added (reversible CSS), per the plan; the existing browser QA and build are the regression net for this change.

## Decisions for Astra

None blocking. For review: (1) whether the briefing's 1104px measure is acceptable or should be dialled back below the +25% target; (2) whether the timeline feed dispatch posts (68ch → 85ch) belong in the same scope as the manuscript/scene/briefing readers — they are included here because they are the same long-form campaign text.

Next checkpoint: none — the diff against `97b4162` (`campaign.css`, `index.html`) is complete and awaiting root review.
