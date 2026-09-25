# Daily news update flow
master is protected. Nothing can be pushed straight to it. Every change, including daily news, goes through a pull request that merges only after the `check` and `link-qa` CI jobs pass.

Daily news steps:
1. Create a branch named `news/YYYY-MM-DD` (the run date, Central time) from the latest master.
2. Commit the data/news.json change (and any cache-bust bump) to that branch.
3. Open a PR to master. If it opens as a draft, mark it ready (`gh pr ready <N>`).
4. Turn on auto-merge: `gh pr merge <N> --auto --merge --delete-branch`.
5. GitHub merges it when `check` and `link-qa` pass. On PRs, link-qa checks only the news items that changed, so it usually finishes in a minute or two. GitHub Pages deploys about a minute after the merge.
6. If a check fails, the PR stays open and nothing deploys. Fix the link (the article's own page, never a homepage or listing) or add a reviewed exception in data/link-review.json with a note, then push to the same branch.
