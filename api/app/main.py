from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
import os
import psycopg
from datetime import timedelta, date, time
import csv
import io

from .auth import verify_password, create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
from .models import AdminLogin, AdminLoginResponse, RaceCreate, RaceUpdate, RaceResponse, ClubCreate, ClubUpdate, ClubResponse

app = FastAPI(title="Run Houston API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rh_user:rh_pass@localhost:5432/runhou")
security = HTTPBearer()

def get_conn():
    # psycopg 3 connection
    return psycopg.connect(DATABASE_URL)

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify admin token and return admin info."""
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/races")
def list_races():
    sql = """
        SELECT id, name, date, start_time, tz, address, city, state, zip, latitude, longitude,
               geom, distance, surface, kid_run, official_website_url, source, created_at, updated_at
        FROM races
        ORDER BY date ASC
        LIMIT 50
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    cols = ["id","name","date","start_time","tz","address","city","state","zip","latitude","longitude",
            "geom","distance","surface","kid_run","official_website_url","source","created_at","updated_at"]
    races = []
    for r in rows:
        race = dict(zip(cols, r))
        # Convert date and time objects to strings for JSON serialization
        if race['date']:
            race['date'] = race['date'].isoformat()
        if race['start_time']:
            race['start_time'] = race['start_time'].isoformat()
        if race['created_at']:
            race['created_at'] = race['created_at'].isoformat()
        if race['updated_at']:
            race['updated_at'] = race['updated_at'].isoformat()
        races.append(race)
    return races

@app.post("/admin/login", response_model=AdminLoginResponse)
def admin_login(login_data: AdminLogin):
    """Admin login endpoint."""
    # Verify credentials against database
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT password_hash FROM admin_users WHERE username = %s", (login_data.username,))
        result = cur.fetchone()
        
    if not result or not verify_password(login_data.password, result[0]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": login_data.username}, expires_delta=access_token_expires
    )
    
    return AdminLoginResponse(
        access_token=access_token,
        username=login_data.username
    )

