# Maintenance and deployment

## Routine updates

1. Create a feature branch and link the scoped issue.
2. Add or edit presentation folders with `npm run add-presentation` or a text editor.
3. Run `npm run check` and `npm run package`; inspect the site with `npm run serve`.
4. Review the PR's validation and content rights, then merge according to the release process.

The build reads `config.json` and `presentations/`, validates metadata/assets and basic native deck structure, then writes a single `catalog.json` and copies only referenced files. The browser filters that catalog locally. There is no server-side search, login, upload endpoint, or database to maintain. Browser tests exercise both themes, system preference changes, filters, detail links, downloads, empty states, mobile width and project-path hosting. CI also saves screenshots and a deployable review artifact.

For a new category, update `config.json` and `.github/ISSUE_TEMPLATE/submit-presentation.yml` together. Header/footer URLs and visible identity live in `src/index.html`; the docs URL in `config.json` is also used by detail pages. Theme colors live in `src/styles.css`. Existing logo assets are local copies, so upstream branding changes require a reviewed update.

## Pages handoff

Follow the README steps to enable Pages and set `PAGES_ENABLED=true`. A `PAGES_DOMAIN` repository variable writes `dist/CNAME` during deployment. DNS, domain ownership and HTTPS configuration remain with the owner. The workflow never enables Pages itself. Deployment runs only after its own checks pass; PRs cannot trigger deployment. For additional enforcement, configure branch protection for both validation matrix jobs and restrict the github-pages environment to main.

To pause deployment, set `PAGES_ENABLED=false`. To recover from an incorrect deployment, revert the source change through a reviewed PR and deploy the resulting main commit. Never edit a generated artifact as the permanent fix. Re-run the Pages workflow to publish existing main after changing a domain variable.

## Growth path

`scripts/content.mjs` is the repository adapter; the client consumes the generated catalog rather than walking repository files. Later, an adapter can populate the same metadata from object storage/database records while preserving permanent presentation IDs and hash URLs. Choose that migration when submission volume or media sizes justify it. No service has been provisioned for that future path.

## Limits and remaining acceptance

Automated checks do not grant asset rights or prove every Studio import constraint. Maintainers must review licenses, import each contributed deck in the supported Studio version, and confirm media portability. Manual screen-reader and Safari/Firefox review is recommended before broad promotion. Deployment and custom-domain behavior cannot be verified until the owner enables Pages and configures DNS.
