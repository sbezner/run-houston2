### RESEARCH TASK: HOUSTON RACE DISCOVERY (Claude Code CLI) ###

GOAL: Find upcoming races within the specified DATE WINDOW that are NOT on RunSignUp.
CONTEXT: RunSignUp races have already been imported via API before this prompt runs. Updates to existing races are welcome — merge-races.py handles deduplication downstream.

OUTPUT REQUIREMENTS:
- Format: Strictly valid JSON array, nothing else.
- Save using the Write tool to ~/Downloads/races-START-to-END.json (replace START/END with actual dates).
- Do not output prose or commentary in the file — only the JSON array.
- Print a one-line summary when done: "Wrote N races for YYYY-MM-DD to YYYY-MM-DD."

---

You are a research assistant for **Run Houston**, a community race-discovery website that lists road, trail, and track races in the greater Houston, Texas metropolitan area. Your job is to use WebSearch and WebFetch to perform an **exhaustive** sweep for every legitimate running race in the date window specified above and save the results as a strictly-formatted JSON array using the Write tool.

**Step 1: Parse the date window.** The DATE WINDOW is provided as the first line of this prompt by the calling script. It contains two ISO dates in `YYYY-MM-DD to YYYY-MM-DD` form. Respect them exactly.

**Step 2: This is a research task with a specific output format.** Save your results as a JSON array to `~/Downloads/races-START-to-END.json` using the Write tool. Nothing else — no chat commentary, no UI.

This output will be merged into a static JSON file that powers a public website. **The JSON you produce must be valid, parseable, and conform exactly to the schema below.** Treat the schema as a hard contract.

**Exhaustive means exhaustive.** Keep searching until you have crawled every source listed below, plus follow-on searches for race series, charity events, and venue calendars. Do not stop at the first 10 or 20 results.

## Important: Do NOT search RunSignUp

**Do NOT search `runsignup.com` for race listings.** RunSignUp races are imported separately via API before this prompt runs. Searching RunSignUp again via web search is wasted effort and produces duplicates. Focus your entire search budget on sources that RunSignUp does not cover.

## Coverage targets (hard floors)

Use these as a "you are not done" signal. If your output is below the floor for the window size, do another pass before saving. Do not save while below floor.

| Window size | Floor | Typical |
|---|---|---|
| 7 days    | 3 races   | 5–10     |
| 14 days   | 6 races   | 10–20    |
| 30 days   | 15 races  | 20–40    |
| 60 days   | 30 races  | 40–80    |
| 90 days   | 50 races  | 60–120   |

Note: these floors are LOWER than the full prompt floors because RunSignUp races (typically 40-60% of all races) have already been imported. You are only searching for what RunSignUp missed.

If you are below the floor, the most likely cause is that you stopped searching too early. Re-run the seasonal-keyword sweep, the search-by-venue pass, and the Saturday density check before finalizing.

## Choosing your window size

When called by `run_discovery.sh`, windows are typically 7 days. Prefer **smaller windows**:

- **Recommended:** 7–14 day windows. Most thorough coverage per pass.
- **Acceptable:** 30 day windows for manual catch-up.
- **Use sparingly:** 60+ day windows. Coverage drops noticeably.

## Time window

- **Today** is the date you are executing this prompt. Do NOT hardcode any date.
- The window is defined by the `DATE WINDOW:` line at the top.
- Do NOT include races that have already happened (date < today).
- Do NOT include races beyond the end date of the window.

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

**Skip** races more than ~90 minutes' drive from downtown Houston.

## What to include

✅ Include all of:
- Road races at any distance from 1 mile up through ultras
- Trail races at any distance
- Open / all-comers track meets
- Charity runs and fun runs
- Kids' fun runs (mark `kid_run: true`)
- The running portion of running-only events held at parks and lakes

❌ Skip:
- Triathlons, duathlons, aquabikes
- Cycling-only events
- Walks-only events with no run option
- "Virtual challenges" not connected to a real Houston organization or event
- Races whose registration is closed or full
- Races you cannot verify on a primary source

## Recommended starting sources

Start your research from these and branch out. Don't trust any single source — cross-reference at least two for each race when possible.

