# GitHub repository block

`GitHubRepositoryBlock` is a public-data integration in `lib/site-builder.tsx`. Editors add a public repository URL (or `owner/repository`), and the published block reads repository metadata from GitHub’s `GET /repos/{owner}/{repo}` endpoint.

The block displays the repository description, stars, forks, open issues, watchers, primary language, last-updated month, topics, and license when available. Description, statistics, and topics can each be hidden from the Puck sidebar. The heading defaults to the live repository name, and the GitHub link always points to the repository URL returned by GitHub.

## Runtime contract

- Requests are browser-side and unauthenticated; no GitHub token or application secret is stored in site content.
- Only `github.com` repository URLs and the compact `owner/repository` form are accepted.
- Invalid, missing, private, deleted, or rate-limited repositories render an explanatory inline message rather than an empty block.
- Requests are cancelled when the URL changes or the component unmounts.
- The block uses the existing `paper`, `black`, and `lime` theme tokens and is allowed inside nested layout containers.

## Verification

Run `npm run test:github` for parser and formatting coverage. In Puck, add the block and test a valid public repository plus an invalid URL at 390px, 768px, and 1280px. Confirm the loading state, returned description/stats, external link, and error message. GitHub’s unauthenticated rate limit can affect repeated local previews.
