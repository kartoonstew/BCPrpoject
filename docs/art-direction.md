# Artwork manifest

## Supplied rulebook artwork

`assets/art/rulebook-parchment.jpg` is the embedded 2560 × 1090 JPEG from page 1 of **BC PHB 1.14.pdf**, reused throughout the supplied PDF. It is extracted unchanged with Poppler `pdfimages`. It appears on rule-reader pages and the character-sheet preview. The v1.14 campaign pages contain ornamental/paper artwork rather than standalone character or battlefield illustrations.

## Original generated artwork

- Source: `assets/art/last-of-the-free.png` (1536 × 1024).
- Website version: `assets/art/last-of-the-free.webp` (compressed for delivery).
- Method: built-in `image_gen` tool, one generation; no API/CLI fallback.
- Intent: an original scene inspired by the art direction of *Myth: The Fallen Lords*, not a copy of a particular painting or an extracted game asset. The original game's [manual](https://hl.projectmagma.net/files/Gaming/%20Myth%20Series/Myth%20I%20-%20The%20Fallen%20Lords/Documents/Myth%20TFL%20Manual.pdf) was located as contextual reference; no game images are redistributed here.

### Final generation prompt

Use case: stylized-concept. Asset type: panoramic website masthead illustration, landscape 1536x1024. Primary request: The Black Company, a battered brotherhood of medieval mercenaries crossing a rain-soaked battlefield under a ragged black banner. Inspired by the dark hand-painted journal and loading-screen art of Myth: The Fallen Lords: rough ink contours, woodcut-like hatching, dry brush gouache, muted ochre and charcoal on weathered parchment, severe angular faces, grounded military fantasy, mournful grandeur. Composition: distant mass of troops and spears across the lower half; a striking helmeted veteran with battered round shield and black pennant on the right third; ruined keep, crows and pale smoke on the horizon. Left third is atmospheric dark negative space to accommodate website typography. Cinematic wide landscape framing, restrained tarnished gold light breaking through ash-grey storm clouds, burnt sienna details. Handmade illustration, visibly textured paper and brushwork, no glossy CGI, no photography, no high-fantasy glowing armor, no text or letters, no logos, no watermark. Original scene, not a recreation of a specific existing painting.

`assets/banner.svg` and the small navigation icons are code-native UI symbols made for this site.