@app.get("/admin/races", response_model=list[RaceResponse])
def admin_list_races(current_admin: dict = Depends(get_current_admin)):
    """Admin endpoint to get all races (no 30-day filter)."""
    sql = """
        SELECT id, name, date, start_time, tz, address, city, state, zip, latitude, longitude,
               geom, distance, surface, kid_run, official_website_url, source, created_at, updated_at
        FROM races
        ORDER BY date ASC
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    cols = ["id","name","date","start_time","tz","address","city","state","zip","latitude","longitude",
            "geom","distance","surface","kid_run","official_website_url","source","created_at","updated_at"]
    races = []
    for r in rows:
        race = dict(zip(cols, r))
        # Convert date and time objects to strings for JSON serialization
        if race['date']:
            race['date'] = race['date'].isoformat()
        if race['start_time']:
            race['start_time'] = race['start_time'].isoformat()
        if race['created_at']:
            race['created_at'] = race['created_at'].isoformat()
        if race['updated_at']:
            race['updated_at'] = race['updated_at'].isoformat()
        races.append(race)
    
    return races

@app.post("/races", response_model=RaceResponse)
def create_race(race_data: RaceCreate, current_admin: dict = Depends(get_current_admin)):
    """Create or update a race (admin only)."""
    
    # Convert string date to Python date object if needed
    race_date = race_data.date
    if isinstance(race_date, str):
        race_date = date.fromisoformat(race_date)
        
    # Convert string time to Python time object if needed
    race_start_time = race_data.start_time
    if isinstance(race_start_time, str):
        race_start_time = time.fromisoformat(race_start_time)
    
    operation_type = "created"  # Default to created
    
    with get_conn() as conn, conn.cursor() as cur:
        if race_data.id is not None:
            # Check if race with this ID already exists
            cur.execute("SELECT id FROM races WHERE id = %s", (race_data.id,))
            existing_race = cur.fetchone()
            
            if existing_race:
                operation_type = "updated"
            
            # UPSERT: Insert or update based on ID
            sql = """
                INSERT INTO races (id, name, date, start_time, tz, address, city, state, zip, latitude, longitude, 
                                  distance, surface, kid_run, official_website_url, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    date = EXCLUDED.date,
                    start_time = EXCLUDED.start_time,
                    address = EXCLUDED.address,
                    city = EXCLUDED.city,
                    state = EXCLUDED.state,
                    zip = EXCLUDED.zip,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    distance = EXCLUDED.distance,
                    surface = EXCLUDED.surface,
                    kid_run = EXCLUDED.kid_run,
                    official_website_url = EXCLUDED.official_website_url,
                    source = EXCLUDED.source,
                    updated_at = NOW()
                RETURNING id, name, date, start_time, tz, address, city, state, zip, latitude, longitude,
                          geom, distance, surface, kid_run, official_website_url, source, created_at, updated_at
            """
            values = (
                race_data.id, race_data.name, race_date, race_start_time, 'America/Chicago', race_data.address,
                race_data.city, race_data.state, race_data.zip, race_data.latitude, race_data.longitude,
                race_data.distance or ['5K'], race_data.surface, race_data.kid_run,
                str(race_data.official_website_url) if race_data.official_website_url else None,
                race_data.source or 'web_interface'
            )
        else:
            # INSERT: Create new race without ID
            sql = """
                INSERT INTO races (name, date, start_time, tz, address, city, state, zip, latitude, longitude, 
                                  distance, surface, kid_run, official_website_url, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, name, date, start_time, tz, address, city, state, zip, latitude, longitude,
                          geom, distance, surface, kid_run, official_website_url, source, created_at, updated_at
            """
            values = (
                race_data.name, race_date, race_start_time, 'America/Chicago', race_data.address,
                race_data.city, race_data.state, race_data.zip, race_data.latitude, race_data.longitude,
                race_data.distance or ['5K'], race_data.surface, race_data.kid_run,
                str(race_data.official_website_url) if race_data.official_website_url else None,
                race_data.source or 'web_interface'
            )
        
        cur.execute(sql, values)
        row = cur.fetchone()
        conn.commit()
    
    # Map the returned columns to their expected names
    # The SQL RETURNING clause returns: id, name, date, start_time, tz, address, city, state, zip, latitude, longitude, geom, distance, surface, kid_run, official_website_url, source, created_at, updated_at
    cols = ["id","name","date","start_time","tz","address","city","state","zip","latitude","longitude",
            "geom","distance","surface","kid_run","official_website_url","source","created_at","updated_at"]
    result = dict(zip(cols, row))
    
    # Convert date and time objects to strings for JSON serialization
    if result['date']:
        result['date'] = result['date'].isoformat()
    if result['start_time']:
        result['start_time'] = result['start_time'].isoformat()
    if result['created_at']:
        result['created_at'] = result['created_at'].isoformat()
    if result['updated_at']:
        result['updated_at'] = result['updated_at'].isoformat()
    
    # Add operation type to response body for frontend tracking (more reliable than headers)
    from fastapi.responses import JSONResponse
    print(f"DEBUG: Setting operation_type to: '{operation_type}' for race ID: {result.get('id')}")
    
    # Include operation type in response body
    result_with_operation = {
        **result,
        "operation_type": operation_type
    }
    
    return JSONResponse(content=result_with_operation)

@app.put("/races/{race_id}", response_model=RaceResponse)
def update_race(race_id: int, race_data: RaceUpdate, current_admin: dict = Depends(get_current_admin)):
    """Update an existing race (admin only)."""
    # Build dynamic UPDATE query
    update_fields = []
    values = []
    
    if race_data.name is not None:
        update_fields.append("name = %s")
        values.append(race_data.name)
    if race_data.date is not None:
        update_fields.append("date = %s")
        # Convert string date to Python date object if needed
        if isinstance(race_data.date, str):
            values.append(date.fromisoformat(race_data.date))
        else:
            values.append(race_data.date)
    if race_data.start_time is not None:
        update_fields.append("start_time = %s")
        # Convert string time to Python time object if needed
        if isinstance(race_data.start_time, str):
            values.append(time.fromisoformat(race_data.start_time))
        else:
            values.append(race_data.start_time)
    if race_data.address is not None:
        update_fields.append("address = %s")
        values.append(race_data.address)
    if race_data.city is not None:
        update_fields.append("city = %s")
        values.append(race_data.city)
    if race_data.state is not None:
        update_fields.append("state = %s")
        values.append(race_data.state)
    if race_data.zip is not None:
        update_fields.append("zip = %s")
        values.append(race_data.zip)
    if race_data.surface is not None:
        update_fields.append("surface = %s")
        values.append(race_data.surface)
    if race_data.distance is not None:
        update_fields.append("distance = %s")
        values.append(race_data.distance)
    if race_data.kid_run is not None:
        update_fields.append("kid_run = %s")
        values.append(race_data.kid_run)
    if race_data.official_website_url is not None:
        update_fields.append("official_website_url = %s")
        values.append(str(race_data.official_website_url))
    if race_data.latitude is not None:
        update_fields.append("latitude = %s")
        values.append(race_data.latitude)
    if race_data.longitude is not None:
        update_fields.append("longitude = %s")
        values.append(race_data.longitude)
    if race_data.source is not None:
        update_fields.append("source = %s")
        values.append(race_data.source)
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Add race_id to values for WHERE clause
    values.append(race_id)
    
    sql = f"""
        UPDATE races 
        SET {', '.join(update_fields)}, updated_at = NOW()
        WHERE id = %s
        RETURNING id, name, date, start_time, tz, address, city, state, zip, latitude, longitude,
                  geom, distance, surface, kid_run, official_website_url, source, created_at, updated_at
    """
    
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, values)
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Race not found")
        conn.commit()
    
    cols = ["id","name","date","start_time","tz","address","city","state","zip","latitude","longitude",
            "geom","distance","surface","kid_run","official_website_url","source","created_at","updated_at"]
    result = dict(zip(cols, row))
    
    # Convert date and time objects to strings for JSON serialization
    if result['date']:
        result['date'] = result['date'].isoformat()
    if result['start_time']:
        result['start_time'] = result['start_time'].isoformat()
    if result['created_at']:
        result['created_at'] = result['created_at'].isoformat()
    if result['updated_at']:
        result['updated_at'] = result['updated_at'].isoformat()
    
    return result

@app.delete("/races/{race_id}")
def delete_race(race_id: int, current_admin: dict = Depends(get_current_admin)):
    """Delete a race (admin only)."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM races WHERE id = %s RETURNING id", (race_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Race not found")
        conn.commit()
    
    return {"message": "Race deleted successfully"}


# Club Endpoints

@app.get("/clubs", response_model=list[ClubResponse])
def list_clubs():
    """List all clubs."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, club_name, location, website_url FROM clubs ORDER BY club_name ASC")
        rows = cur.fetchall()
        return [ClubResponse(id=r[0], club_name=r[1], location=r[2], website_url=r[3]) for r in rows]


@app.get("/admin/clubs", response_model=list[ClubResponse])
def admin_list_clubs(current_admin: dict = Depends(get_current_admin)):
    """List all clubs (admin only)."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, club_name, location, website_url FROM clubs ORDER BY club_name ASC")
        rows = cur.fetchall()
        return [ClubResponse(id=r[0], club_name=r[1], location=r[2], website_url=r[3]) for r in rows]


@app.post("/clubs", response_model=ClubResponse)
def create_club(club: ClubCreate, current_admin: dict = Depends(get_current_admin)):
    """Create a new club (admin only)."""
    try:
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO clubs (club_name, location, website_url) VALUES (%s, %s, %s) RETURNING id, club_name, location, website_url",
                (club.club_name, club.location, club.website_url)
            )
            row = cur.fetchone()
            conn.commit()
            return ClubResponse(id=row[0], club_name=row[1], location=row[2], website_url=row[3])
    except psycopg.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Club already exists")


@app.put("/clubs/{club_id}", response_model=ClubResponse)
def update_club(club_id: int, club_data: ClubUpdate, current_admin: dict = Depends(get_current_admin)):
    """Update a club (admin only)."""
    update_fields = []
    values = []
    
    if club_data.club_name is not None:
        update_fields.append("club_name = %s")
        values.append(club_data.club_name)
    if club_data.location is not None:
        update_fields.append("location = %s")
        values.append(club_data.location)
    if club_data.website_url is not None:
        update_fields.append("website_url = %s")
        values.append(club_data.website_url)
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Add club_id to values for WHERE clause
    values.append(club_id)
    
    sql = f"""
        UPDATE clubs 
        SET {', '.join(update_fields)}
        WHERE id = %s
        RETURNING id, club_name, location, website_url
    """
    
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, values)
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Club not found")
        conn.commit()
    
    return ClubResponse(id=row[0], club_name=row[1], location=row[2], website_url=row[3])


