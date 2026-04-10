# Race Recap Research Prompt

**How to use this:**

1. Open [claude.ai](https://claude.ai) in a fresh conversation.
2. Make sure **Web Search** is turned on (toggle in the message composer).
3. **Set the date window.** Below, under the `---` divider, find the line that starts with `DATE WINDOW:`. Replace the placeholder with the exact dates you want recapped in `YYYY-MM-DD to YYYY-MM-DD` form. For a monthly recap pass, pick the previous ~30 days (e.g. `2026-03-09 to 2026-04-08`). The window must end on or before today — this prompt is for races that have **already happened**.
4. Copy everything below the `---` divider (including your edited `DATE WINDOW:` line) and paste it as your message. Send.
5. Wait. A monthly sweep usually takes 10–20 minutes; Claude will run many web searches in sequence to find race results, news coverage, and finisher reports.
6. **When Claude finishes, it will have produced a single code artifact in the right-hand side panel**, containing a JSON array of recap objects. Click the download button on the artifact and save the `.json` file somewhere you can find it.
7. Come back to Claude Code in the `run-houston2` repo and say something like:

   > Here's the latest race recap research from claude.ai. The file is at `/Users/me/Downloads/recaps-2026-03-09-to-2026-04-08.json`. Please validate it, diff it against `data/race_reports.json`, show me the add/update summary, and apply it after I confirm.

   Claude Code will run the data contract validator, compute the upsert-by-id diff, and commit the update.

**Suggested cadence:** run a monthly recap sweep (~30-day window) once a month, a couple of days after the end of each month, so race results have had time to be posted.

---

DATE WINDOW: [REPLACE WITH "YYYY-MM-DD to YYYY-MM-DD" — must end on or before today]

You are a research assistant for **Run Houston**, a community race-discovery website that lists road, trail, and track races in the greater Houston, Texas metropolitan area. Your job is to use web search to find every legitimate running race that **already happened** within the date window above, gather verifiable facts about each one, and write a short factual news-style recap of each. Return the results as a strictly-formatted JSON array delivered in a single downloadable code artifact.

**Step 1: Parse the date window.** Look at the `DATE WINDOW:` line above. It controls which past races you write up.

- The line must contain two ISO dates in `YYYY-MM-DD to YYYY-MM-DD` form.
- Both dates must be on or before today. If the user-provided window extends into the future, cap the upper end at today.
- Treat the window as inclusive: a race held on the start date is in; a race the day before is out.

Announce the window you are using as the first thing you do — not in the chat, but in the artifact's description when you create it.

**Step 2: This is a research-and-writing task with a specific output format.** Your final answer is **a single code artifact** (not chat text, not a React component, not an HTML page, not a dashboard). The artifact contains a JSON array of recap objects and nothing else. Specifics are in the "Output format" section near the bottom of this prompt.

Do not build a website, app, or interactive viewer around the data. The user already has a website; your job is to produce the data file it reads.

This output will be saved as a static JSON file that powers a public website. **The JSON you produce must be valid, parseable, and conform exactly to the schema below.** Treat the schema as a hard contract.

## What this prompt is NOT for

- This is not for **upcoming** races. There's a separate prompt (`upcoming-races-research.md`) for that.
- Do not invent races, finishers, times, or weather. Every claim in every recap must come from a verifiable web source you actually visited.
- Do not write opinion, marketing fluff, or hype. The voice is **factual news**: who, what, when, where, how it went.

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

## What to recap

✅ Recap any of:
- Road races at any distance from 1 mile up through ultras
- Trail races at any distance
- Charity runs and fun runs that drew a substantial field
- Notable kids' fun runs (especially those tied to a larger adult race)
- The marquee Houston-area races (Chevron Houston Marathon, Aramco Houston Half, Bayou City Classic, We Are Houston 5K, Brazos Bend events, the Texas 10 series, Texas Trail Championships, etc.) — these should always have a recap if they fall in the window

❌ Skip:
- Triathlons, duathlons, aquabikes
- Cycling-only events
- Walks-only events with no run option
- Tiny private/internal events with no public results or coverage
- Races you cannot verify on a primary source

**Coverage target:** A typical Houston-area month has 8–25 races worth recapping. If you find fewer than ~5 for a 30-day window, you have not searched thoroughly. Keep going.

## Recommended starting sources

Start your research from these and branch out. Cross-reference at least two sources per race when possible.

- **Results pages:**
  - `runsignup.com` results filter (search by race name, then "Results" tab)
  - `athlinks.com` (aggregates results from many timing companies)
  - `chiptime.com`, `sweatengineering.com`, `fishercreative.com` (Houston-area timing companies)
- **News and recap coverage:**
  - `chron.com` and `houstonchronicle.com` sports / community sections
  - `khou.com`, `abc13.com`, `click2houston.com` for big-event coverage
  - `community-impact.com` Houston-area editions
  - `runnersworld.com` for marquee marathons / ultras
- **Race series and organization sites:**
  - `houstonmarathon.com` post-race news / press releases
  - `bcrr.org` (Bayou City Road Runners) results and race reports
  - `houstonstriders.org` event reports
  - `trailracingovertexas.com` (TROT) for Brazos Bend, Sam Houston, etc.
  - `harra.org` (Houston Area Road Runners Association) news
- **Calendars (work backwards from a date):**
  - `runintexas.com`
  - `runsignup.com` filtered to Houston, TX

For each race you find, **visit at least one primary source** (results page, race website, or news article) to confirm the date, distances, location, and any factual claims you make in the recap. If you can only confirm a race exists but cannot find any results or coverage, write a shorter recap from what you do know — but never invent details.

## Output schema

Return a JSON array. Each element is a recap object with **exactly** these fields:

```json
{
  "id": "string",                    // slug, lowercase, hyphenated, ends with -YYYY-recap
  "race_id": "string" | null,        // id from races-upcoming.json if a matching past entry exists, else null
  "race_name": "string",             // official race name
  "race_date": "YYYY-MM-DD",         // ISO date the race was held
  "title": "string",                 // headline of the recap (see rules below)
  "photos": [],                      // always an empty array; the site has no image hosting yet
  "content_md": "string"             // the recap body in Markdown — see rules below
}
```

### Field rules

**`id`**

- Lowercase, words joined with hyphens.
- Strip apostrophes and punctuation.
- Always end with `-YYYY-recap` where YYYY is the race year.
- Examples:
  - `"Bayou City Classic 10K"` on March 14, 2026 → `"bayou-city-classic-10k-2026-recap"`
  - `"Brazos Bend 50"` on December 12, 2026 → `"brazos-bend-50-2026-recap"`
- Must be unique within your output.

**`race_id`**

- Almost always `null`. The `races-upcoming.json` file generally only contains future races; once a race has happened it has typically been removed. Set to `null` unless you have specific reason to believe the upcoming-races file still has the matching entry.

**`race_name`**

- Official race name as it appears on the race's website.

**`race_date`**

- Strict ISO `YYYY-MM-DD`. Must fall inside the date window.

**`title`**

- A factual news-style headline, 6–14 words.
- **Good:** `"Chevron Houston Marathon returns to downtown under cool January conditions"`
- **Good:** `"Brazos Bend 50 draws 1,200 ultrarunners to state park trails"`
- **Bad:** `"WHAT A DAY at the Bayou City Classic!!"`
- **Bad:** `"Race recap: Houston Marathon 2026"` (lazy / generic)
- No emoji, no all caps, no clickbait.

**`photos`**

- Always `[]` (empty array). The site has no image hosting yet.

**`content_md`**

- The recap body, written in Markdown. Plain text works fine — most recaps don't need headings or links.
- **Length:** 3–5 paragraphs, roughly 200–500 words. Long enough to give a real feel for the race; short enough to read in a minute.
- **Voice:** factual news. Past tense. No second person ("you"). No marketing fluff. No hype. No emoji.
- **Structure (loose):**
  1. Lead paragraph: who, what, when, where. One sentence on conditions if known.
  2. Course / distances paragraph: what runners actually ran.
  3. Notable details: top finishers (with times if available), field size, charity beneficiary, any incidents, weather impact, anything unusual.
  4. Optional context: history of the event, year it started, what it's known for, traditions.
- **Source rule:** every factual claim must trace to a source you visited. If you don't know top finishers, don't make any up — just don't mention them. If you don't know field size, omit it. **Use null-equivalents (silence) rather than guesses.**
- Do not include source URLs in the body. The recap is meant to read like a newspaper article.
- Use straight quotes (`"`), not curly quotes.
- Use `\n\n` to separate paragraphs in the JSON string.

## Edge cases

- **Multi-day races (e.g. marathon weekend with a Saturday 5K and a Sunday marathon):** one recap per day, each with a unique id.
- **Race series with multiple events in the window:** one recap per event date.
- **Race you found on a calendar but can find no results, news, or recap content:** write a short 2-paragraph factual recap from whatever you can verify (date, distances, location, organizer). Do not pad with invention.
- **Races cancelled due to weather:** include a recap noting the cancellation if it's noteworthy and you can verify it.
- **Race held but results not yet posted:** include with whatever you can verify; finishers can be omitted.

## Output format

**Your final answer is a single downloadable code artifact containing a JSON array. Nothing else.**

### Artifact specifics

- Create **exactly one** artifact in your final answer.
- **Artifact type:** a code block (plain JSON code), NOT a React component, NOT HTML, NOT an interactive visualizer. In the Claude.ai artifact system, this is the "code" artifact type with language set to `json`.
- **Artifact title:** `recaps-<start>-to-<end>.json`, using the actual start and end dates. Example: `recaps-2026-03-09-to-2026-04-08.json`.
- **Artifact content:** a valid JSON array of recap objects conforming to the schema above. Nothing else — no leading `json` fence line, no trailing prose, no comments. The very first character of the artifact content is `[` and the very last character is `]`.
- **Artifact description (the short text Claude writes next to the artifact):** one sentence stating the window and recap count, e.g. `Houston-area race recaps for 2026-03-09 to 2026-04-08 — 14 races.` Nothing more.

### What the chat message itself should contain

Minimal. A one-sentence confirmation of the window and recap count. Example:

> Completed a recap sweep for **2026-03-09 to 2026-04-08**. Wrote **14 recaps** sourced from runsignup.com results pages, athlinks.com, the Houston Chronicle, and race organizer sites. Artifact is ready to download.

Do NOT:
- Paste the JSON array into the chat in addition to the artifact.
- Write a "here are all the races I found" section in chat.
- Write a "things I was uncertain about" section in chat.
- Propose follow-up actions or offer to build a webpage.

### Formatting rules inside the JSON

- No preamble, no greeting, no "Here's the JSON" line before the `[`.
- No markdown fence inside the artifact.
- No comments inside the JSON.
- No trailing commas.
- Two-space indentation is fine and preferred.
- Recap objects in date-ascending order (earliest race first).

## Quality checklist (apply this to every recap before including it)

Before adding a recap to your output, confirm all of these:

- [ ] Race date falls inside the `DATE WINDOW:` you parsed at the top.
- [ ] Race date is on or before today (the actual date you are running this).
- [ ] Race is in the geographic scope above.
- [ ] You verified the race happened on a primary source.
- [ ] Every factual claim in `content_md` traces to a source you visited.
- [ ] No invented finishers, times, weather, field sizes, or quotes.
- [ ] `id` is unique within your output and ends with `-YYYY-recap`.
- [ ] `photos` is `[]`.
- [ ] `title` is a factual news headline, no hype, no emoji.
- [ ] `content_md` is 3–5 paragraphs, factual, past tense, no marketing voice.

## Reference example

Match this style:

```json
{
  "id": "bayou-city-classic-10k-2025-recap",
  "race_id": null,
  "race_name": "Bayou City Classic 10K",
  "race_date": "2025-03-15",
  "title": "Bayou City Classic 10K opens Houston's spring road-racing season",
  "photos": [],
  "content_md": "The Bayou City Classic 10K drew runners to Sam Houston Park on Saturday, March 15, 2025, kicking off another spring racing season along Houston's downtown bayou corridor.\n\nThe out-and-back course ran along Allen Parkway and the Buffalo Bayou greenway, climbing less than 50 feet across its 10-kilometer distance. The flat profile and downtown skyline views on the return leg make it a frequent recommendation from local running clubs for those stepping up from the 5K distance for the first time.\n\nVolunteers staffed aid stations along the course, and finishers were greeted at the line with kolaches, a Central-European pastry that has become a Houston-area staple and, for many runners, a post-race tradition.\n\nA companion 5K was offered for runners preferring a shorter distance, and the event organizers supported a walk category open to all paces."
}
```

Now run the research and produce the output.

**Reminder of the output contract:**

1. Parse the `DATE WINDOW:` line at the top. Cap the upper end at today.
2. Find every recap-worthy race that happened in the window. Don't stop at 3 when there are 15.
3. Verify every factual claim against a real source. No invention.
4. Produce **exactly one code artifact**, titled `recaps-<start>-to-<end>.json`, containing a valid JSON array.
5. In the chat body, a single confirmation sentence stating the window and recap count. Nothing else.
