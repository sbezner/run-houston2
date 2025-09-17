# === Parameters (single point of change) ===
MONTH_NAME=September
YEAR=2025
MM=09
RADIUS_MI=60
# === End parameters ===

# === Mission ===
You are GPT-5 operating as a Senior Data Scientist + Software Engineer hybrid agent. 
Your task is to generate a **complete, verified dataset of all running races** in the Greater Houston metropolitan area occurring in {MONTH_NAME} {YEAR}.

This dataset will be consumed by thousands of runners via a professional race database and must meet production-level quality standards.

# === Scope & Inclusion Criteria ===
1. **Geographic Filter**
   - Center: Downtown Houston (29.7604, -95.3698).
   - Radius: {RADIUS_MI} miles.
   - Cities explicitly in scope: Sugar Land, Katy, The Woodlands, Pearland, Spring, Cypress, Tomball, Kingwood, Clear Lake, League City, Pasadena, Baytown, Conroe, Missouri City, Richmond, Rosenberg, Friendswood, Galveston, La Porte, Deer Park, Humble, Stafford, Bellaire, West University Place, Jersey Village, Fulshear.

2. **Temporal Filter**
   - Range: {YEAR}-{MM}-01 through {YEAR}-{MM}-LAST.

3. **Event Eligibility**
   - Race must have a confirmed date **and** published start time.
   - Must provide a **specific venue street address** (not city-only).
   - Must have a **working official registration URL** (RunSignup, Race Roster, Active, official race site, or timing provider).
   - Must specify distances (subset of: [5k, 10k, half marathon, marathon, ultra, other]).
   - Must specify surface (one of: [road, trail, track, virtual, other]).
   - Include **festival-vibe runs** (EDM 5Ks, brewery/ballpark runs) if registration is official.
   - Exclude weekly parkruns and recurring training loops.
   - Deduplicate on normalized {Race Name + Date}.

# === Data Model ===
For each race, output in the following canonical schema:

Race Name: [Full Official Name]  
Date: YYYY-MM-DD  
Start Time: HH:MM  
Address: [Full Street Address]  
City: [City Name]  
State: TX  
ZIP: [5-digit ZIP]  
Official Website URL: [Direct registration link]  
Distance: [5k, 10k, half marathon, marathon, ultra, other]  
Surface: [road, trail, track, virtual, other]  
Kid Run: [true/false]  
Latitude: [decimal degrees]  
Longitude: [decimal degrees]  
Timezone: America/Chicago  
---

# === Verification Protocol ===
- Use **web search + official race websites** as primary truth.
- Cross-reference at least two sources when details conflict.
- Prefer the registration page for URLs.
- Validate registration links load.
- Geocode each venue address (Google Maps or equivalent) to capture accurate lat/long.
- If multiple waves exist, log the **earliest competitive start**.
- If any field is missing or unverifiable, exclude the race.

# === Output Requirements ===
1. Emit **one race block per event** in the schema above.  
2. After all race blocks, emit a **summary table** with columns:  
   Race Name | Date | Start Time | Address | City | State | ZIP | Official Website URL | Distance | Surface | Kid Run | Latitude | Longitude | Timezone  
3. Provide **citations per race** to official sources.  
4. Ensure output is exhaustive. If there are more events than can fit in one response, continue outputting in additional messages until the set is complete.  
5. When all races for {MONTH_NAME} {YEAR} are processed, end with `DONE`.  

# === Quality Bar ===
- Accuracy and completeness over quantity.  
- No duplicates.  
- No dead links.  
- All required fields populated.  
- Minimum dataset size: >=20 races unless fewer legitimately exist.  

# === Execution ===
Begin now. Parse and emit until **all qualifying races** are captured. Do not truncate. Continue until exhaustive.  
git g