@app.delete("/clubs/{club_id}")
def delete_club(club_id: int, current_admin: dict = Depends(get_current_admin)):
    """Delete a club (admin only)."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM clubs WHERE id = %s RETURNING id", (club_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Club not found")
        conn.commit()
    
    return {"message": "Club deleted successfully"}


@app.get("/admin/clubs/export-csv")
def export_clubs_csv(current_admin: dict = Depends(get_current_admin)):
    """Export clubs to CSV."""
    try:
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute("SELECT id, club_name, location, website_url FROM clubs ORDER BY club_name")
            rows = cur.fetchall()
            
        # Create CSV content with all fields including ID
        csv_content = "id,club_name,location,website_url\n"
        for row in rows:
            csv_content += f'"{row[0]}","{row[1]}","{row[2] or ""}","{row[3] or ""}"\n'
        
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=clubs.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/clubs/import-csv")
def import_clubs_csv(
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin)
):
    """Import clubs from CSV."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        content = file.file.read().decode('utf-8')
        
        # Use proper CSV parser
        csv_reader = csv.reader(io.StringIO(content))
        lines = list(csv_reader)
        
        if len(lines) < 2:
            raise HTTPException(status_code=400, detail="CSV must have at least a header and one data row")
        
        # Skip header row
        data_rows = lines[1:]
        imported_count = 0
        updated_count = 0
        errors = []
        
        # Process all data first to validate everything
        processed_data = []
        for line_num, row in enumerate(data_rows, start=2):
            if not row or len(row) == 0:
                continue
                
            print(f"Raw CSV line {line_num}: {row}")
            
            if len(row) >= 4:
                club_id = row[0].strip()
                club_name = row[1].strip()
                location = row[2].strip() if row[2].strip() else None
                website_url = row[3].strip() if row[3].strip() else None
                
                print(f"Parsed values: id='{club_id}', name='{club_name}', location='{location}', website='{website_url}'")
                
                # Validate website URL if provided
                if website_url and website_url.strip():
                    # Check if URL has proper protocol
                    if not website_url.startswith(('http://', 'https://')):
                        errors.append(f"Line {line_num}: Invalid website URL '{website_url}' - must start with http:// or https://")
                        continue
                    # Check URL length
                    if len(website_url) > 2048:
                        errors.append(f"Line {line_num}: Website URL too long ({len(website_url)} chars, max 2048)")
                        continue
                else:
                    # Set to None if empty or just whitespace
                    website_url = None
                
                # Validate other constraints
                if not club_name or len(club_name.strip()) < 2:
                    errors.append(f"Line {line_num}: Club name too short (min 2 characters)")
                    continue
                
                if len(club_name) > 200:
                    errors.append(f"Line {line_num}: Club name too long ({len(club_name)} chars, max 200)")
                    continue
                
                if location and len(location) > 120:
                    errors.append(f"Line {line_num}: Location too long ({len(location)} chars, max 120)")
                    continue
                
                # Debug logging for constraint violations
                print(f"Processing line {line_num}: id='{club_id}', name='{club_name}', location='{location}', website='{website_url}'")
                
                if club_name:
                    processed_data.append({
                        'line_num': line_num,
                        'club_id': club_id,
                        'club_name': club_name,
                        'location': location,
                        'website_url': website_url
                    })
                    print(f"Added to processed_data. Total items: {len(processed_data)}")
            else:
                print(f"Line {line_num} has insufficient parts ({len(row)} < 4), skipping")
        
        print(f"Validation complete. Processed {len(processed_data)} items, {len(errors)} errors")
        if errors:
            print("Errors found:", errors)
        
        # If there are validation errors, return them without trying to import
        if errors:
            return {
                "message": "Import validation failed",
                "errors": errors
            }
        
        # Now process the validated data in a single database transaction
        with get_conn() as conn, conn.cursor() as cur:
            for data in processed_data:
                club_id = data['club_id']
                club_name = data['club_name']
                location = data['location']
                website_url = data['website_url']
                
                print(f"Processing database operation: id='{club_id}', name='{club_name}', location='{location}', website='{website_url}'")
                
                # Check if ID exists and is not blank
                if club_id and club_id.strip() and club_id != 'null' and club_id != '':
                    try:
                        club_id_int = int(club_id)
                        print(f"Attempting UPDATE for ID {club_id_int}")
                        # Try to update existing club by ID
                        cur.execute("""
                            UPDATE clubs 
                            SET club_name = %s, location = %s, website_url = %s
                            WHERE id = %s
                        """, (club_name, location, website_url, club_id_int))
                        
                        if cur.rowcount > 0:
                            updated_count += 1
                            print(f"UPDATE successful for ID {club_id_int}")
                        else:
                            print(f"ID {club_id_int} not found, creating new club instead")
                            # ID not found, create new club
                            cur.execute("""
                                INSERT INTO clubs (club_name, location, website_url) 
                                VALUES (%s, %s, %s)
                            """, (club_name, location, website_url))
                            imported_count += 1
                            print(f"INSERT successful for new club (was ID {club_id_int})")
                    except ValueError:
                        print(f"Invalid ID '{club_id}', creating new club")
                        # Invalid ID, create new club
                        cur.execute("""
                            INSERT INTO clubs (club_name, location, website_url) 
                            VALUES (%s, %s, %s)
                        """, (club_name, location, website_url))
                        imported_count += 1
                        print(f"INSERT successful for new club (invalid ID)")
                else:
                    print(f"No ID provided, creating new club")
                    # No ID or blank ID, create new club
                    cur.execute("""
                        INSERT INTO clubs (club_name, location, website_url) 
                        VALUES (%s, %s, %s)
                    """, (club_name, location, website_url))
                    imported_count += 1
                    print(f"INSERT successful for new club (no ID)")
            
            print(f"Database operations completed. Committing transaction...")
            # Commit all changes at once
            conn.commit()
            print(f"Transaction committed successfully")
        
        return {
            "message": f"Import completed successfully: {imported_count} new clubs created, {updated_count} existing clubs updated"
        }
        
    except Exception as e:
        print(f"Import error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
