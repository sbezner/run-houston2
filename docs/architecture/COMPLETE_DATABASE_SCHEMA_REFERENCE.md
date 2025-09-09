# Complete Database Schema Reference

**Date Created**: September 9, 2025  
**Purpose**: Complete reference for recreating the Run Houston database schema from scratch  
**Database**: PostgreSQL with PostGIS extension  
**Version**: Current production schema as of 2025-09-09

## 🎯 **Quick Recreation Command**

To recreate this entire database schema, use this single prompt:

```
"Recreate the Run Houston database schema exactly as documented in docs/architecture/COMPLETE_DATABASE_SCHEMA_REFERENCE.md. Include all tables, functions, triggers, constraints, indexes, and extensions. Use PostgreSQL with PostGIS extension."
```

---

## 📋 **Schema Overview**

### **Core Tables**
- `races` - Main race information with geospatial data
- `clubs` - Running club information  
- `race_reports` - User-submitted race reports
- `admin_users` - Admin authentication
- `schema_migrations` - Migration tracking

### **Extensions Required**
- `postgis` (version 3.3.4) - Geospatial functionality

### **Functions**
- `set_race_geom()` - Auto-populate geometry from lat/lng
- `update_race_reports_updated_at()` - Auto-update timestamp
- `validate_distance_array()` - Validate distance array values

---

## 🗄️ **Table Definitions**

### **1. races Table**

```sql
CREATE TABLE races (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    tz TEXT NOT NULL DEFAULT 'America/Chicago',
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom GEOGRAPHY(POINT, 4326),
    distance TEXT[] DEFAULT ARRAY['5K'],
    surface TEXT,
    kid_run BOOLEAN DEFAULT FALSE,
    official_website_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT DEFAULT 'manual'
);

-- Indexes
CREATE UNIQUE INDEX races_pkey ON races USING btree (id);

-- Check Constraints
ALTER TABLE races ADD CONSTRAINT distance_check 
    CHECK (validate_distance_array(distance));

ALTER TABLE races ADD CONSTRAINT races_latlon_pair 
    CHECK (latitude IS NULL AND longitude IS NULL OR 
           latitude IS NOT NULL AND longitude IS NOT NULL);

ALTER TABLE races ADD CONSTRAINT surface_check 
    CHECK (surface = ANY (ARRAY['road', 'trail', 'track', 'virtual', 'other']));

-- Triggers
CREATE TRIGGER races_set_geom 
    BEFORE INSERT OR UPDATE OF latitude, longitude ON races 
    FOR EACH ROW EXECUTE FUNCTION set_race_geom();
```

### **2. clubs Table**

```sql
CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    club_name TEXT NOT NULL,
    location TEXT,
    website_url TEXT,
    description TEXT
);

-- Indexes
CREATE UNIQUE INDEX clubs_pkey ON clubs USING btree (id);
CREATE INDEX clubs_name_search_ci ON clubs USING btree (lower(club_name));
CREATE UNIQUE INDEX clubs_uniq_name_location_ci ON clubs 
    USING btree (lower(club_name), COALESCE(lower(location), ''));

-- Check Constraints
ALTER TABLE clubs ADD CONSTRAINT club_name_len 
    CHECK (char_length(club_name) >= 2 AND char_length(club_name) <= 200);

ALTER TABLE clubs ADD CONSTRAINT club_name_not_blank 
    CHECK (length(btrim(club_name)) > 0);

ALTER TABLE clubs ADD CONSTRAINT description_len 
    CHECK (description IS NULL OR char_length(description) <= 500);

ALTER TABLE clubs ADD CONSTRAINT location_len 
    CHECK (location IS NULL OR char_length(location) <= 120);

ALTER TABLE clubs ADD CONSTRAINT website_len 
    CHECK (website_url IS NULL OR char_length(website_url) <= 2048);

ALTER TABLE clubs ADD CONSTRAINT website_protocol 
    CHECK (website_url IS NULL OR website_url ~* '^https?://');
```

### **3. race_reports Table**

```sql
CREATE TABLE race_reports (
    id SERIAL PRIMARY KEY,
    race_id INTEGER,
    race_date DATE NOT NULL,
    title TEXT NOT NULL,
    author_name TEXT,
    content_md TEXT NOT NULL,
    photos TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    race_name TEXT NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX race_reports_pkey ON race_reports USING btree (id);
CREATE INDEX rr_created ON race_reports USING btree (created_at DESC);
CREATE INDEX rr_race_date_created ON race_reports USING btree (race_date DESC, created_at DESC);
CREATE INDEX rr_race_id_created ON race_reports USING btree (race_id, created_at DESC);

-- Foreign Key
ALTER TABLE race_reports ADD CONSTRAINT race_reports_race_id_fkey 
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE SET NULL;

-- Check Constraints
ALTER TABLE race_reports ADD CONSTRAINT race_reports_author_name_check 
    CHECK (author_name IS NULL OR 
           (char_length(author_name) >= 2 AND char_length(author_name) <= 80));

ALTER TABLE race_reports ADD CONSTRAINT race_reports_content_md_check 
    CHECK (char_length(content_md) >= 1 AND char_length(content_md) <= 20000);

ALTER TABLE race_reports ADD CONSTRAINT race_reports_title_check 
    CHECK (char_length(title) >= 3 AND char_length(title) <= 120);

-- Triggers
CREATE TRIGGER race_reports_updated_at_trigger 
    BEFORE UPDATE ON race_reports 
    FOR EACH ROW EXECUTE FUNCTION update_race_reports_updated_at();
```

