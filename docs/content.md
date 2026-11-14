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

The deck must be an editable `presentation-studio-project` JSON with `schemaVersion: 2` or `3`. Version 3 preserves background effects in current Studio exports; never downgrade an exported project. Export it from Studio, keep all project/slide IDs intact, and verify reopening in Studio before submission. This first version supports JSON with self-contained content; editable ZIP uploads and arbitrary HTML embeds are out of scope. For decks with media, use embedded assets supported by Studio and verify reopening without network access. Never reference a private local filesystem path.

The included starter decks use the existing native project envelope and original prompt content. Their SVG images are designed gallery illustrations, not screenshots; each detail page states this difference.

To update a deck, edit its existing folder, preserve its ID/URL and native IDs, replace the previews affected by the change, and open a PR. `added` is the original publication date, not the last edit date. To remove an entry, remove its folder in a reviewed PR; existing links will show a helpful not-found message.

Search includes title, description, author, category and tags. All query terms must match somewhere in those fields. Filters and sorting are stored in the query string, and detail routes use `#presentation/<id>`.

## Illustrated submissions awaiting intake

Issue #10 stages three six-slide fictional showcases under `submissions/`: `ember-and-salt`, `common-ground-realty`, and `after-dark-city-in-light`. Open each `editable-project.zip` to retain the original illustrations. Native JSON alone references media paths and does not carry image bytes. These files are review artifacts, not published catalog entries; accepting ZIP-backed downloads requires a separately approved format decision.
