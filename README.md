# Presentation Studio Gallery

A static, searchable collection of original presentations and reusable templates made with [Presentation Studio](https://github.com/treisland/presentation-studio). [Documentation](https://docs.pres-studio.com).

Includes category/tag search, Showcase/Template filtering, light/dark/system themes, shareable detail pages, slide image previews, and Studio JSON downloads. No database, accounts, analytics, runtime dependencies, or external fonts. The six included entries are original starter templates, not real project results. Their illustrated previews summarize the slides; they are not exact Studio renderings.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npx playwright install chromium
npm run build
npm run serve
```

Open http://127.0.0.1:4173. `npm run check` builds and runs content and Chromium workflow tests. `npm run package` creates deployable files in `release/site/`. On Linux, install browser system dependencies with `npx playwright install --with-deps chromium`.

## Add a presentation

Export a Studio JSON and prepare one or more preview images of your choice, then run:

```sh
npm run add-presentation
```

The helper asks for metadata and local file paths. It creates `presentations/<permanent-id>/` without modifying project or slide IDs. Run checks, inspect the local gallery, and open a pull request. See [the content guide](docs/content.md) for the full metadata format and manual alternative.

Community members can use **Submit a deck** to open a GitHub submission form, or contribute a folder through a pull request. A maintainer reviews each submission; opening an issue does not publish it.

## Enable GitHub Pages when ready

Pages is intentionally not enabled by this implementation. The deployment job stays dormant until `PAGES_ENABLED` is set to `true`.

1. In repository **Settings → Pages**, choose **GitHub Actions** as the source.
2. Configure your custom domain and DNS there when ready.
3. In **Settings → Secrets and variables → Actions → Variables**, add `PAGES_ENABLED` with value `true`. For a custom domain, also add `PAGES_DOMAIN` containing only the hostname (for example `gallery.example.com`).
4. Run **Actions → Deploy gallery to Pages → Run workflow** on `main`.

After that, merges to `main` validate and deploy automatically. The workflow writes `CNAME` from `PAGES_DOMAIN` so deployments retain the domain. Without a domain, the site works at the standard project Pages URL. All assets are relative and details use hash routes, so no build base-path changes are required.

See [maintenance and deployment](docs/maintenance.md), [contributing](CONTRIBUTING.md), and [release process](docs/release-process.md).

## License

Code and included starter templates: Apache-2.0. Future decks declare their own license in metadata. Presentation Studio logos are brand identifiers; their inclusion does not imply a separate trademark license. Asset provenance is recorded in [NOTICE](NOTICE).
