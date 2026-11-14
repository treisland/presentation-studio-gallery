# Content guide

Each published deck lives in `presentations/<id>/`:

```text
my-deck/
  metadata.json
  presentation.json
  01.webp
  02.webp
```

Example metadata:

```json
{
  "id": "my-deck",
  "title": "My presentation",
  "description": "A short, useful explanation of who this deck is for.",
  "category": "Workshops",
  "tags": ["facilitation", "planning"],
  "type": "template",
  "author": { "name": "Your name", "url": "https://github.com/your-name" },
  "license": "Apache-2.0",
  "added": "2026-11-13",
  "cover": "01.webp",
  "deck": "presentation.json",
  "previews": ["01.webp", "02.webp"]
}
```

Use a permanent lowercase hyphenated ID matching the folder. Categories come from `config.json`; type is `showcase` for finished work or `template` for a reusable starting point. A template can contain prompts, but label illustrative or fictional material clearly. Optional `previewNote` explains preview differences or context. The author URL is optional and must use HTTPS.

Choose one or more previews; there is no requirement to screenshot every slide. The array defines their display order, independent of slide numbers. The viewer labels them Preview 1 of N, while the actual deck slide count is derived from the JSON and shown separately. Use accurate Studio screenshots when available; PNG/WebP/JPEG are recommended. SVG is limited to passive, self-contained shapes/text; scripts, embedded HTML, styles and external references fail validation. All asset references are local filenames without subdirectories. Each file is limited to 15 MiB. Optimize images and keep videos/large media out of Git history. Only the referenced files are published.

The deck must be an editable `presentation-studio-project` with `schemaVersion: 2` or `3`, supplied as self-contained JSON or a complete Studio editable ZIP. Set `deck` to `presentation.json` or `editable-project.zip` accordingly. Existing JSON entries remain supported. The gallery labels the download by format and derives the slide count from `presentation.json` inside a ZIP. It never executes or embeds the archive's HTML.

Use an editable ZIP for any project with image, video, logo, poster, or recovery assets: JSON does not contain those bytes. The validator rejects media references in standalone JSON and missing assets in ZIPs, including assets referenced by starting state, checkpoints and undo/redo history. ZIP entries are inspected in memory without filesystem extraction; checks reject unsafe paths, duplicate names, links, encryption, unsupported compression, corrupt entries and excessive expansion (100 MiB total, 20 MiB project JSON, at most 1,000 entries). Archives must be ordinary single-disk ZIPs using stored or deflated entries; ZIP64 is unsupported. The existing 15 MiB per-download limit still applies. Included SVGs must meet the passive SVG rules above. Keep complete recovery assets intact.

Version 3 preserves background effects in current Studio exports; never downgrade an exported project. Export from Studio, preserve all project/slide IDs, and reopen the exact downloadable artifact in a fresh offline context before submission. Never reference a private local filesystem path. Build validation checks packaging and the basic project envelope, not every editor constraint or presentation claim.

The included starter decks use the existing native project envelope and original prompt content. Their SVG images are designed gallery illustrations, not screenshots; each detail page states this difference.

To update a deck, edit its existing folder, preserve its ID/URL and native IDs, replace the previews affected by the change, and open a PR. `added` is the original publication date, not the last edit date. To remove an entry, remove its folder in a reviewed PR; existing links will show a helpful not-found message.

Search includes title, description, author, category and tags. All query terms must match somewhere in those fields. Filters and sorting are stored in the query string, and detail routes use `#presentation/<id>`.

## Illustrated showcases

Approved in issue #10: `ember-and-salt`, `common-ground-realty`, and `after-dark-city-in-light`. Each catalog entry has six slides, two original illustrations and three selected playback previews. Their complete editable ZIPs are copied byte-for-byte from the reviewed submissions, preserving native identity and recovery data. The `submissions/` folders retain the original review artifacts and historical verification notes; `presentations/` is the published source of truth.
