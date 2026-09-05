# The Black Company — Field Manual

A gritty, responsive companion to **BC PHB 1.14**, with a complete searchable campaign index and a browser-based editable character-sheet PDF generator.

**Website:** https://kartoonstew.github.io/BCPrpoject/

## Features

- 196 searchable, page-cited campaign entries from pages 1–8: all nine subclasses and 36 features, traits, quirks, banner rules and auras, morale, equipment, leadership, and 75 Brothers.
- A three-pane reference desk: topic navigation, compact results, and a full rule reader in one view. Search/filter context and list position stay intact while reading; related rules and recent entries open alongside the current results.
- Full-text search, chapter filters, recommended/A–Z/source-page sorting, shareable rule links, saved rules, and keyboard search (`/`). Mobile uses a dedicated results/reader flow with a back button.
- A scan-friendly subclass roster with roles, armor training and four milestone features, plus continuous subclass progression pages.
- One universal character workshop for all nine subclasses, with unlocked feature references and trait/quirk guidance.
- Browser autosave and portable JSON backups. Import downloads a backup of the previous draft before replacement.
- Genuine editable PDF AcroForms, not a print-only HTML export. Includes abilities, saving throws, skills, HP, resources, equipment, traits, history, and full unlocked subclass/trait reference text. Long notes continue onto additional editable pages.
- The original rulebook remains downloadable, and its parchment artwork is reused. Original generated battlefield art is documented in `docs/art-direction.md`.

## Run locally

No install or frontend build dependencies are required.

```sh
npm start
# http://127.0.0.1:4173
npm test
npm run build
```

Serve over HTTP rather than opening `index.html` as a local file; the application fetches its JSON index. The production build copies an explicit list of website files into `dist/`.

GitHub Actions runs checks and publishes `dist/` to GitHub Pages on pushes to `main`. Configure Pages to use **GitHub Actions**.

## Content and source fidelity

`BC PHB 1.14.pdf` is the current authority. `data/rules.json` is the site’s edition-specific index. `data/source-pages.json` preserves the complete column-ordered source text for the eight campaign pages. Pages 9–10 are unrelated Homebrewery help and intentionally excluded. Source typos/ambiguities are retained, with separate editorial notes where they affect interpretation.

Rebuild the index with Python and `pdfplumber`:

```sh
python3 scripts/extract_rules.py
npm test
```

The importer deliberately asserts the audited source layout. A different PDF edition requires re-auditing section boundaries instead of silently guessing them. The older `BC_Compendium.json`, Python terminal tools, and v1.12 PDF remain for history; the website does **not** use that older data.

The supplied booklet references the core Fighter table, PHB equipment, Luck, chips, and death checks without reproducing all underlying rules. The site does not invent those procedures. Proficiency, ability modifiers, subclass DC, hit die, Snake initiative, and Fast/Slow speed adjustments are calculated. HP, AC, resources, conditional effects, and other bonuses/penalties are manual. Users should confirm any incomplete rules with their DM.

## PDF and privacy

`pdf-generator.js` uses the locally vendored MIT-licensed `pdf-lib` library. Character data stays in the browser. No account, backend, or API key is needed. PDF fields are editable in compatible PDF editors; PDF edits do not synchronize into the workshop. Use JSON for workshop backup/restore.

The printable blank is `output/pdf/black-company-universal-editable.pdf`. The PDF’s standard fonts cover Latin/Western European text; unsupported characters produce an export error rather than silently deleting input. JSON backups retain all text.

## Verification

`npm test` verifies index coverage, source-specific rules, page-spanning features, progression math, and backup validation. `scripts/qa-browser.mjs` verifies actual browser search, saved rules, empty results, autosave, JSON roundtrip, PDF downloads, long-text continuation, and mobile overflow. Run with a locally installed Playwright package (`PLAYWRIGHT_PATH` may point to it); `CHROME_PATH` can select an installed browser. QA outputs are ignored under `tmp/qa/`.

See `docs/qa.md` for the completed verification and `docs/design.md` for the visual system.