### **4. admin_users Table**

```sql
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX admin_users_pkey ON admin_users USING btree (id);
CREATE UNIQUE INDEX admin_users_username_key ON admin_users USING btree (username);
CREATE INDEX idx_admin_users_username ON admin_users USING btree (username);
```

### **5. schema_migrations Table**

```sql
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    checksum VARCHAR(255),
    rollback_safe BOOLEAN DEFAULT false
);

-- Indexes
CREATE UNIQUE INDEX schema_migrations_pkey ON schema_migrations USING btree (version);
```

---

## ⚙️ **Functions**

### **1. set_race_geom() Function**

```sql
CREATE OR REPLACE FUNCTION set_race_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::GEOGRAPHY;
  ELSE
    NEW.geom := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **2. update_race_reports_updated_at() Function**

```sql
CREATE OR REPLACE FUNCTION update_race_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **3. validate_distance_array() Function**

```sql
CREATE OR REPLACE FUNCTION validate_distance_array(distance_array TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM unnest(distance_array) d 
    WHERE d NOT IN ('5k', '10k', 'half marathon', 'marathon', 'ultra', 'other')
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 **Extensions**

### **PostGIS Extension**

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
-- Version: 3.3.4
```

---

## 📊 **Column Descriptions**

### **races Table Columns**
- `id` - Primary key, auto-incrementing
- `name` - Race name (required)
- `date` - Race date (required)
- `start_time` - Race start time (optional)
- `tz` - Timezone (default: 'America/Chicago')
- `address` - Street address
- `city` - City name
- `state` - State name
- `zip` - ZIP code
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate
- `geom` - PostGIS geography point (auto-calculated from lat/lng)
- `distance` - Array of race distances (default: ['5K'])
- `surface` - Race surface type (road, trail, track, virtual, other)
- `kid_run` - Boolean for kid-friendly races
- `official_website_url` - Official race website
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp
- `source` - Data source (manual, csv_import, web_interface, etc.)

### **clubs Table Columns**
- `id` - Primary key, auto-incrementing
- `club_name` - Name of the running club (required, 2-200 chars)
- `location` - City/area where club is located (max 120 chars)
- `website_url` - Official website URL (max 2048 chars, must start with http/https)
- `description` - Club description (max 500 chars)

### **race_reports Table Columns**
- `id` - Primary key, auto-incrementing
- `race_id` - Foreign key to races table (nullable, SET NULL on delete)
- `race_date` - User-provided race date (required)
- `title` - Report title (required, 3-120 chars)
- `author_name` - Author name (optional, 2-80 chars)
- `content_md` - Markdown content (required, 1-20,000 chars)
- `photos` - Array of photo URLs (default: empty array)
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp (auto-updated)
- `race_name` - Race name (required, can be edited independently)

### **admin_users Table Columns**
- `id` - Primary key, auto-incrementing
- `username` - Unique username for admin login
- `password_hash` - Bcrypt hashed password
- `created_at` - Record creation timestamp
- `updated_at` - Record update timestamp

### **schema_migrations Table Columns**
- `version` - Migration version identifier (primary key)
- `applied_at` - When migration was applied
- `description` - Migration description
- `checksum` - Migration file checksum
- `rollback_safe` - Whether migration can be safely rolled back

---

## 🔗 **Relationships**

1. **race_reports → races**: Many-to-one relationship
   - `race_reports.race_id` → `races.id`
   - ON DELETE SET NULL (reports become orphaned if race is deleted)

---

## 🎯 **Key Constraints**

### **Data Validation**
- Distance arrays must contain only valid values: '5k', '10k', 'half marathon', 'marathon', 'ultra', 'other'
- Surface types limited to: 'road', 'trail', 'track', 'virtual', 'other'
- Latitude/longitude must both be present or both be null
- Website URLs must start with http:// or https://
- Text fields have length limits for data integrity

### **Uniqueness**
- Club names must be unique per location (case-insensitive)
- Admin usernames must be unique
- Migration versions must be unique

---

## 🚀 **Recreation Steps**

1. **Create PostgreSQL database**
2. **Install PostGIS extension**
3. **Create all functions** (in order: set_race_geom, update_race_reports_updated_at, validate_distance_array)
4. **Create tables** (in order: races, clubs, race_reports, admin_users, schema_migrations)
5. **Add constraints and indexes**
6. **Create triggers**

---

## 📝 **Notes**

- All timestamps use `TIMESTAMPTZ` for timezone awareness
- Geospatial data uses PostGIS `GEOGRAPHY(POINT, 4326)` for accurate distance calculations
- Array fields use PostgreSQL native array types
- Check constraints provide data validation at the database level
- Triggers automatically maintain data consistency (geometry, timestamps)
- Foreign key relationships use `ON DELETE SET NULL` to preserve data integrity

---

**Last Updated**: September 9, 2025  
**Schema Version**: Current production  
**Database Engine**: PostgreSQL with PostGIS 3.3.4
