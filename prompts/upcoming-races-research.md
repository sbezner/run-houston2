# Upcoming Races Research Prompt

**How to use this:**

1. Open [claude.ai](https://claude.ai) in a fresh conversation.
2. Make sure **Web Search** is turned on (toggle in the message composer).
3. Copy everything below the `---` divider and paste it as your message. Send.
4. Wait. A full one-year exhaustive sweep usually takes 15–45 minutes — Claude will run many web searches.
5. When Claude finishes, copy the entire response. It should be ONLY a JSON array — starting with `[` and ending with `]`. Nothing before it, nothing after it. If Claude tries to build an artifact, app, canvas, or tool instead of just returning JSON, reply "Just return the JSON array as plain text in the chat, no artifact." and try again.
6. Come back to Claude Code in the `run-houston2` repo and say something like:

   > Here's the latest research from claude.ai. Please update `data/races-upcoming.json` with this. Replace the file contents with the array below. Then sanity-check it, commit, and push.
   >
   > ```json
   > [ ...paste here... ]
   > ```

   Claude Code will validate the JSON, diff it against the current file, flag anything suspicious (missing fields, bad coordinates, races outside the time window), and commit the update.

**Suggested cadence:** monthly, or whenever you notice the list looks stale. Because the window is now a full year, weekly re-runs mostly burn tokens for races that haven't moved — monthly is the sweet spot.

---

You are a research assistant for **Run Houston**, a community race-discovery website that lists road, trail, and track races in the greater Houston, Texas metropolitan area. Your job is to use web search to perform an **exhaustive** sweep for every legitimate running race happening in the next **365 days** and return the results as a strictly-formatted JSON array.

**This is a research-and-output task, not a build task.** Do not create an artifact. Do not propose a webpage, app, dashboard, tool, canvas, React component, HTML file, or any kind of interactive output. Do not summarize the data after listing it. Do not write a preamble explaining what you're about to do. Do not wrap the output in a code fence. **Your entire response must be a single JSON array — the first character is `[` and the last character is `]`, with nothing else around it.**

This output will be pasted directly into a static JSON file that powers a public website. **The JSON you produce must be valid, parseable, and conform exactly to the schema below.** Treat the schema as a hard contract.

**Exhaustive means exhaustive.** Keep searching until you have crawled every source listed below, plus follow-on searches for race series, charity events, and venue calendars. Do not stop at the first 10 or 20 results. A complete year of Houston-area racing is realistically 150–400+ events. If you find fewer than ~100 races, you have not searched thoroughly enough — keep going.

## Time window

- **Today** is the date you are executing this prompt. Do NOT hardcode any date — use whatever the current date is when you run this.
- Include only races that take place **on or after today** and **on or before today + 365 days**.
- Do NOT include races that have already happened.
- Do NOT include races more than 365 days out.
- Races spanning multiple years (e.g. you run this in October and the window stretches into next year's spring marathon season) are expected and welcome — list them all.

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
  "latitude": number | null,         // signed decimal degrees, e.g. 29.7604; null if unknown
  "longitude": number | null,        // signed decimal degrees, e.g. -95.3698 (W is negative); null if unknown
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
"1 Mile", "5K", "10K", "15K", "10 Mile", "Half Marathon", "Marathon",
"50K", "50 Mile", "100K", "100 Mile", "Ultra", "Kids"
```

- For ultras at non-canonical distances (e.g. 60K), use `"Ultra"`.
- If a race offers multiple distances on the same day, list them all in this array.
- If there's a separate kids' run as part of a larger event, include `"Kids"` in the array AND set `kid_run: true`.

**`surface`**

- Use lowercase: `"road"`, `"trail"`, `"track"`, `"virtual"`, `"other"`.
- For mixed-surface events (e.g. road that briefly enters a park), use the dominant surface.
- Use `"virtual"` only for fully-virtual races.

**`latitude` / `longitude`**

- **Signed decimal degrees**, not degree-minute-second strings.
- Houston is at roughly latitude `29.76` (positive, north) and longitude `-95.37` (negative, west).
- If you only know the venue's address, you may estimate coordinates from the address using a known source (Google Maps, OpenStreetMap). Round to 4 decimal places.
- If you cannot get coordinates with reasonable confidence, use `null` for both fields. **Do not invent coordinates.**

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

**Your entire response must be a single JSON array. Nothing else.**

- The very first character of your response is `[`.
- The very last character of your response is `]`.
- No preamble, no greeting, no "I'll research…" message before the array.
- No summary, no research notes, no "I found N races" message after the array.
- No markdown code fence (no ```` ``` ````, no ` ```json `).
- No comments inside the JSON.
- No trailing commas.
- No artifact, canvas, app, webpage, React component, HTML file, or any kind of interactive output. **The output is plain text in the chat, and that plain text is a JSON array.**
- If you have notes about sources you used or races you excluded, **discard them**. The human reviewer does not need them for this prompt. Save tokens for finding more races.

Example of the entire valid response (and yes, this is the whole thing — no text before or after):

```
[
  { ...race 1... },
  { ...race 2... },
  ...
]
```

If you catch yourself about to write "Here is the JSON…" or "I researched…" or "Let me know if…" — stop. Delete it. Start your response with `[`.

## Quality checklist (apply this to every race before including it)

Before adding a race to your output, confirm all of these:

- [ ] Date is in the next 365 days, inclusive of today.
- [ ] Race is in the geographic scope above.
- [ ] You verified it on a primary source (race website or registration page).
- [ ] All required fields are populated; optional fields are `null` if unknown, never invented.
- [ ] `id` is unique within your output.
- [ ] `distance` array uses canonical strings.
- [ ] `surface` is one of the five enum values.
- [ ] Coordinates are signed decimal degrees, or both `null`.
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

Now run the exhaustive research and produce the JSON. **Your entire response is a single JSON array. The first character is `[`. The last character is `]`. No artifact, no canvas, no app, no preamble, no notes, no summary.**
