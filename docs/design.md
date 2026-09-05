# Design brief and implementation

Players need a rule while combat is in progress, an accessible reference for a new Brother, and an editable sheet to take to the table. Success means a rule is reachable by typing a name or opening a chapter, with a source page one click away; a character draft survives reload and exports to a real editable PDF.

## Structure and journeys

- Home introduces the Company through the battlefield artwork and three prominent destinations: rules, Brothers, and character creation. A small search form and common chapter links sit below. The homepage remains a design direction to evaluate with the user.
- Rules opens a chapter directory. A chapter link starts a clean URL, resets previous search/selection, highlights its matching navigation item, and opens the complete chapter in book order. Rules expand inline; multiple entries can remain open for comparison. Subclasses group their four features under each calling.
- Search explicitly spans all 196 records. Shared links open the actual chapter containing the selected rule, even if an old URL contains a conflicting category. Saved and recently opened rules provide quick return paths.
- Brothers opens a roster with roles, armor training, and four milestone features visible together. Its maximum width increases from 1460px to 1898px (+30%); subclass pages increase from 1340px to 1742px (+30%). Both remain fluid on smaller screens.
- Character workshop → browser draft → editable PDF or JSON backup → restore a Brother on another device.

Routes use URL hashes so refresh and shared links work on GitHub project Pages. Old `#rule/id` links still open the correct entry. The rules index has a topic rail and one full-width chapter list; native details/summary elements make inline reading keyboard accessible. The rail scrolls independently only when necessary to keep every chapter reachable on short screens. At tablet widths it becomes a select menu.

The Brother workshop retains its layout. Its shared math and PDF generator now calculate the bonuses documented in the PDF audit; compatibility guidance explains the Preview/LibreOffice export workflow.

## Visual system

Charcoal `#171815`, warm paper `#ece7d8`, tarnished gold `#c3aa79`, muted olive-gray `#b5b5a6`. Cormorant Garamond gives headings an old-world printed character; Barlow keeps UI and form labels functional. Georgia and system sans are fallbacks. Fonts load from Google Fonts; all application logic, art, and PDF dependencies are served locally.

The homepage pairs a battlefield scene with a vertical navigation list. The rules page uses a compact illustrated masthead above the reference interface. Thin rules, folio labels, and restrained arrows carry the military-manual theme. The reader uses the actual parchment image extracted from the supplied book. Colors, typefaces, and artwork are retained. The new layout is isolated in `field-desk.js` and `field-desk.css`; it does not restyle the workshop.

## Components and states

Semantic links for navigation; buttons for actions; labeled native inputs/selects; accessible checkbox groups; visible keyboard focus; skip link; live result count, save status, and export feedback. Empty search and missing routes offer recovery links. Invalid backup files report errors without replacing the draft. Search state lives in the URL. Long text wraps and PDF notes overflow onto additional pages. Reduced-motion preferences disable transitions. Text output is escaped before insertion into HTML.

At 900px the reference desk's topic rail becomes a select menu. Rules keep the same inline reading flow at every size. At 620px the roster stacks its feature columns beneath each role, and subclass progression uses a single column. The existing workshop breakpoints remain unchanged. Search inputs use 16px text on mobile to avoid zooming.

## PDF service record

Three core pages use parchment from the book, charcoal archive headers, ochre dividers, and randomized vector grime/blood confined to the outer margins. Scores and their calculated modifiers have separate fields; skill letters identify the base ability. PDF form resources and widget-local font defaults preserve editable appearances in Apple PDFKit. Source reference pages show only currently unlocked features with editable descriptions. Calculation scripts are optional enhancements; exported values and descriptions are present before any script runs.

Core formulas were checked against the [official D&D ability/proficiency rules](https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game); the campaign PDF overrides subclass save DC, training, traits and quirks. Embedded form actions follow [Adobe’s calculation-script documentation](https://opensource.adobe.com/dc-acrobat-sdk-docs/library/jsdevguide/JS_Dev_AcrobatForms.html). Apple documents [PDF form filling in Preview on iPad](https://support.apple.com/guide/ipad/ipad7b6b63ee/ipados); this design does not assume that filling support includes PDF JavaScript execution.
