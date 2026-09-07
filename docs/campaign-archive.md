# Campaign archive — scenes and original records

The `#campaign` page opens with **12 editorial scenes** alongside the formal records. It combines **7 formal writings, 2 visual records and 197 IC-channel posts** (206 records). Writings also have individual reader routes, full-text search, source downloads and contents links where the source supplies headings. The First Book contains roughly 14,300 words; none were shortened or summarized away in its reader. Short editorial descriptions and display titles help navigate the source material.

## Chronology

The mixed timeline sorts by original Discord `created_at` timestamps, displayed explicitly in UTC. It does not use file modification times or message edit times. Recaps can describe earlier events; story-date labels are separate from posting dates. The Fourth Ur-Annals is identified as a recovered historical record: its older internal dates are not presented as current-year events.

On July 3, the session-two recap (22:49 UTC), Tadpole's IC response (22:59 UTC), and the Fourth Ur-Annals upload (23:16 UTC) appear in that order. Users can isolate formal writings, IC posts, a contributor or a posting month. A search includes the complete formal-document text and complete post text, including table-talk posts hidden in scene readers.

## Scene browsing

`campaign-scenes.js` defines the 12 reviewed scene boundaries using stable first/last post IDs. The overview places each scene at its first posting date and shows its full date range. A scene may span later document filings; opening it interleaves those filings at their exact timestamps. The full chronological feed remains available for strict post-by-post chronology, including existing `#campaign?entry=…` links.

Each `#campaign/scene/…` reader shows full original messages, groups adjacent posts by the same contributor, and retains each post's timestamp, edit marker, images and reply link. Asides and formal filings break contributor groups. Previous/next navigation, a scene selector, and a return link avoid scrolling through the entire archive. Titles, teasers, and expanded recaps are explicitly labeled editorial; none replace original text.

Search results show matching original-post excerpts beneath the relevant scene, linking directly into the surrounding conversation. Searching also covers editorial scene titles/summaries and full document text. Contributor/month filters select scenes containing matching posts; opening a scene retains the whole conversation for context. Unassigned future posts fall back to individual entries until their scene boundaries are curated.

## Recaps and campaign briefing

`campaign-recaps.js` contains a reviewed recap for each scene: the situation, two or three key developments, and the outcome or unresolved question. Each runs roughly 110–210 words, under half the length of even the shortest source scene. Native disclosure controls on the overview cards and scene readers keep these closed until requested. Each reader also supports `?recap=1`, used by briefing links. Search includes recap text and opens a matching recap; original-message results still lead into the conversation.

Above the filters, “Campaign to date” opens an approximately 830-word briefing: current position, twelve chronological story beats, and four unresolved threads. It combines the formal campaign accounts with the IC material, with links back to the supporting records. Its scope is the complete imported archive through 25 August 2026, independent of the current filters. That is a posting-date coverage marker, not an invented in-world date.

The synthesis uses the Captain's briefing for the early campaign, the session-two recap for the intervening adventures, Chalk's historical account for the ancient war, the road interlude for the present orders, and the original scene conversations. Beliefs and unresolved questions remain attributed. In particular, the Captain's secret plan is not established, the prophecy is not decoded, and the requested transfer of the relics is not presented as completed. Where the early briefing says the book was left at Telembor, the later explicit IC accounts establish Prancer carrying it; the recap follows those later accounts. The conflicting attribution of Tadpole's amputation is not resolved by inventing a culprit.

When extending the archive, revise both the scene recaps and the briefing coverage date and ending. Recheck links, chronology, and unresolved claims against the new material; do not let a prior recap silently become the authority for new events.

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

All 197 IC-channel posts are retained, including 24 reviewed whole-message table asides. Asides are labeled and hidden by default in scene readers, with a “Show table talk” control. A direct link to an aside enables that control so the target is visible. The full feed includes asides by default and also offers a toggle; mixed IC/OOC posts retain their original wording together. Sender labels identify the player voice, not necessarily every fictional speaker within that post. Replies link to the original post, clearing filters so the target is accessible.

## Reimport

Run with the bundled Python runtime (standard library plus Poppler's `pdftoppm` for the gallery cover):

```sh
python3 scripts/import-campaign.py --docs /path/to/export-campaign_docs --ic /path/to/export-ic_posting
```

The importer uses an explicit approved document manifest and reviewed aside IDs. If new exports add writings or posts, update the manifest, scene boundaries in `campaign-scenes.js`, summaries in `campaign-recaps.js`, and count assertions intentionally. `data/campaign.json` is the generated content; `assets/campaign/` contains only retained source attachments and a gallery preview. Existing character data, rules and PDF generation are independent.

## Verification

- Source fidelity check compares every DOCX text run with the imported blocks (ignoring whitespace only) and all 197 message bodies byte-for-byte with `clean_content`.
- Node tests verify corpus counts, unique records, attachment existence, resolved reply targets, ordering, interleaving, combined filters, full-text search, escaped message formatting, exact once-only scene coverage, contributor grouping boundaries, recap coverage/reading reduction, and valid summary source links.
- Chrome checks verify recap expansion/collapse, briefing independence from filters, source links, recap search, keyboard controls, tablet overflow, every scene’s post IDs/timestamps, hidden/visible table talk, scene navigation, search links in context, pagination, exact July interleaving, filtering/search/reload persistence, article contents links, deep-linked posts/replies, missing-record handling, navigation from the homepage, mobile overflow and keyboard controls.
- Desktop/mobile timeline and reader screenshots were visually reviewed. Long text is readable, images are lazy-loaded, and mobile indexes start collapsed to keep the timeline accessible.
