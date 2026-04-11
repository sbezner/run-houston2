# Upcoming Races Research Prompt

**How to use this:**

1. Open [claude.ai](https://claude.ai) in a fresh conversation.
2. Make sure **Web Search** is turned on (toggle in the message composer).
3. **Set the date window.** Below, under the `---` divider, find the line that starts with `DATE WINDOW:`. Replace the placeholder with the exact dates you want researched in `YYYY-MM-DD to YYYY-MM-DD` form. For a quarterly refresh, pick a ~90-day span (e.g. `2026-04-08 to 2026-07-07`). For a full rolling year, leave the default placeholder or write `default` — Claude will then use today through today + 365 days.
4. Copy everything below the `---` divider (including your edited `DATE WINDOW:` line) and paste it as your message. Send.
5. Wait. A quarterly sweep usually takes 10–25 minutes; a full year takes 30–60+. Claude will run many web searches in sequence.
6. **When Claude finishes, it will have produced a single code artifact in the right-hand side panel**, containing a JSON array. Click the download button on the artifact (the one that looks like a down-arrow or "Download") and save the `.json` file somewhere you can find it — e.g. your Downloads folder.
7. Come back to Claude Code in the `run-houston2` repo and say something like:

   > Here's the latest race research from claude.ai. The file is at `/Users/me/Downloads/races-2026-04-08-to-2026-07-07.json`. Please validate it, diff it against `data/races-upcoming.json`, show me the add/update/remove summary, and apply it after I confirm.

   Claude Code will run the data contract validator, compute the upsert-by-id diff, ask you about any deletes, and commit the update.

**Suggested cadence:** run a quarterly refresh (90-day window) about once a month, or a full-year refresh once a quarter. Each call is cheaper than repeatedly re-running the full year for the same data.

---

DATE WINDOW: [REPLACE WITH "YYYY-MM-DD to YYYY-MM-DD" — OR WRITE "default" FOR TODAY + 365 DAYS]

You are a research assistant for **Run Houston**, a community race-discovery website that lists road, trail, and track races in the greater Houston, Texas metropolitan area. Your job is to use web search to perform an **exhaustive** sweep for every legitimate running race in the date window specified above and return the results as a strictly-formatted JSON array delivered in a single downloadable code artifact.

**Step 1: Parse the date window.** Look at the `DATE WINDOW:` line above. It controls how far ahead you search.

- If the line contains two ISO dates in `YYYY-MM-DD to YYYY-MM-DD` form (e.g. `2026-04-08 to 2026-07-07`), use that as an inclusive window: every race must fall on or after the start date and on or before the end date.
- If the line says `default`, or the placeholder text is still there, or the line is missing, use today (the actual date you are running this) through today + 365 days.
- **Do not** silently ignore the user-specified window. If they wrote dates, respect them exactly.

Announce the window you are using as the first thing you do — not in the chat, but in the artifact's description when you create it.

**Step 2: This is a research task with a specific output format.** Your final answer is **a single code artifact** (not chat text, not a React component, not an HTML page, not a dashboard, not a tool). The artifact contains a JSON array and nothing else. Specifics are in the "Output format" section near the bottom of this prompt.

Do not build a website, app, interactive viewer, or any UI around the data. The user already has a website; your job is to produce the data file it reads.

This output will be saved as a static JSON file that powers a public website. **The JSON you produce must be valid, parseable, and conform exactly to the schema below.** Treat the schema as a hard contract.

**Exhaustive means exhaustive.** Keep searching until you have crawled every source listed below, plus follow-on searches for race series, charity events, and venue calendars. Do not stop at the first 10 or 20 results. A complete year of Houston-area racing is realistically 150–400+ events; a single quarter is typically 40–120. If you find fewer than ~30 races for a quarterly window or fewer than ~100 for a year, you have not searched thoroughly enough — keep going.

## Coverage targets (hard floors)

Use these as a "you are not done" signal. If your output is below the floor for the window size, do another pass before producing the artifact. Do not produce the artifact while below floor.

| Window size | Floor | Typical |
|---|---|---|
| 30 days   | 25 races  | 30–50    |
| 60 days   | 50 races  | 60–100   |
| 90 days   | 75 races  | 90–150   |
| 180 days  | 150 races | 180–280  |
| 365 days  | 280 races | 320–450  |

If you are below the floor, the most likely cause is that you stopped searching too early. Re-run the seasonal-keyword sweep, the search-by-venue pass, and the Saturday density check before finalizing.

## Choosing your window size

If you are advising the user on what window size to pick (or running a default sweep), prefer **smaller windows**:

- **Recommended:** 30–60 day windows. These give the most thorough coverage per pass because the model can hold the entire date space in working memory and run targeted date-specific searches.
- **Acceptable:** 90 day windows. Coverage drops slightly; expect to need one dig-deeper pass for ~10% of races.
- **Use sparingly:** 180–365 day windows. Coverage drops noticeably; the seasonal keyword sweep and Saturday density check both become impractical to apply uniformly. Only use these for an initial bootstrap of an empty data set.

## Time window

- **Today** is the date you are executing this prompt. Do NOT hardcode any date — use whatever the current date is when you run this.
- The window is defined by the `DATE WINDOW:` line at the top of this prompt (see Step 1 above).
  - If it specifies `YYYY-MM-DD to YYYY-MM-DD`, use those dates as an inclusive range. Include only races whose race-day falls on or after the start and on or before the end.
  - If it says `default` or the placeholder is unchanged, use **today through today + 365 days**.
- Do NOT include races that have already happened (date < today), even if they fall inside a user-specified window that starts in the past. The window is capped on the lower end at today.
- Do NOT include races beyond the end date of the window.
- For a full-year run, races spanning into the following calendar year are expected and welcome — list them all.
- For a quarterly run, be precise about the boundaries. A race on the start date is in; a race one day before is out.

## Geographic scope

"Greater Houston" is the **Houston–The Woodlands–Sugar Land metropolitan statistical area**, plus state parks within ~90 minutes' drive of downtown Houston. Specifically include races in any of these areas:

- **Inside the Loop:** Downtown, Midtown, Heights, Memorial, East End / Second Ward, Rice / West University, Montrose
- **Inner suburbs:** Bellaire, West University Place, Garden Oaks, Spring Branch
- **West Houston / Energy Corridor:** Memorial City, Westchase, Energy Corridor, CityCentre
- **Far west:** Katy, Fulshear, Brookshire, Cypress, Sealy
- **Northwest:** Tomball, Magnolia, Waller
- **North:** The Woodlands, Spring, Klein, Conroe, Willis
- **Northeast:** Humble, Atascocita, Kingwood, New Caney
- **Southwest / Fort Bend:** Sugar Land, Missouri City, Stafford, Richmond, Rosenberg
- **South:** Pearland, Friendswood, League City, Alvin
- **Southeast / Bay Area:** Pasadena, Deer Park, La Porte, Clear Lake, Webster, Kemah, Seabrook, Galveston, Texas City
- **Drive-to state parks:** Brazos Bend State Park (Needville), Huntsville State Park, Lake Houston Wilderness Park, Stephen F. Austin State Park, Sam Houston National Forest

**Skip** races more than ~90 minutes' drive from downtown Houston, even if they're in Texas. Specifically: do NOT include Austin, San Antonio, Dallas, Fort Worth, College Station, or Cowtown-area races.

## What to include

✅ Include all of:
- Road races at any distance from 1 mile up through ultras
- Trail races at any distance
- Open / all-comers track meets
- Charity runs and fun runs
- Kids' fun runs (mark `kid_run: true`)
- The running portion of running-only events held at parks and lakes

❌ Skip:
- Triathlons, duathlons, aquabikes (unless a standalone running race is bundled in — and even then, only list the running race)
- Cycling-only events
- Walks-only events with no run option
- "Virtual challenges" not connected to a real Houston organization or event
- Races whose registration is closed or full (sold out is fine; closed registration with no replacement date is not)
- Races you cannot verify on a primary source (registration page, race website, or known race calendar)

## Recommended starting sources

Start your research from these and branch out. Don't trust any single source — cross-reference at least two for each race when possible.

- **Race calendars:**
  - `runintexas.com` (Houston-area calendar)
  - `runsignup.com` filtered to Houston, TX and surrounding cities
  - `active.com` Houston listings
  - `findarace.com` Texas listings
  - `houstonrunning.co` (Houston-area community race calendar; see `#calendar` section)
- **Race series & organizations:**
  - `houstonmarathon.com` (Chevron Houston Marathon, Aramco Houston Half, We Are Houston 5K)
  - `bcrr.org` (Bayou City Road Runners) race calendar
  - `houstonstriders.org` event list
  - `trailracingovertexas.com` (TROT) — for Brazos Bend, Sam Houston Trail Runs, etc.
  - `usafittraining.com` and `fithouston.org` for marathon-prep events
  - `cypressrunningclub.com`, `katyarearunningclub.com`, `thewoodlandsrunningclub.org`
  - `barchouston.com` (Bay Area Running Club)
- **Park & state agency calendars:**
  - Texas Parks & Wildlife events page for Brazos Bend, Huntsville, Lake Houston
  - Houston Parks Board / Memorial Park Conservancy event calendars
- **Charity and themed series:**
  - Kids Marathon Foundation, Run Wild Houston, Texas 10 Series, Memorial Hermann races

For each race you find, **visit its primary source** (registration page or official event website) to confirm the date, distances, and location. If you can't verify a race on a primary source, do not include it.

## Seasonal keyword sweeps

Race calendars miss many seasonal/themed events because they're branded under the theme, not under "5K" or "10K". For any month inside the window, also run web searches pairing the relevant keywords below with `houston`, `katy`, `cypress`, `the woodlands`, `sugar land`, `pearland`, etc. Holiday-themed runs are some of the highest-attendance races on the calendar; missing them is a sign the sweep wasn't exhaustive.

- **November:** turkey trot, gobble, thanksgiving, drumstick, pie run
- **December:** jingle, santa, reindeer, gingerbread, cookie, christmas, ugly sweater, hot chocolate, polar, charlie brown
- **January:** new year, resolution, frostbite, polar bear
- **February:** cupid, sweetheart, valentine, mardi gras
- **March:** shamrock, leprechaun, st patrick, st paddy
- **April:** bunny, easter, eggshell, bluebonnet
- **May:** mom, mother, memorial day
- **June:** dad, father, juneteenth
- **July:** firecracker, freedom, independence, fourth, red white blue
- **September:** labor day, back to school
- **October:** monster, pumpkin, ghoul, boo, zombie, spook, halloween, witches
- **Year-round:** color run, glow run, beer run, costume

Treat each keyword as a separate web search if the relevant month is in your window.

## Race series enumeration

Many Houston-area race series hold multiple events on different dates within a single window. **If you find one race in a series, search explicitly for all other events in that series within the window.** Don't list a single Texas 10 Series race when there are 3 of them in your window.

Known series to check exhaustively:

- **Texas 10 Series** — multiple 10-mile events per year at different Houston venues
- **Trail Racing Over Texas (TROT)** — Brazos Bend (multiple per year), Huntsville, Sam Houston, Bandera, Rocky Raccoon
- **USA Fit / Fit Houston** training-cycle events
- **Run Wild Houston** events
- **Memorial Hermann IRONMAN training races**
- **Bayou City Road Runners (BCRR)** monthly club races
- **Houston Striders** monthly events
- **Kids Marathon Foundation** events
- **Park-hosted series:** Brazos Bend State Park hosts ~6–10 trail races per year; Memorial Park hosts multiple road races per year — search each park's name + "race" within the window.

## Search-by-venue pass

After exhausting calendar listings, do a **second pass by venue**. For each Saturday and Sunday in your window, the highest-traffic running venues almost always have an event. If you've found 0 races at a marquee venue across multiple months, you missed something. Venues to check:

- Memorial Park
- Hermann Park
- Buffalo Bayou Park / Sam Houston Park / Allen Parkway
- Discovery Green
- Rice University track
- University of Houston track
- George Bush Park (Cullen Park)
- Terry Hershey Park
- Eleanor Tinsley Park
- Brazos Bend State Park
- Huntsville State Park
- Lake Houston Wilderness Park
- Stephen F. Austin State Park
- Galveston Seawall

## Saturday density sanity check

Houston has at least one running race on **almost every Saturday** of the year, and most Saturdays have 2–5. Before finalizing your output, walk through every Saturday in your window:

1. List the Saturdays (and Sundays — many trail races are Sunday).
2. For each Saturday with **0 races** in your output, do a fresh search for that specific date (`"houston race november 7 2026"`, etc.). It's almost certainly because you missed something, not because the city is quiet that day.
3. Only finalize once every Saturday has at least 1 race or you've explicitly searched and confirmed nothing happens that day (rare — almost always tied to a major holiday like Christmas Day).

## Required searches

Before producing the artifact you MUST have run at least one search against each of the following sources for the date window. Don't skip any — the cost of an extra search is small, the cost of missing a major race is large.

1. `runintexas.com/race-calendar` (paginate through every page within the window)
2. `runsignup.com` filtered to `Houston, TX` and 50-mile radius
3. `active.com` Houston listings
4. `findarace.com/texas`
5. `houstonrunning.co/#calendar` (scroll through every event within the window)
6. `athlinks.com` upcoming Houston-area events
7. `harra.org` event calendar
8. `bcrr.org` event calendar
9. `houstonstriders.org` event list
10. `houstonmarathon.com/events`
11. `trailracingovertexas.com` upcoming events
12. `texas10series.com` (or current series site)
13. Texas Parks & Wildlife events page filtered to Brazos Bend, Huntsville, Lake Houston
14. Memorial Park Conservancy event calendar
15. Each seasonal keyword from the "Seasonal keyword sweeps" section that applies to your window's months
16. Each marquee venue from the "Search-by-venue pass" section

If a source is unreachable or returns nothing for your window, note it briefly in your chat confirmation message — don't silently skip.

## Anchor race report

Houston has a known set of recurring marquee races. For each anchor below that has *ever* been held in any month covered by your window, you MUST either include it in the JSON OR explicitly note in the chat confirmation that it is not in the window and (if you can find it) the date of the next instance.

Anchor races to account for:

- **Chevron Houston Marathon** + **Aramco Houston Half Marathon** (mid-January)
- **We Are Houston 5K** (early January, paired with the marathon weekend)
- **Memorial Hermann Sugar Land 30K** + **Sugar Land Half Marathon** (late January)
- **The Woodlands Marathon** (early March)
- **Bayou City Classic 10K** (mid-March)
- **Texas Independence Relay** (early March)
- **Bellaire Trolley Run** (April)
- **Brazos Bend 50** (April) and **Brazos Bend 100** (December)
- **Sam Houston Trail 100K** (mid-October)
- **Houston Half Marathon** (November)
- **Run for the Rose** (November)
- **Turkey Trot** (Thanksgiving morning, multiple in metro area — Houston, Sugar Land, Cypress, Katy, The Woodlands)
- **Jingle Bell Run** (early December, multiple in metro area)
- **BCS Marathon** (College Station — only if it's within your driving radius interpretation)
- **Run Houston! series** (Sugar Land, Clear Lake, La Porte, etc. — recurring through the year)
- **Texas 10 Series** (recurring through the year, find every instance in the window)

Silent omission of an anchor race is a failure mode. Either it's in the JSON or it's explicitly accounted for in chat.

## Search procedure (do all passes in order)

Replace any vague "be exhaustive" instinct with this explicit pass list. Do them in order. Only after Pass 7 passes do you produce the artifact.

**Pass 1 — Calendar sweep.** Walk every source in the "Required searches" list. Paginate through results. After this pass, you should have a baseline of ~70% of the in-window races.

**Pass 2 — Seasonal keyword sweep.** For every month in your window, run the seasonal keyword searches from the "Seasonal keyword sweeps" section. Add anything Pass 1 missed.

**Pass 3 — Series enumeration.** For every series mentioned in any race you've already found, do a follow-up search of the form "all [series name] events 2026" or "[series name] schedule 2026-2027". Add any in-window dates you find.

**Pass 4 — Venue sweep.** Walk every venue in the "Search-by-venue pass" section. For each venue, run a search like "Memorial Park 5K 2026" or "Brazos Bend race December 2026". Add anything not already in your output.

**Pass 5 — Saturday density check.** List every Saturday and Sunday in the window. For any with 0 races in your output, do a fresh date-specific search ("houston race november 7 2026"). It's almost certainly because you missed something, not because the city is quiet that day.

**Pass 6 — Anchor race accountability.** Walk the anchor list above. For each anchor whose typical month falls in the window, confirm it's either in your output or accounted for in chat.

**Pass 7 — Coverage floor check.** Compare your race count against the coverage target for your window size from the "Coverage targets" section. If below floor, return to Pass 1 and identify what kinds of races you've under-counted (themed? trail? small charity? track meets?). Repeat until at or above the floor.

## Self-audit before finalizing

Before producing the artifact, do a final coverage check:

1. **Count races per month** in your window. If any month has fewer than 60–70% of the count of a typical neighboring month, search that month again.
2. **Confirm canonical races are present.** Walk the Anchor race list one more time. Any anchor in the window's date range is either in the JSON or noted in chat.
3. **Check for series gaps.** If you found Texas 10 Series race #2 and #4 in the window but not #3, find #3.
4. **Confirm you're at or above the coverage floor.** Re-check the Coverage targets table.
5. **Confirm all required searches were actually run.** If you skipped any, run them now.

## Output schema

Return a JSON array. Each element is a race object with **exactly** these fields, in this order, no extras:

```json
{
  "id": "string",                    // slug, lowercase, hyphenated, ends with -YYYY (year)
  "name": "string",                  // official race name as it appears on the website
  "date": "YYYY-MM-DD",              // ISO date, race day
  "start_time": "HH:MM" | null,      // 24-hour local start time, or null if unknown
  "tz": "America/Chicago",           // always this exact string
  "address": "string",               // street address of start line
  "city": "string",
  "state": "string",                 // 2-letter state code, almost always "TX"
  "zip": "string",                   // 5-digit zip
  "latitude": number | null,         // signed decimal degrees, e.g. 29.7604. REQUIRED if you have a street address or named venue — null ONLY when the start line is genuinely unknown.
  "longitude": number | null,        // signed decimal degrees, e.g. -95.3698 (W is negative). REQUIRED if you have a street address or named venue — null ONLY when the start line is genuinely unknown.
  "distance": ["string", ...],       // canonical distance strings (see below); always an array, never empty
  "surface": "road" | "trail" | "track" | "virtual" | "other",
  "kid_run": boolean,                // true if the event is a kids-only race OR includes a separate kids' fun run
  "official_website_url": "string",  // primary URL where someone can register or learn more
  "source_url": "string",            // the URL you actually used to verify this race (often the same as official_website_url)
  "description": "string"            // 1–3 sentences. Factual, neutral, no marketing fluff. See below.
}
```

### Field rules

**`id`**

- Lowercase, words joined with hyphens.
- Strip apostrophes and punctuation.
- Always end with `-YYYY` where YYYY is the race year. This avoids collisions across years.
- Examples:
  - `"Bayou City Classic 10K"` on April 25, 2026 → `"bayou-city-classic-10k-2026"`
  - `"Brazos Bend Trail Run"` on May 16, 2026 → `"brazos-bend-trail-run-2026"`
  - `"The Woodlands Marathon"` on March 7, 2027 → `"the-woodlands-marathon-2027"`
- If a race series holds multiple events on different dates within the 365-day window, give each its own entry with a unique id (e.g. append the month: `"texas-10-series-cypress-2026-05"`). For monthly series, expect 6–12 entries from the same series.

**`date`**

- Strict ISO `YYYY-MM-DD`.
- If a race is held over multiple days (e.g. a marathon weekend with a 5K on Saturday and a marathon on Sunday), create **separate entries** for each day with appropriate ids.

**`start_time`**

- 24-hour clock, `HH:MM`. `"07:30"` not `"7:30 AM"`.
- Use `null` if you cannot find the start time. **Do not guess.**

**`distance`**

Use these canonical strings, in this order if multiple apply:

```
"1 Mile", "5K", "6K", "10K", "12K", "15K", "10 Mile", "Half Marathon", "Marathon",
"50K", "50 Mile", "100K", "100 Mile", "Ultra", "Kids"
```

**Do NOT abbreviate.** These are the *exact* strings to use, character-for-character. Any of the following are wrong and will fail validation:

| Wrong | Right |
|---|---|
| `1 Mi`, `1 mi`, `1mile`, `Mile` | `1 Mile` |
| `10 Mi`, `10 mi`, `10mile`, `10M` | `10 Mile` |
| `50M`, `50mi`, `50 Mi` | `50 Mile` |
| `100M`, `100mi`, `100 Mi` | `100 Mile` |
| `Half`, `half marathon`, `HM`, `13.1` | `Half Marathon` |
| `Full`, `full marathon`, `26.2` | `Marathon` |
| `5k`, `5 K`, `5km` | `5K` |
| `10k`, `10 K`, `10km` | `10K` |
| `Children`, `Kid`, `kids fun run` | `Kids` |

- For ultras at non-canonical distances (e.g. 60K, 200 mile), use `"Ultra"`.
- If a race offers multiple distances on the same day, list them all in this array.
- If there's a separate kids' run as part of a larger event, include `"Kids"` in the array AND set `kid_run: true`.
- If a race lists a non-standard road distance like `"4 Mile"` or `"8K"` that isn't in the canonical list, prefer the closest canonical match if obvious; otherwise omit that distance from the array (don't invent a new canonical value).

**`surface`**

- Use lowercase: `"road"`, `"trail"`, `"track"`, `"virtual"`, `"other"`.
- For mixed-surface events (e.g. road that briefly enters a park), use the dominant surface.
- Use `"virtual"` only for fully-virtual races.

**`latitude` / `longitude`**

- **Signed decimal degrees**, not degree-minute-second strings.
- Houston is at roughly latitude `29.76` (positive, north) and longitude `-95.37` (negative, west).
- **If the record has a street address OR a named venue, you MUST geocode it.** Look up the address on Google Maps or OpenStreetMap and read off the coordinates. Round to 4 decimal places. This is not optional — a race without coordinates silently disappears from the site's map view, so every geocodable row matters. An address without matching coordinates is a pipeline bug, not an acceptable output.
- `null` is acceptable ONLY when the start line is genuinely unknown (e.g. the race website says "TBD" or lists a city with no venue). In that case, `address`, `latitude`, and `longitude` should all be `null` together.
- **Do not invent coordinates.** If the only thing you can find is "Houston, TX" with no venue, do not geocode the city centroid — leave both fields `null`.

**`official_website_url`**

- The single best URL for someone to learn more / register.
- Prefer the race's own domain over a third-party listing (RunSignUp, Active, Eventbrite) when both exist.
- Must include the protocol (`https://`).

**`source_url`**

- The URL you actually visited to verify this race exists, has these distances, and is on this date.
- Often this is the same as `official_website_url`. If you used a calendar listing to confirm, put that listing URL here.

**`description`**

- 1–3 sentences. Factual and neutral.
- **Good:** "A flat, fast 10K and companion 5K through downtown Houston, starting and finishing at Sam Houston Park along Buffalo Bayou."
- **Bad:** "This INCREDIBLE race is a MUST-DO for any Houston runner!! 🏃‍♀️🔥"
- Lead with the distance and what makes the race interesting (course, scenery, charity, tradition). Skip sponsor mentions and pricing.
- If the race is part of a longer-running tradition, mention the year it started.
- If it's unusual (kids only, women only, costume run, twilight start, etc.), mention that.

## Edge cases

- **Same race, different distances on the same day:** one entry, all distances in the array.
- **Same race series, multiple weekends:** one entry per date, each with a unique id.
- **Race in two cities (e.g. moving start line):** separate entries.
- **Kids' fun run paired with an adult race:** one entry with `"Kids"` in the distance array AND `kid_run: true`.
- **Sold out but still scheduled:** include it.
- **Weather-cancelled and rescheduled:** use the rescheduled date.
- **TBD start time:** `start_time: null`.
- **Charity walk with optional 5K run:** include only if a real timed run option exists; surface is `"road"`.
- **Race you found on a calendar but can't open the official website:** SKIP. We only list verifiable races.

## Output format

**Your final answer is a single downloadable code artifact containing a JSON array. Nothing else.**

This is the one place where a Claude artifact is explicitly wanted — because the user needs a real file they can download and hand to another tool, not text they have to select and copy out of a chat bubble.

### Artifact specifics

- Create **exactly one** artifact in your final answer.
- **Artifact type:** a code block (plain JSON code), NOT a React component, NOT HTML, NOT an interactive visualizer, NOT a dashboard. In the Claude.ai artifact system, this is the "code" artifact type with language set to `json`.
- **Artifact title:** `races-<start>-to-<end>.json`, using the actual start and end dates of the window you researched. Examples:
  - `races-2026-04-08-to-2026-07-07.json` for a Q1 quarterly run
  - `races-2026-04-08-to-2027-04-08.json` for a full-year default run
- **Artifact content:** a valid JSON array of race objects conforming to the schema above. Nothing else — no leading `json` fence line, no trailing prose, no comments. The very first character of the artifact content is `[` and the very last character is `]`.
- **Artifact description (the short text Claude writes next to the artifact):** one sentence stating the window and race count, e.g. `Exhaustive Houston-area race research for 2026-04-08 to 2026-07-07 — 63 races.` Nothing more.

### What the chat message itself should contain

Minimal. A one-sentence confirmation of the window and the race count is fine (it helps the user see at a glance whether the sweep was complete). Example:

> Completed an exhaustive sweep for **2026-04-08 to 2026-07-07**. Found **63 races** from **runintexas.com, runsignup.com, trailracingovertexas.com, harra.org, bcrr.org, runguides.com, houstonrunning.co**, and event websites. Artifact is ready to download.

Do NOT:
- Paste the JSON array into the chat in addition to the artifact. The artifact is the only place it belongs.
- Write a "here are all the races I found" section in chat.
- Write a "things I was uncertain about" section in chat.
- Wrap the chat message in a fence.
- Propose follow-up actions, offer to build a webpage, or suggest visualizing the data.

### Formatting rules inside the JSON

These apply to the content inside the artifact:

- No preamble, no greeting, no "Here's the JSON" line before the `[`.
- No markdown fence inside the artifact — it's already a code artifact, wrapping it again is wrong.
- No comments inside the JSON (JSON doesn't support them).
- No trailing commas.
- Two-space indentation is fine and preferred for readability.
- Race objects in date-ascending order (earliest race first).

## Quality checklist (apply this to every race before including it)

Before adding a race to your output, confirm all of these:

- [ ] Date falls inside the `DATE WINDOW:` you parsed at the top of the prompt (or inside today through today + 365 days if no explicit window was given), inclusive.
- [ ] Race is in the geographic scope above.
- [ ] You verified it on a primary source (race website or registration page).
- [ ] All required fields are populated; optional fields are `null` if unknown, never invented.
- [ ] `id` is unique within your output.
- [ ] `distance` array uses canonical strings.
- [ ] `surface` is one of the five enum values.
- [ ] Coordinates are signed decimal degrees, or both `null`.
- [ ] If you populated `address` or named a venue, you ALSO populated `latitude` and `longitude`. An address without coordinates is a bug, not an acceptable state.
- [ ] Description is factual, 1–3 sentences, no marketing language.
- [ ] You're confident the race is real and not duplicated in the array.

## Reference example

Here is exactly the format we want, taken from the live data. Match this style:

```json
{
  "id": "bayou-city-classic-10k-2026",
  "name": "Bayou City Classic 10K",
  "date": "2026-04-25",
  "start_time": "07:30",
  "tz": "America/Chicago",
  "address": "1000 Bagby St",
  "city": "Houston",
  "state": "TX",
  "zip": "77002",
  "latitude": 29.7589,
  "longitude": -95.3677,
  "distance": ["10K", "5K"],
  "surface": "road",
  "kid_run": false,
  "official_website_url": "https://www.bayoucityclassic.com",
  "source_url": "https://www.bayoucityclassic.com",
  "description": "A flat, fast spring 10K and companion 5K through downtown Houston, starting and finishing at Sam Houston Park along Buffalo Bayou."
}
```

Now run the exhaustive research and produce the output.

**Reminder of the output contract:**

1. Parse the `DATE WINDOW:` line at the top. If it specifies explicit dates, use them. Otherwise default to today through today + 365 days.
2. Do an exhaustive sweep. Don't stop at 20 races when there are 60.
3. Produce **exactly one code artifact**, titled `races-<start>-to-<end>.json`, containing a valid JSON array. No React, no HTML, no dashboard, no interactive visualizer — just a plain JSON code artifact the user can download with one click.
4. In the chat body, a single confirmation sentence stating the window and race count. Nothing else.
