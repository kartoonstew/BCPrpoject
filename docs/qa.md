# Verification — 2026-09-05

## Passed

- Audited v1.14 source: 196 unique entries, nine subclasses with levels 1/3/7/10, nine Traits, nine Quirks, five banner auras, 75 named Brothers, and page references limited to campaign pages 1–8.
- Node checks: edition-specific languages and mechanics, class features crossing page/column boundaries, Fighter proficiency boundaries, ability modifiers, Snake/Fast/Slow/Brittle behavior, and backup input validation.
- Chrome workflow checks: home search, matching results, source reader, saved rules and persistence, no-results recovery, character persistence through reload, JSON export/import roundtrip, populated and blank PDF downloads, long-note export, and absence of JavaScript page errors.
- Responsive browser checks: home, index, and character workshop at 390px without horizontal document overflow; desktop screenshots at 1440px. Visually inspected hero, parchment reader, index, and workshop layouts.
- PDF checks with pypdf: blank universal sheet has **3 pages and 97 editable fields**. The level-7 Salt sample has **4 pages and 101 fields**. A 6,800-character note produces a **6-page PDF with 103 fields**, preserving the complete text across continuation fields.
- For each PDF, canonical `/AcroForm/Fields` entries match the page widgets and their effective values; widgets have appearance streams. Text remains interactive rather than flattened. Rendered all blank and sample pages with Poppler, and inspected corrected reference wrapping and long-note continuation pages.
- Static production build and `git diff --check` pass.

## Deliberate limits

The site is a companion to the supplied campaign booklet, not a replacement for the core PHB. The character workshop explicitly identifies manual calculations and incomplete source procedures. The generated PDF uses Latin/Western European standard fonts. Browser storage is device-specific and one-draft; JSON backups enable multiple characters and portability. PDF edits do not sync into the web draft. No formal WCAG certification or cross-browser PDF-editor certification is claimed.

The legacy terminal utilities and v1.12 dataset are preserved for repository history and are not used by the website.
