# Design brief and implementation

Players need a rule while combat is in progress, an accessible reference for a new Brother, and an editable sheet to take to the table. Success means a rule is reachable by typing a name or opening a chapter, with a source page one click away; a character draft survives reload and exports to a real editable PDF.

## Structure and journeys

- Home → live search → rules index → full rule → original PDF page.
- Home → Brothers → subclass features → create a character with that subclass.
- Character workshop → browser draft → editable PDF or JSON backup → restore a Brother on another device.

Routes use URL hashes so refresh and shared links work on GitHub project Pages. The index has a chapter sidebar on desktop and a horizontally scrollable filter strip on mobile. Reading pages use a parchment article with dark related-entry navigation. The workshop groups identity, training, traits, combat, equipment, and notes; its download actions sit above the form on mobile.

## Visual system

Charcoal `#171815`, warm paper `#ece7d8`, tarnished gold `#c3aa79`, muted olive-gray `#b5b5a6`. Cormorant Garamond gives headings an old-world printed character; Barlow keeps UI and form labels functional. Georgia and system sans are fallbacks. Fonts load from Google Fonts; all application logic, art, and PDF dependencies are served locally.

The hero is an illustrated landscape with a readable text scrim. A flat six-part chapter grid, thin rules, small folio labels, and restrained arrows carry the military-manual theme. The reader uses the actual parchment image extracted from the supplied book. PDF sheets are deliberately ink-light and suitable for US Letter printing.

## Components and states

Semantic links for navigation; buttons for actions; labeled native inputs/selects; accessible checkbox groups; visible keyboard focus; skip link; live result count, save status, and export feedback. Empty search and missing routes offer recovery links. Invalid backup files report errors without replacing the draft. Search state lives in the URL. Long text wraps and PDF notes overflow onto additional pages. Reduced-motion preferences disable transitions. Text output is escaped before insertion into HTML.

At 700px the header stacks, chapter cards become two columns, filters become scrollable, and the sheet sidebar moves above the form. At 1000px the workshop compresses its ability grid from six columns to three. Forms use 16px input text on mobile to avoid zooming.
