# Run Houston — todo

Open items as of 2026-04-08. Updated by hand; not auto-synced with anything.
Grouped by who needs to act, not by priority. Items marked **(Me)** I can do
in a Claude Code session as soon as you say so. Items marked **(You)** need
something I can't reach from this sandbox (DNS, GitHub UI settings, real-world
content, product decisions).

---

## In flight: launching `runhouston.app`

You just landed the `CNAME` file (commit `2381b78`), which tells GitHub
Pages to serve the site at the custom domain. A handful of related steps
remain to make the launch actually go smoothly.

- [x] ~~**Confirm DNS is pointed at GitHub Pages.**~~ Confirmed 2026-04-09.
- [ ] **Flip "Enforce HTTPS"** in repo Settings → Pages once DNS has
  propagated and GitHub finishes provisioning the Let's Encrypt cert. Usually
  takes 5–30 minutes after DNS is correct. The toggle is grayed out until the
  cert is ready. **(You)**
- [ ] **Open Graph + Twitter Card meta tags** on every HTML page (`index.html`,
  `clubs.html`, `reports.html`, `report.html`, `race.html`, `about.html`,
  `404.html`). When someone shares a `runhouston.app/race.html?id=…` link in
  iMessage, Slack, Twitter, or LinkedIn today, they get an unstyled gray box.
  Adding ~6 lines per `<head>` (`og:title`, `og:description`, `og:type`,
  `og:image`, `og:url`, `twitter:card`) fixes it. Needs a 1200×630 PNG
  social-card image showing the Run Houston wordmark on the dark background.
  I can describe one in SVG you can export, or hand me a designer-made one.
  **(Me, with one decision from You on the image)**
- [x] ~~**`sitemap.xml` + `robots.txt`**~~ Done — both committed at repo root.
- [ ] **Search engine optimization (broader than OG + sitemap).** Highest-
  leverage wins for a small content site like this:
  - **JSON-LD structured data on `race.html`.** Each race detail page
    should embed a `<script type="application/ld+json">` with a
    `schema.org/Event` blob (name, startDate, location with
    PostalAddress + GeoCoordinates, eventStatus, organizer, url). This
    is what makes Google show race results as enriched cards in search
    with the date, venue, and a "register" button directly in the SERP.
    Also add `SportsClub` JSON-LD on `clubs.html` for each club.
    Generated client-side from the existing JSON data — same render
    path as the rest of the page.
  - ~~**`<link rel="canonical">`** on every page pointing at the
    `runhouston.app` URL~~ — done for index, clubs, reports, about.
    `race.html` and `report.html` skipped (need JS-injected dynamic
    canonical per `?id=`); `404.html` intentionally omitted.
  - **Per-page `<title>` and `<meta name="description">` audit.**
    Done — `race.html` and `report.html` static titles/descriptions
    upgraded from generic placeholders to descriptive copy crawlers
    can index. Still no per-instance race/recap name in the static
    title (would need a build step or pre-rendering).
  - **Heading hierarchy + alt text audit** on the few images that
    exist (the `report-photos` slot mostly).
  - **Submit the sitemap to Google Search Console** once the custom
    domain is live and the sitemap exists.
  **(Me for the markup work, You for Search Console)**
- [ ] **Test the live site after the cutover.** Hit `https://runhouston.app/`
  and every nav link, hit a `race.html?id=…` URL directly, hit a
  nonexistent URL to confirm the themed 404 shows up, share a link to
  yourself in a chat app to confirm the OG card renders. **(You)**

---

## Quick wins (no decisions, no dependencies)

- [ ] **Delete the stale `claude/refactor-run-houston-4qUO3` remote branch.**
  The only leftover from the original refactor session. GitHub UI →
  Branches → trash icon, or `git push origin --delete
  claude/refactor-run-houston-4qUO3` from your local machine. I can't do
  this from this sandbox: the GitHub MCP server I have doesn't expose a
  `delete_branch` tool, and the git proxy returns HTTP 403 on destructive
  ref pushes. **(You)**

---

## Product decisions still pending

These are all 30-second changes once you decide. They're stuck on a "what
do you actually want?" question, not on engineering effort.

- [ ] **Real race recaps vs. fictional seeds.** All 3 entries in
  `data/race_reports.json` are AI-generated news-style descriptions of
  2025 races (Chevron Houston Marathon, Brazos Bend 50, Bayou City Classic
  10K). They're factual-sounding but not from real sources. Options:
  - (a) Leave as clearly-seeded placeholder content
  - (b) Replace with real recaps as you (or someone) writes them
  - (c) Hide the Reports nav link entirely until real content exists
  **(You decide, then Me)**

