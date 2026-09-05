# Verification — 2026-09-05

## Calculating, weathered PDF revision

- Fourteen Node tests pass, including all 30 ability scores, every level 1–20, all 18 skill mappings and six saves, proficiency/expertise, Star-Crossed, Snake, Fast/Slow, Brittle, Lingerer, Borrowed Time, Unfortunate, blank values and zero overrides.
- The actual exported document scripts run in PDF.js’s QuickJS engine. Committed score/level changes, proficiency/expertise checkbox changes, quirks and initiative overrides produce the expected new field values.
- All 36 subclass/milestone export combinations include exactly the unlocked feature descriptions; each is visible and editable. Future features appear on a new export after the web character levels up.
- Canonical fields, widget values, saved appearance streams, calculation order and field fonts are checked with pypdf. Two exports have identical character values and different decorative content and seeds.
- Apple PDFKit renders every sample page. Editing a description, saving and reopening retains the text. Widget-local font settings correct PDFKit’s fallback to 12pt, which previously clipped multiline text. LibreOffice imports and exports the sample with visible descriptions. This is native macOS PDFKit validation, not a physical iPad test.
- Direct Acrobat UI verification was unavailable due to computer-control permissions; its AppleEvent check timed out. User-provided Acrobat screenshots exposed unfocused text rendering problems. Added explicit form font resources, field default values, widget-local appearances and a fresh sample filename. No claim of a completed Acrobat UI pass.
- The blank sheet has 3 pages / 154 fields; the Salt sample has 4 pages / 158 fields; long notes produce 6 pages / 160 fields. Of these, 41 fields have automatic calculation actions. Existing web draft, JSON backup/import and PDF download flows pass.
- Preview and LibreOffice receive fully populated values and visible source text without scripts. Live recalculation is viewer-dependent: edit the web draft and re-export to update bonuses and unlocked features in these workflows.

## Homepage and chapter navigation revision

- Eight Node tests pass: search ranking/normalization, record filtering, source ordering, route compatibility, clean chapter URLs, dataset integrity, and character calculations/import validation.
- Chrome checks exercise all nine chapter links after a search, asserting the exact expected entries, cleared search, active chapter, and no stale selected rule. Global search ignores old conflicting topic parameters; legacy and mismatched-category entry links open their actual source chapter. Empty searches, missing entries, saved persistence, and expand/collapse controls pass.
- Homepage navigation and search work. The Brothers roster measures 1898px at a 2200px viewport, a 30% increase over its previous cap. All nine callings and four-feature subclass progressions remain accessible.
- Desktop screenshots inspected at 1440px and the wide roster at 2200px. Homepage, rules, roster, subclass, and workshop checked at 390px without horizontal overflow. Mobile chapter selection clears previous searches; native rule summaries open by keyboard.
- Existing character persistence, JSON backup/import, editable PDF export, blank PDF export, and long-note export pass. Regression downloads remain in ignored QA files.
- Production build and diff whitespace checks pass. The earlier layout revision preserved the workshop; this revision updates its math and PDF compatibility guidance.

## Passed

- Audited v1.14 source: 196 unique entries, nine subclasses with levels 1/3/7/10, nine Traits, nine Quirks, five banner auras, 75 named Brothers, and page references limited to campaign pages 1–8.
- Node checks: edition-specific languages and mechanics, class features crossing page/column boundaries, Fighter proficiency boundaries, ability modifiers, Snake/Fast/Slow/Brittle behavior, and backup input validation.
- Chrome workflow checks: home search, matching results, source reader, saved rules and persistence, no-results recovery, character persistence through reload, JSON export/import roundtrip, populated and blank PDF downloads, long-note export, and absence of JavaScript page errors.
- Responsive browser checks: home, index, and character workshop at 390px without horizontal document overflow; desktop screenshots at 1440px. Visually inspected hero, parchment reader, index, and workshop layouts.
- PDF checks with pypdf: blank universal sheet has **3 pages and 154 fields**. The level-7 Salt sample has **4 pages and 158 fields**. A 6,800-character note produces a **6-page PDF with 160 fields**, preserving the complete text across continuation fields.
- For each PDF, canonical `/AcroForm/Fields` entries match the page widgets and their effective values; widgets have appearance streams. Text remains interactive rather than flattened. Rendered all blank and sample pages with Poppler, and inspected corrected reference wrapping and long-note continuation pages.
- Static production build and `git diff --check` pass.

## Deliberate limits

The site is a companion to the supplied campaign booklet, not a replacement for the core PHB. The character workshop explicitly identifies manual calculations and incomplete source procedures. The generated PDF uses Latin/Western European standard fonts. Browser storage is device-specific and one-draft; JSON backups enable multiple characters and portability. PDF edits do not sync into the web draft. No formal WCAG certification or cross-browser PDF-editor certification is claimed.

The legacy terminal utilities and v1.12 dataset are preserved for repository history and are not used by the website.
