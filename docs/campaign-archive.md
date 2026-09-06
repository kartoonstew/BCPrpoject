# Campaign archive — first import

The `#campaign` page combines **7 formal writings, 2 visual records and 197 IC-channel posts** (206 records). Writings also have individual reader routes, full-text search, source downloads and contents links where the source supplies headings. The First Book contains roughly 14,300 words; none were shortened or summarized away in its reader. Short editorial descriptions and display titles help navigate the source material.

## Chronology

The mixed timeline sorts by original Discord `created_at` timestamps, displayed explicitly in UTC. It does not use file modification times or message edit times. Recaps can describe earlier events; story-date labels are separate from posting dates. The Fourth Ur-Annals is identified as a recovered historical record: its older internal dates are not presented as current-year events.

On July 3, the session-two recap (22:49 UTC), Tadpole's IC response (22:59 UTC), and the Fourth Ur-Annals upload (23:16 UTC) appear in that order. Users can isolate formal writings, IC posts, a contributor or a posting month. A search includes the complete formal-document text and complete post text, including initially folded posts.

## Sources and exclusions

Imported from the user-supplied `export-campaign_docs/messages.jsonl`, `export-ic_posting/messages.jsonl`, and their local attachments. Raw Discord exports and state files are not published. Public data contains display names, inferred character labels supported by the posts, publication/edit timestamps, message identifiers for local permalinks, content and reply relationships. No Discord author IDs, signed attachment URLs, reactions or export-state metadata are copied.

Formal writings, in upload order:

1. Year of Dust 47
2. Year 47 · Part II
3. The Annals of the Black Company — The First Book
4. Annals Summary — Captain's Briefing
5. BC S2 Quick Recap
6. The Fourth Ur-Annals
7. S3 Preamble — The Road to Gregor's Ditch

The Session 1 travel map and 44-page image-gallery PDF have their own chronological entries. All six IC illustration attachments remain attached to their original posts and load lazily. Original DOCX files and gallery/map assets are available locally from the site.

Excluded from the documents archive as requested: `Herbie_OB_Narrative.pdf` and `Fighter_Character_Sheet_5.5.pdf`, plus character-sheet commentary. The duplicate PHB and rule-version notices are already served by the Rules/Rulebook areas. Pin notifications, the old site announcement and channel housekeeping are not campaign writings. References to Herbie inside the retained writings and his actual IC post remain intact; the exclusion applies to the separate Herbie narrative document.

All 197 IC-channel posts are retained, including 24 reviewed whole-message table asides. Asides are labeled and folded; mixed IC/OOC posts retain their original wording together. Sender labels identify the player voice, not necessarily every fictional speaker within that post. Replies link to the original post, clearing filters so the target is accessible.

## Reimport

Run with the bundled Python runtime (standard library plus Poppler's `pdftoppm` for the gallery cover):

```sh
python3 scripts/import-campaign.py --docs /path/to/export-campaign_docs --ic /path/to/export-ic_posting
```

The importer uses an explicit approved document manifest and reviewed aside IDs. If new exports add writings or posts, update the manifest and count assertions intentionally. `data/campaign.json` is the generated content; `assets/campaign/` contains only retained source attachments and a gallery preview. Existing character data, rules and PDF generation are independent.

## Verification

- Source fidelity check compares every DOCX text run with the imported blocks (ignoring whitespace only) and all 197 message bodies byte-for-byte with `clean_content`.
- Node tests verify corpus counts, unique records, attachment existence, resolved reply targets, ordering, interleaving, combined filters, full-text search and escaped message formatting.
- Chrome checks verify pagination, exact July interleaving, filtering/search/reload persistence, article contents links, deep-linked posts/replies, missing-record handling, navigation from the homepage, mobile overflow and keyboard controls.
- Desktop/mobile timeline and reader screenshots were visually reviewed. Long text is readable, images are lazy-loaded, and mobile indexes start collapsed to keep the timeline accessible.
