# Design brief and implementation

Players need a rule while combat is in progress, an accessible reference for a new Brother, and an editable sheet to take to the table. Success means a rule is reachable by typing a name or opening a chapter, with a source page one click away; a character draft survives reload and exports to a real editable PDF.

## Structure and journeys — fresh reference-desk layout

- Home opens a working reference desk: topics → matching results → full rule in the adjacent pane → original PDF page.
- Search and topic filters stay in place when an entry or a related rule is opened. Browser history restores the selected entry. Saving a rule preserves the results scroll position. Recent entries provide a route back into the source material.
- Brothers opens a roster with roles, armor training, and four milestone features visible together. A subclass opens its entire progression as a continuous document with jump navigation → create a character with that subclass.
- Character workshop → browser draft → editable PDF or JSON backup → restore a Brother on another device.

Routes use URL hashes so refresh and shared links work on GitHub project Pages. Old `#rule/id` links still open the correct entry. The reference desk uses a topic rail, compact scrollable results, and a wide parchment reading pane. At tablet widths the topic rail becomes a select menu; on phones, the selected rule and results occupy separate views with an explicit back button that retains the query and restores focus.

The Brother workshop is unchanged: it groups identity, training, traits, combat, equipment, and notes, and its download actions sit above the form on mobile. Its functions, existing stylesheet, character model, PDF generator, and blank PDF were verified byte-for-byte against the previous commit.

## Visual system

Charcoal `#171815`, warm paper `#ece7d8`, tarnished gold `#c3aa79`, muted olive-gray `#b5b5a6`. Cormorant Garamond gives headings an old-world printed character; Barlow keeps UI and form labels functional. Georgia and system sans are fallbacks. Fonts load from Google Fonts; all application logic, art, and PDF dependencies are served locally.

The previous large hero and chapter-card grid are replaced by a compact illustrated masthead above the working reference interface. Thin rules, folio labels, and restrained arrows carry the military-manual theme. The reader uses the actual parchment image extracted from the supplied book. Colors, typefaces, and artwork are retained. The new layout is isolated in `field-desk.js` and `field-desk.css`; it does not restyle the workshop.

## Components and states

Semantic links for navigation; buttons for actions; labeled native inputs/selects; accessible checkbox groups; visible keyboard focus; skip link; live result count, save status, and export feedback. Empty search and missing routes offer recovery links. Invalid backup files report errors without replacing the draft. Search state lives in the URL. Long text wraps and PDF notes overflow onto additional pages. Reduced-motion preferences disable transitions. Text output is escaped before insertion into HTML.

At 900px the reference desk's topic rail becomes a select menu. At 620px results and reader use separate views, the roster stacks its feature columns beneath each role, and subclass progression uses a single column. The existing workshop breakpoints remain unchanged. Search inputs use 16px text on mobile to avoid zooming.
