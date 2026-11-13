# Release process

Issues define user outcomes, acceptance criteria, compatibility risks, and validation. Work on explicitly assigned scope or maintainer-approved agent-ready issues. Use a feature branch and link the issue in the PR. Update Unreleased and affected documentation.

Both Windows and Linux validation jobs must pass on the current PR commit before merge. Resolve review conversations and any requested changes. A maintainer merges; there is no automatic merge authority or release automation in this initial gallery. Never bypass checks or push directly to main. Repository protections are configured by the owner.

The initial package version is `0.1.0-alpha.1`. Feature PRs do not bump it. Choose versions through a separate release decision: minor for features, patch for fixes, with alpha.N / beta.N / rc.N for prerelease progression. Breaking format or storage changes need an explicit compatibility plan.

Once the owner enables GitHub Pages and sets PAGES_ENABLED=true, main commits validate and deploy automatically. Website deployment is separate from a tagged software release. No workflow creates tags or publishes GitHub releases. Domain configuration and initial Pages enablement are reserved for the owner.