- [ ] **Nav label: "Reports" vs "Recaps".** You deferred this earlier in
  the session. The nav still says "Reports" on every page, while the
  section H1, subtitle, page title, and meta description all say
  "Race news & recaps". Inconsistency on purpose for now; 15-second
  find/replace across 7 HTML files if you want consistency.
  **(You decide, then Me)**

- [ ] **Desktop default for "More filters" disclosure.** Currently the
  `<details>` filter section is collapsed on every viewport, including
  desktop. Desktop users pay a one-click cost to see distance/date chips.
  Add `open` attribute to `<details>` for default-expanded; cost is mobile
  loses the ~320px savings the disclosure was added for. There's no clean
  CSS-only "closed on mobile, open on desktop" without JS.
  **(You decide, then Me)**

---

## Deferred at your request

- [x] ~~**Race data refresh**~~ Apr–Nov 2026 merged in this session
  (45 → 107 races). Dec 2026+ window currently being researched in
  claude.ai. See `data/MERGED.md` for the full merge log.

- [ ] **Recap content workflow.** No prompt or intake path exists for
  adding race recaps. If you want regular news/recap coverage as an actual
  feature (it's currently listed in `about.html` "What's coming"), a
  parallel `prompts/race-recap-research.md` would make it a reusable
  monthly flow: "find races that happened in the last 30 days in
  Houston, write a factual news recap from verifiable sources for each."
  **(Me, when you want the feature)**

---

## Optional polish

Nice but not urgent. None of these are blocking launch.

- [ ] **Google Analytics (GA4).** Zero analytics today — no idea
  whether anyone is visiting. Add the GA4 measurement snippet to every
  HTML page so you can see traffic, top pages, geographic distribution,
  and which races people are clicking through to. Steps:
  1. Create a GA4 property in Google Analytics (`analytics.google.com`),
     get the `G-XXXXXXXXXX` measurement ID. **(You)**
  2. Add the GA4 gtag snippet (~7 lines) to the `<head>` of every HTML
     page: `index.html`, `race.html`, `clubs.html`, `reports.html`,
     `report.html`, `about.html`, `404.html`. Could be done as a single
     find/replace once you hand over the measurement ID. **(Me)**
  3. Verify in the GA4 Realtime view by visiting the live site after
     deploy. **(You)**

  Heads-up tradeoffs: GA4 sets cookies and reports to Google, so a
  privacy banner / consent management tool is technically required in
  some jurisdictions (GDPR, CCPA). For a Houston-area community site
  the practical risk is low, but worth knowing. Privacy-respecting
  alternatives exist (Plausible, Cloudflare Web Analytics, Fathom)
  if you'd rather skip the cookies and the consent banner.

- [ ] **Race search tokenizer.** Search currently ORs across `name`,
  `city`, and `description`, so typing "5k katy" matches nearly every
  race because each token alone matches a lot. Could fix with a small
  AND-style tokenizer in `assets/js/index.js` that splits the query on
  whitespace and requires every token to match somewhere. **(Me)**

- [ ] **Semantic date validation in CI.** The validator regex
  (`scripts/validate-data.py`) catches `2026-99-99` shape failures but
  not `2026-13-45` semantic-invalid dates. Could add `datetime.strptime`
  for stricter checking. Maybe 5 lines. **(Me)**

- [ ] **Mobile accessibility audit.** I've reviewed CSS and a11y
  attributes manually but never run an actual axe-core or Lighthouse
  pass against the live site, and never tested with a real screen
  reader. Worth a one-time check before announcing the custom domain.
  **(You runs the audit, Me fixes findings)**

- [ ] **HTML / CSS validation in CI.** The current CI checks JSON
  syntax, JS syntax, and the data contract, but does NOT validate HTML
  structure or CSS syntax. A typo in `index.html` or `styles.css`
  would slip through. Could add `htmlhint` and `stylelint` steps to
  the workflow. Lower-leverage than the existing checks because HTML
  rarely changes. **(Me)**

---

## Things to know but not action items

- **CI is live** as of commit `ed2938c`. Three checks on every push and
  PR to master: JSON syntax (`python3 -m json.tool`), JS syntax
  (`node --check`), and data contract (`scripts/validate-data.py`).
  GitHub Pages still auto-deploys regardless of CI status — failures
  turn the commit red and email you so you find out in minutes, not
  when a visitor reports a broken page.

- **Two layers of safety net.** Manual diff review + CI together cover
  most failure modes you'd actually hit on a personal-scale site like
  this one. The remaining gaps (HTML structure, CSS syntax, runtime JS
  behavior, live URL reachability) are documented in
  `scripts/validate-data.py`'s docstring and in the bullet above about
  HTML/CSS validation in CI.

---

_Last updated 2026-04-09 by a Claude Code session. Edit by hand or ask
Claude to update. Not auto-synced with anything._
