# Gallery agent workflow

- Read CONTRIBUTING.md, docs/release-process.md and the assigned issue before edits.
- Work only on explicitly assigned scope or approved agent-ready issues.
- Use a codex/ feature branch and linked PR. Never push directly to main or force-push shared branches.
- Preserve gallery IDs, native Studio project/slide IDs, and self-contained downloads. Do not modify the Studio project format or introduce major dependencies/external services without owner approval.
- Edit source, not dist/release. Keep secrets and customer materials out of the repo.
- Run npm run check, npm run package and git diff --check. Update Unreleased/docs and record actual checks and remaining manual work in the PR.
- Do not enable Pages, configure a domain, merge, or bypass checks without applicable authorization. Follow docs/release-process.md.
