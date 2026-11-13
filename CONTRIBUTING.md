# Contributing

Use a `codex/` feature branch (or another descriptive feature branch for human contributors) and a linked pull request. Read the assigned issue, [content guide](docs/content.md), and [release process](docs/release-process.md) before editing. Explicitly assigned work is actionable; proposals are not permission to expand scope.

For a deck, add one folder and its metadata, self-contained Studio JSON, and one or more selected static preview images. Use original or properly licensed content, credit authors, and specify its license. Never submit customer materials, secrets or private data. Submissions must be suitable for public display. Test importing the JSON in Studio; validation here only checks its basic envelope, not every editor constraint.

Run `npm run check`, `npm run package` and `git diff --check`. Review light/dark themes, desktop/mobile, keyboard focus, filters, preview navigation and download. Record actual results and remaining checks in the PR. Edit source, not generated `dist/` or `release/`. Update Unreleased and affected docs. Keep existing gallery, project and slide IDs stable when updating an entry.

New content requires maintainer review for suitability, attribution, asset permissions, readability, and import compatibility. Code is contributed under Apache-2.0; deck content retains the explicit license declared in its metadata.