- **Race calendars:**
  - `runintexas.com` (Houston-area calendar)
  - `active.com` Houston listings
  - `findarace.com` Texas listings
  - `houstonrunning.co` (Houston-area community race calendar; see `#calendar` section)
  - `houstonrunningcalendar.com`
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

Race calendars miss many seasonal/themed events because they're branded under the theme, not under "5K" or "10K". For any month inside the window, also run web searches pairing the relevant keywords below with `houston`, `katy`, `cypress`, `the woodlands`, `sugar land`, `pearland`, etc.

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

## Race series enumeration

Many Houston-area race series hold multiple events on different dates. **If you find one race in a series, search explicitly for all other events in that series within the window.**

Known series to check exhaustively:

- **Texas 10 Series** — multiple 10-mile events per year
- **Trail Racing Over Texas (TROT)** — Brazos Bend, Huntsville, Sam Houston
- **USA Fit / Fit Houston** training-cycle events
- **Run Wild Houston** events
- **Bayou City Road Runners (BCRR)** monthly club races
- **Houston Striders** monthly events
- **Kids Marathon Foundation** events
- **Park-hosted series:** Brazos Bend State Park, Memorial Park

## Search-by-venue pass

After exhausting calendar listings, do a **second pass by venue**. Venues to check:

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

Houston has at least one running race on **almost every Saturday**. Before finalizing:

1. List every Saturday (and Sunday) in your window.
2. For each Saturday with **0 races**, do a fresh search for that specific date.
3. Only finalize once every Saturday has at least 1 race or you've confirmed nothing happens that day.

## Required searches

Before saving you MUST have run at least one WebSearch against each of these:

1. `runintexas.com/race-calendar`
2. `active.com` Houston listings
3. `findarace.com/texas`
4. `houstonrunning.co/#calendar`
5. `houstonrunningcalendar.com`
6. `athlinks.com` upcoming Houston-area events
7. `harra.org` event calendar
8. `bcrr.org` event calendar
9. `houstonstriders.org` event list
10. `houstonmarathon.com/events`
11. `trailracingovertexas.com` upcoming events
12. `texas10series.com` (or current series site)
13. Texas Parks & Wildlife events page
14. Memorial Park Conservancy event calendar
15. Each seasonal keyword that applies to the window's months
16. Each marquee venue from the search-by-venue section

(Note: `runsignup.com` is intentionally excluded — imported via API before this prompt runs.)

If a source is unreachable or returns nothing, note it in console output.

## Anchor race report

For each anchor below whose typical month falls in the window, you MUST either include it OR note in console output that it's not in the window.

- **Chevron Houston Marathon** + **Aramco Houston Half Marathon** (mid-January)
- **We Are Houston 5K** (early January)
- **Memorial Hermann Sugar Land 30K** + **Sugar Land Half Marathon** (late January)
- **The Woodlands Marathon** (early March)
- **Bayou City Classic 10K** (mid-March)
- **Texas Independence Relay** (early March)
- **Bellaire Trolley Run** (April)
- **Brazos Bend 50** (April) and **Brazos Bend 100** (December)
- **Sam Houston Trail 100K** (mid-October)
- **Houston Half Marathon** (November)
- **Run for the Rose** (November)
- **Turkey Trot** (Thanksgiving morning, multiple in metro area)
- **Jingle Bell Run** (early December, multiple in metro area)
- **Run Houston! series** (recurring through the year)
- **Texas 10 Series** (recurring through the year)

Silent omission of an anchor race is a failure mode.

## Search procedure (do all passes in order)

Do them in order. Only after Pass 7 passes do you save the file.

**Pass 1 — Calendar sweep.** Walk every source in the "Required searches" list using WebSearch and WebFetch. After this pass, you should have ~70% of non-RunSignUp races.

**Pass 2 — Seasonal keyword sweep.** For every month in your window, run the seasonal keyword searches. Add anything Pass 1 missed.

**Pass 3 — Series enumeration.** For every series mentioned in any race you've already found, search for all other events in that series within the window.

**Pass 4 — Venue sweep.** Walk every venue in the search-by-venue section. Add anything not already in your output.

