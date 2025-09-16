# 🏃‍♂️ ChatGPT Prompt: Houston Area Running Races Database

## 🎯 Mission
Find **high-quality, verified running races** in the greater Houston, Texas area occurring in **September 2025 only**. This data will populate a professional running race database used by thousands of Houston-area runners.

## 🗺️ Geographic Scope
**Primary Target**: Houston, Texas metropolitan area
**Included Cities**: Sugar Land, Katy, The Woodlands, Pearland, Spring, Cypress, Tomball, Kingwood, Clear Lake, League City, Pasadena, Baytown, Conroe, Missouri City, Richmond, Rosenberg, Friendswood, Galveston, La Porte, Deer Park, Humble, Stafford, Bellaire, West University Place, Jersey Village, Fulshear, Richmond, Rosenberg, Stafford, Bellaire, West University Place, Jersey Village, Fulshear
**Search Radius**: Within 60 miles of downtown Houston (29.7604°N, 95.3698°W)
**Timeframe**: September 2025 only (September 1-30, 2025)
**Priority**: Races with specific venue addresses over city-only locations

## 📋 Required Race Attributes
For each race, provide the following information in this **exact format**:

### 🏁 Essential Information
- **Race Name**: Full official name of the race (exactly as advertised)
- **Date**: Race date (YYYY-MM-DD format)
- **Start Time**: Race start time (HH:MM format, 24-hour)
- **Address**: Full street address of race venue (prefer specific venues over city centers)
- **City**: City name
- **State**: TX (Texas)
- **ZIP Code**: 5-digit ZIP code
- **Official Website URL**: Direct link to race registration/website (must be current and accessible)
  - **CRITICAL**: This must be the URL where users can REGISTER for the race, NOT the source where you found the race information
  - **Purpose**: Users will click this link to sign up for the race
  - **Examples**: Registration pages, race websites, Active.com, RunSignup, etc.

### 🏃‍♂️ Race Details
- **Distance**: Array of available distances (choose from: 5k, 10k, half marathon, marathon, ultra, other)
- **Surface Type**: One of: road, trail, track, virtual, other
- **Kid Run**: Boolean (true if children's distances like 1K, kids run, or family-friendly options available)

### 📍 Location Data
- **Latitude**: Decimal degrees (if available, prefer precise coordinates)
- **Longitude**: Decimal degrees (if available, prefer precise coordinates)
- **Timezone**: America/Chicago (Central Time)

## ✅ Data Quality Requirements
1. **🎯 Accuracy**: Only include races with confirmed dates and locations
2. **📊 Completeness**: Prioritize races with full address information
3. **🔍 Uniqueness**: Avoid duplicate races (same name and date)
4. **⏰ Specific Month**: Focus on races happening in September 2025 only
5. **✅ Verification**: Include only races with official websites or registration links
6. **🏢 Venue Specificity**: Prefer specific venues (parks, schools, businesses) over city centers
7. **🌐 Website Accessibility**: All URLs must be current and functional

## 🔍 Search Sources (Priority Order)
**Tier 1 - Most Reliable:**
- Official race websites and registration platforms
- Race timing companies (ChronoTrack, RunSignup, Active.com, etc.)
- Running club calendars (HARRA, Houston Area Road Runners Association)

**Tier 2 - High Quality:**
- Local running stores and community calendars
- City parks and recreation departments
- Charity organization websites
- University and school district events

**Tier 3 - Aggregators:**
- Running event aggregators (RunningInTheUSA, RaceRaves, FindARace, etc.)
- Local news and community event calendars
- Social media race announcements

## 📝 Output Format
Provide the data in this **exact structured format**:

```
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
Latitude: [decimal degrees if available]
Longitude: [decimal degrees if available]
Timezone: America/Chicago
---
```

## 🎯 Special Instructions
- **🏢 Address Priority**: Prefer specific venue addresses over city-only locations
- **⏰ Time Format**: Use 24-hour format (e.g., 07:00, 14:30)
- **📏 Distance Array**: List all available distances for the race
- **🌐 Website Links**: Must be direct links to registration or official race page
  - **IMPORTANT**: Provide the REGISTRATION URL, not the source where you found the race info
  - **User Action**: Users will click this to register for the race
- **📍 Geographic Accuracy**: Include coordinates when possible for precise location mapping
- **👶 Family-Friendly**: Mark as kid run if any children's distances or family activities are available
- **🏃‍♂️ Surface Types**: 
  - `road` = paved roads, streets, sidewalks
  - `trail` = unpaved trails, nature paths, off-road
  - `track` = running track, stadium
  - `virtual` = virtual/remote races
  - `other` = mixed surfaces or unique terrain

## ✅ Quality Checks
Before including each race, verify:
- [ ] Race date is in September 2025 (2025-09-01 to 2025-09-30)
- [ ] Location is within Houston metropolitan area (60-mile radius)
- [ ] Official website is accessible and current
- [ ] URL leads to race registration page (not source website)
- [ ] Address information is complete and specific
- [ ] Race details are accurate and up-to-date
- [ ] No duplicate races (same name + date)
- [ ] All required fields are populated

## 🎯 Expected Output
**Target**: 20-50 unique races for September 2025 with complete information
**Priority**: Quality over quantity - better to have fewer races with complete data than many races with missing information
**Focus**: Races with specific venue addresses and official registration websites
**Timeframe**: September 1-30, 2025 only

## 🚀 Pro Tips
- **Search Strategy**: Start with official race websites, then move to aggregators
- **Verification**: Cross-reference race details across multiple sources
- **Address Research**: Use Google Maps to verify and geocode addresses
- **Website Testing**: Click through to ensure registration links work
- **URL Verification**: Confirm URLs lead to race registration, not source websites
- **Date Confirmation**: Double-check race dates against official sources

---

**💡 Note**: This data will populate a professional running race database used by thousands of Houston-area runners, so accuracy and completeness are critical for user experience and trust.
