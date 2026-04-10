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
- [x] ~~**Flip "Enforce HTTPS"**~~ Done 2026-04-09 via Cloudflare.
  GitHub's toggle stayed grayed out because runhouston.app is proxied
  through Cloudflare (orange cloud), so Let's Encrypt's HTTP-01
  challenge can't reach GitHub Pages. Worked around by enabling
  Cloudflare → SSL/TLS → Edge Certificates → **Always Use HTTPS**.
  `curl -sI http://runhouston.app/` now returns 301 → https.
- [x] ~~**Open Graph + Twitter Card meta tags**~~ Done 2026-04-09. All 7
  HTML pages have og:title/description/image/url/type/site_name and
  twitter:card=summary_large_image. `social-card.svg` (dark bg, red
  HOUSTON wordmark) committed alongside a 1200×630 PNG export.
- [x] ~~**`sitemap.xml` + `robots.txt`**~~ Done — both committed at repo root.
- [ ] **Search engine optimization (broader than OG + sitemap).** Highest-
  leverage wins for a small content site like this:
  - ~~**JSON-LD structured data on `race.html` and `clubs.html`**~~
    Done 2026-04-09. `race.js` injects a `schema.org/Event` blob per
    race; `clubs.js` injects a `@graph` of `SportsClub` nodes.
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
  - ~~**Submit the sitemap to Google Search Console**~~ Done 2026-04-09.
  **(Me for the markup work, You for Search Console)**
- [x] ~~**Test the live site after the cutover.**~~ Done 2026-04-09.

---

## Quick wins (no decisions, no dependencies)

- [x] ~~**Delete stale remote branches**~~ Done 2026-04-09.
  `claude/refactor-run-houston-4qUO3` and `mvp1` both deleted. Only
  `master` remains.

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

- [x] ~~**Race data refresh**~~ Through Jan 2027 merged. Live count:
  120 races. See `data/MERGED.md` for the full merge log. Future
  merges should use `scripts/merge-races.py PATH --apply` (added
  2026-04-09; auto-canonicalizes distance abbreviations and skips
  no-op updates so dig-deeper passes are idempotent).

- [x] ~~**Recap content workflow.**~~ Done 2026-04-09.
  `prompts/race-recap-research.md` exists, hardened with the same
  coverage-floor / required-searches / 7-pass / anchor-race machinery
  as the upcoming-races prompt. First sweep merged 3 real recaps for
  the 2026-04-04 weekend (Yuri's Fun Run, green6.2, Running With My
  PEEPS). The 2 fictional placeholders (Brazos Bend, Bayou City) were
  dropped; the Chevron Houston Marathon recap is retained.

---

## Optional polish

Nice but not urgent. None of these are blocking launch.

- [x] ~~**Google Analytics (GA4).**~~ Done 2026-04-09. Property
  `G-0HSJBPL4J0` wired into every HTML page via gtag.js. GA4 reports
  may take 24-48 hours to populate; Realtime view works immediately.

- [x] ~~**Race search tokenizer.**~~ Done 2026-04-09. `assets/js/index.js`
  now splits the query on whitespace and requires every token to match
  somewhere in name/city/description (case-insensitive). Single-word
  queries behave the same as before; multi-word queries like "5k katy"
  now actually return 5Ks in Katy.

- [x] ~~**Semantic date validation in CI.**~~ Done 2026-04-09.
  `scripts/validate-data.py` now does a `datetime.strptime` round-trip
  on race.date and race_reports.race_date to reject 2026-13-45,
  2026-02-30, etc.

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

_Last updated 2026-04-09 (evening) by a Claude Code session. Edit by hand or ask
Claude to update. Not auto-synced with anything._