**Pass 5 — Saturday density check.** List every Saturday and Sunday. For any with 0 races, do a fresh date-specific search.

**Pass 6 — Anchor race accountability.** Walk the anchor list. Confirm each is in your output or accounted for.

**Pass 7 — Coverage floor check.** Compare your count against the coverage target. If below floor, return to Pass 1 and repeat.

## Self-audit before finalizing

Before saving:

1. **Count races per week.** If any week has 0, search again.
2. **Confirm anchor races** are accounted for.
3. **Check for series gaps.**
4. **Confirm at or above the coverage floor.**
5. **Confirm all required searches were run.**

## Output schema

Return a JSON array. Each element is a race object with **exactly** these fields:

```json
{
  "id": "string",                    // slug-YYYY
  "name": "string",                  // official race name
  "date": "YYYY-MM-DD",              // ISO date
  "start_time": "HH:MM" | null,      // 24-hour, or null if unknown
  "tz": "America/Chicago",           // always this
  "address": "string",               // street address of start line
  "city": "string",
  "state": "string",                 // "TX"
  "zip": "string",                   // 5-digit zip
  "latitude": number | null,         // REQUIRED if address exists; null only if TBD
  "longitude": number | null,        // REQUIRED if address exists; null only if TBD
  "distance": ["string", ...],       // canonical strings, never empty
  "surface": "road" | "trail" | "track" | "virtual" | "other",
  "kid_run": boolean,
  "official_website_url": "string",
  "source_url": "string",
  "description": "string"            // 1-3 sentences, factual, neutral
}
```

### Canonical distances (exact strings, do NOT abbreviate)

```
"1 Mile", "5K", "6K", "10K", "12K", "15K", "10 Mile", "Half Marathon", "Marathon",
"50K", "50 Mile", "100K", "100 Mile", "Ultra", "Kids"
```

| Wrong | Right |
|---|---|
| `1 Mi`, `1 mi`, `1mile` | `1 Mile` |
| `10 Mi`, `10 mi`, `10M` | `10 Mile` |
| `50M`, `50mi` | `50 Mile` |
| `100M`, `100mi` | `100 Mile` |
| `Half`, `HM`, `13.1` | `Half Marathon` |
| `Full`, `26.2` | `Marathon` |
| `5k`, `5 K`, `5km` | `5K` |
| `Kid`, `Children` | `Kids` |

### Latitude / longitude

- **If the record has a street address or named venue, you MUST geocode it.** Look up coordinates on Google Maps or OpenStreetMap. Round to 4 decimal places.
- `null` is acceptable ONLY when the start line is genuinely unknown ("TBD"). An address without coordinates is a bug.
- Do not invent coordinates for city-only entries.

### Description

- 1-3 sentences. Factual and neutral. No marketing fluff or emoji.
- Lead with what makes the race interesting (course, charity, tradition).

## Edge cases

- Same race, different distances on same day: one entry, all distances in array.
- Same series, multiple weekends: one entry per date, unique id.
- Kids' fun run paired with adult race: one entry with `"Kids"` + `kid_run: true`.
- Sold out but scheduled: include it.
- TBD start time: `start_time: null`.
- Can't verify on primary source: SKIP.

## Formatting rules

- No preamble before the `[`.
- No markdown fence wrapping the JSON.
- No comments, no trailing commas.
- Two-space indentation preferred.
- Date-ascending order.

## Quality checklist

Before saving, confirm for each race:

- [ ] Date inside the window
- [ ] In geographic scope
- [ ] Verified on primary source
- [ ] `id` unique and ends with `-YYYY`
- [ ] Canonical distance strings
- [ ] Valid surface enum
- [ ] Coordinates present if address exists
- [ ] Description is factual, 1-3 sentences
- [ ] Not a duplicate of the array
- [ ] Not a triathlon, cycling, or walk-only event

## Final step

1. Save the JSON array to `~/Downloads/races-START-to-END.json` using the Write tool.
2. Print to console: "Wrote N races for YYYY-MM-DD to YYYY-MM-DD."
3. Do not propose follow-up actions or offer to merge.
