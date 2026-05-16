# Clubs Research Prompt

**How to use this:**

1. Open [claude.ai](https://claude.ai) in a fresh conversation.
2. Make sure **Web Search** is turned on (toggle in the message composer).
3. Copy everything below the `---` divider and paste it as your message. Send.
4. Wait. A clubs sweep typically takes 10–20 minutes.
5. **When Claude finishes, it will have produced a single code artifact** containing a JSON array. Click the download button and save the `.json` file — e.g. your Downloads folder.
6. Come back to Claude Code in the `run-houston2` repo and say something like:

   > Here's the updated clubs research from claude.ai. The file is at `/Users/me/Downloads/clubs-research-2026-05.json`. Please validate it, diff it against `data/clubs.json`, show me the add/update/remove summary, and apply it after I confirm.

   Claude Code will validate the JSON, compute the diff, ask you about any removals, and apply updates.

**Suggested cadence:** Run once or twice a year. Clubs change slowly — URL updates, new clubs forming near new breweries or neighborhoods, occasionally a club going dormant.

---

You are a research assistant for **Run Houston**, a community race-discovery website serving the greater Houston, Texas metropolitan area. Your job is to use web search to produce an **up-to-date, exhaustive list** of running clubs active in the Houston metro area and return it as a strictly-formatted JSON array in a single downloadable code artifact.

This output will be merged into a live website's `data/clubs.json`. **The JSON you produce must be valid, parseable, and conform exactly to the schema below.** Treat the schema as a hard contract.

## Current clubs (as of your last update)

The current list has these 39 clubs. Your research must:

1. **Verify each existing club** — confirm it is still active, find an official URL if one is missing or stale, and update the description if it is meaningfully wrong.
2. **Find new clubs** — search for any active Houston-area running clubs not on this list.

Current clubs:
- Bayou City Road Runners (bcrr.org)
- Houston Striders (houstonstriders.org)
- In Flight Running (in-flight-running.myshopify.com — check for newer URL)
- Houston Harriers (runsignup.com/Club/Join/1060)
- BON Running Club (Fleet Feet Houston)
- Heights Running Club (Meetup)
- West End Running Club (runclubnearme.com — find the official FFP URL)
- Houston Area Trail Runners (hatsandmore.org)
- Sigma Running Club (sagicorsigmarun.com)
- Black Girls RUN! Houston (blackgirlsrun.com)
- Black Men Run Houston (blackmenrun.com)
- Houston Hash House Harriers (h4.org)
- FrontRunners Houston
- USA FIT Houston (usafittraining.com)
- Tornados Running Club (tornadosrunningclub.com — was null, verify)
- Runner's High Club (runclubnearme.com — find official URL)
- CityCentre Running Club (runclubnearme.com — find official or lululemon URL)
- Katy Area Running Club / KARC (katyarearunningclub.com)
- Cypress Running Club (cypressrunningclub.com)
- Hardloop Endurance (runsignup.com — find newer URL at hardloop.run)
- No Label Running Club (Katy — FFP affiliated)
- Westchase District Run Club (FFP affiliated)
- Good Times Running Co. Run Club (goodtimesrunningco.com)
- Bay Area Running Club (barchouston.com)
- Fort Bend Fit (fithouston.org/fitfortbend — was null, verify)
- Pearland Area Road Runners (goparr.com)
- Vallensons' Run Club (Pearland)
- Kemah Running Club (runclubnearme.com — find official or FFP URL)
- Texas Trackstars (txtrackstars.com)
- The Woodlands Running Club (thewoodlandsrunningclub.org — was null, verify)
- Fass Run Club (fassbrewing.com)
- Champions Running Association (championsrunning.org)
- The Goose's Acre Run Club (goosesacre.com)
- Northside Running + Tri (northsiderunning.com)
- Atascocita Titans Track Club (atascocitatitanstrackclub.com)
- Northwest Flyers Track Club (northwestflyers.org)
- Houston Fit (fithouston.org)
- FFP Running Clubs (ffprunningclubs.org)
- Houston Masters Sports Association / HMSA

## Geographic scope

"Greater Houston" is the **Houston–The Woodlands–Sugar Land MSA**, plus Galveston and state parks within ~90 minutes' drive of downtown. Include clubs based in any of:

- Inner Loop / Inner suburbs: Downtown, Heights, Midtown, Montrose, Memorial Park, Rice/West U, East End, Garden Oaks, Bellaire
- West Houston: Energy Corridor, Westchase, CityCentre, Memorial City
- Far west: Katy, Cypress, Fulshear
- Northwest: Tomball, Magnolia, Spring Branch
- North: The Woodlands, Spring, Klein, Conroe
- Northeast: Humble, Atascocita, Kingwood
- Southwest / Fort Bend: Sugar Land, Missouri City, Richmond, Stafford
- South: Pearland, Friendswood, League City
- Southeast / Bay Area: Pasadena, Clear Lake, Kemah, Seabrook, Galveston

Do NOT include clubs primarily based in Austin, San Antonio, Dallas, or College Station.

## What counts as a running club

✅ Include:
- Road running clubs
- Trail running clubs
- Track & field clubs (youth and adult)
- Training programs with a recurring social run component (USA FIT, Houston Fit, Hardloop, etc.)
- "Beer run" clubs that meet regularly and have an organized run (No Label, Fass, Sigma, etc.)
- LGBTQ+, affinity, and community-focused running clubs

❌ Skip:
- Triathlon clubs with no standalone running program
- Walking-only clubs
- Race organizers that don't operate a membership running club
- Running stores without a club program (a store that hosts a weekly group run IS eligible; a store that just sells shoes is not)
- One-time event groups or Facebook "events" pages without recurring activity
- Clubs you can only find on runclubnearme.com with no corroborating evidence of activity (runclubnearme.com aggregates stale data; treat it as a lead only, not a verification)

## Required searches

Before finalizing, run at least one search against each of the following:

1. `harra.org` — Houston Area Road Runners Association member club list
2. `ffprunningclubs.org` — FFP Running Clubs Houston affiliate list
3. `runsignup.com` Houston running clubs/organizations
4. `meetup.com` Houston running groups (filter to active)
5. "Houston running club 2024 2025" (general web search)
6. "Houston run club site:instagram.com"
7. Each suburban area: "Sugar Land running club", "The Woodlands running club", "Katy running club", "Pearland running club", "Galveston running club", "Friendswood running club", "League City running club", "Humble running club"
8. "Houston trail running club"
9. "Houston women running club" / "Houston Black running club"
10. "Houston beer run club"

If any source is unreachable, note it briefly in chat.

## Coverage floor

A complete sweep of the Houston metro typically finds **35–55 distinct clubs**. If your output has fewer than 35, you have likely missed clubs — do another search pass before producing the artifact.

## Output schema

Return a JSON array. Each element is a club object with **exactly** these fields, in this order:

```json
{
  "id": "string",          // slug: lowercase, hyphenated, no punctuation (e.g. "bayou-city-road-runners")
  "club_name": "string",   // full official name
  "location": "string",    // neighborhood or city (e.g. "Memorial Park, Houston" or "Katy")
  "website_url": "string | null",  // best official URL, or null if genuinely none exists
  "description": "string", // 1–2 sentences, factual, neutral
  "latitude": number | null,   // signed decimal degrees, 4 decimal places
  "longitude": number | null   // signed decimal degrees (W is negative), 4 decimal places
}
```

### Field rules

**`id`** — Lowercase, hyphen-separated slug. Drop apostrophes, ampersands, and punctuation. Do NOT append a year (clubs are persistent across years). Examples:
- "Bayou City Road Runners" → `"bayou-city-road-runners"`
- "BON Running Club" → `"bon-running-club"`
- "FrontRunners Houston" → `"frontrunners-houston"`

**`club_name`** — Official name as the club uses it publicly.

**`location`** — Human-readable neighborhood or city where the club primarily meets. Use the form "Neighborhood, Houston" for inner-loop clubs, or just the suburb name ("Katy", "The Woodlands") for suburban clubs.

**`website_url`** — Prefer the club's own domain over a directory aggregator (Meetup, runclubnearme.com, RunSignUp listing) when both exist. Use `null` only when no web presence can be verified. Do NOT use runclubnearme.com as a `website_url` — it is a stale aggregator. If the only presence is a Facebook page or Instagram, use that URL.

**`description`** — 1–2 sentences. State what the club does, who it's for, and where/when it typically meets if that's stable. No marketing language.

**`latitude` / `longitude`** — Geocode the club's primary meeting location (park, store, brewery, etc.) if known. Use signed decimal degrees; Houston is near `29.76, -95.37`. Leave both `null` if the meeting location is unclear or variable.

## Output format

**Your final answer is a single downloadable code artifact** containing a JSON array. Nothing else.

- **Artifact type:** code artifact, language `json`
- **Artifact title:** `clubs-research-YYYY-MM.json` (use the current year and month)
- **Artifact content:** valid JSON array, objects in alphabetical order by `club_name`. First character is `[`, last is `]`.
- **Artifact description:** one sentence — e.g. `Houston-area running clubs as of 2026-05 — 47 clubs.`

The chat body should contain only a one-sentence confirmation (club count and key sources). Do NOT paste JSON into chat in addition to the artifact.

## Reference example

```json
{
  "id": "bayou-city-road-runners",
  "club_name": "Bayou City Road Runners",
  "location": "Central Houston (Memorial Park/Rice)",
  "website_url": "https://www.bcrr.org/",
  "description": "A large social and performance-oriented club with a long history in Houston. Hosts club races, group runs, and training programs for all ability levels.",
  "latitude": 29.7599,
  "longitude": -95.4055
}
```

Now run the exhaustive research and produce the artifact.
