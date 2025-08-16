from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import psycopg
from datetime import timedelta, date, time

from .auth import verify_password, create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
from .models import AdminLogin, AdminLoginResponse, RaceCreate, RaceUpdate, RaceResponse

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
        SELECT id, name, date, start_time, address, city, state, zip, latitude, longitude,
               surface, kid_run, official_website_url
        FROM races
        ORDER BY date ASC
        LIMIT 50
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    cols = ["id","name","date","start_time","address","city","state","zip","latitude","longitude",
            "surface","kid_run","official_website_url"]
    return [dict(zip(cols, r)) for r in rows]

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
        SELECT id, name, date, start_time, address, city, state, zip, latitude, longitude,
               surface, kid_run, official_website_url
        FROM races
        ORDER BY date ASC
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    cols = ["id","name","date","start_time","address","city","state","zip","latitude","longitude",
            "surface","kid_run","official_website_url"]
    return [dict(zip(cols, r)) for r in rows]

@app.post("/races", response_model=RaceResponse)
def create_race(race_data: RaceCreate, current_admin: dict = Depends(get_current_admin)):
    """Create a new race (admin only)."""
    sql = """
        INSERT INTO races (name, date, start_time, address, city, state, zip, surface, kid_run, 
                          official_website_url, latitude, longitude)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, name, date, start_time, address, city, state, zip, surface, kid_run, 
                  official_website_url, latitude, longitude
    """
    
    with get_conn() as conn, conn.cursor() as cur:
        # Convert string date to Python date object if needed
        race_date = race_data.date
        if isinstance(race_date, str):
            race_date = date.fromisoformat(race_date)
            
        # Convert string time to Python time object if needed
        race_start_time = race_data.start_time
        if isinstance(race_start_time, str):
            race_start_time = time.fromisoformat(race_start_time)
            
        cur.execute(sql, (
            race_data.name, race_date, race_start_time, race_data.address,
            race_data.city, race_data.state, race_data.zip, race_data.surface, race_data.kid_run,
            str(race_data.official_website_url) if race_data.official_website_url else None,
            race_data.latitude, race_data.longitude
        ))
        row = cur.fetchone()
        conn.commit()
    
    cols = ["id","name","date","start_time","address","city","state","zip","surface","kid_run",
            "official_website_url","latitude","longitude"]
    return dict(zip(cols, row))

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
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Add race_id to values for WHERE clause
    values.append(race_id)
    
    sql = f"""
        UPDATE races 
        SET {', '.join(update_fields)}, updated_at = NOW()
        WHERE id = %s
        RETURNING id, name, date, start_time, address, city, state, zip, surface, kid_run, 
                  official_website_url, latitude, longitude
    """
    
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, values)
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Race not found")
        conn.commit()
    
    cols = ["id","name","date","start_time","address","city","state","zip","surface","kid_run",
            "official_website_url","latitude","longitude"]
    return dict(zip(cols, row))

@app.delete("/races/{race_id}")
def delete_race(race_id: int, current_admin: dict = Depends(get_current_admin)):
    """Delete a race (admin only)."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM races WHERE id = %s RETURNING id", (race_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Race not found")
        conn.commit()
    
    return {"message": "Race deleted successfully"}
