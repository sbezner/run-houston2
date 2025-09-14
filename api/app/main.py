from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse, Response
import os
import psycopg
from datetime import timedelta, date, time
import csv
import io
import json
from typing import Optional
from dotenv import load_dotenv
from bcrypt import hashpw, gensalt

# Load environment variables from .env file
load_dotenv()

from .auth import verify_password, create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES

def load_version_info():
    """Load version information from system release manifest."""
    try:
        # Try multiple possible locations for system-release.json
        possible_paths = [
            'system-release.json',  # Current directory
            'api/system-release.json',  # API directory
            'releases/system-release.json',  # Releases directory
            '../releases/system-release.json',  # Relative to API directory
        ]
        
        for path in possible_paths:
            try:
                with open(path, 'r') as f:
                    version_data = json.load(f)
                return version_data
            except FileNotFoundError:
                continue
        
        # If none found, raise FileNotFoundError
        raise FileNotFoundError("system-release.json not found in any expected location")
        
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Warning: Could not load version info: {e}")
        # Fallback values
        return {
            "api": "1.0.0",
            "db_schema": "20250909_2026_complete_database_schema",
            "api_path_major": "v1"
        }
from .models import (
    AdminLogin, AdminLoginResponse, RaceCreate, RaceUpdate, RaceResponse, 
    ClubCreate, ClubUpdate, ClubResponse, RaceReportCreate, RaceReportUpdate
)

# Monitoring and metrics
import time
from collections import defaultdict
from datetime import datetime, timezone

# Global metrics storage (in production, use Redis or similar)
metrics = {
    "version_usage": defaultdict(int),
    "api_calls": defaultdict(int),
    "error_counts": defaultdict(int),
    "response_times": [],
    "startup_time": datetime.now(timezone.utc),
    "last_deployment": None
}

def track_api_call(endpoint: str, method: str, response_time: float, status_code: int):
    """Track API call metrics."""
    key = f"{method} {endpoint}"
    metrics["api_calls"][key] += 1
    metrics["response_times"].append({
        "endpoint": endpoint,
        "method": method,
        "response_time": response_time,
        "status_code": status_code,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Keep only last 1000 response times
    if len(metrics["response_times"]) > 1000:
        metrics["response_times"] = metrics["response_times"][-1000:]

def track_version_usage(version: str, client_type: str = "unknown"):
    """Track version usage by client type."""
    key = f"{version}_{client_type}"
    metrics["version_usage"][key] += 1

def track_error(error_type: str, endpoint: str):
    """Track error occurrences."""
    key = f"{error_type}_{endpoint}"
    metrics["error_counts"][key] += 1

def get_version_metrics():
    """Get version usage metrics."""
    return {
        "version_usage": dict(metrics["version_usage"]),
        "total_api_calls": sum(metrics["api_calls"].values()),
        "total_errors": sum(metrics["error_counts"].values()),
        "uptime_seconds": (datetime.now(timezone.utc) - metrics["startup_time"]).total_seconds(),
        "last_deployment": metrics["last_deployment"]
    }

def get_performance_metrics():
    """Get performance metrics."""
    response_times = metrics["response_times"]
    if not response_times:
        return {"average_response_time": 0, "slowest_endpoints": []}
    
    avg_time = sum(rt["response_time"] for rt in response_times) / len(response_times)
    
    # Group by endpoint and calculate averages
    endpoint_times = defaultdict(list)
    for rt in response_times:
        endpoint_times[rt["endpoint"]].append(rt["response_time"])
    
    slowest = []
    for endpoint, times in endpoint_times.items():
        avg_endpoint_time = sum(times) / len(times)
        slowest.append({"endpoint": endpoint, "average_time": avg_endpoint_time})
    
    slowest.sort(key=lambda x: x["average_time"], reverse=True)
    
    return {
        "average_response_time": avg_time,
        "slowest_endpoints": slowest[:10],
        "total_requests": len(response_times)
    }

app = FastAPI(title="Run Houston API", version="0.1")

# Environment variables with safe defaults
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
API_VERSION = os.getenv("API_VERSION", "v1.0.0")
X_CLIENT_APP = os.getenv("X-Client-App", "runhouston-api-dev")
X_CLIENT_VERSION = os.getenv("X-Client-Version", "dev")

@app.on_event("startup")
async def startup_event():
    """Initialize admin user on startup."""
    create_admin_user()

# Debug middleware removed for production readiness

# Read CORS origins from environment variable
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "https://run-houston.onrender.com,http://localhost:5173,http://localhost:5174"
).split(",")

# Remove any whitespace from origins
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Version headers middleware
@app.middleware("http")
async def add_version_headers(request: Request, call_next):
    """Add version headers to all API responses."""
    # Load version info
    version_info = load_version_info()
    
    # Process the request
    response = await call_next(request)
    
    # Add version headers
    response.headers["API-Version"] = API_VERSION
    response.headers["API-Path-Major"] = version_info.get("api_path_major", "v1")
    response.headers["Schema-Version"] = version_info.get("db_schema", "20250909_2026_complete_database_schema")
    response.headers["X-Client-App"] = X_CLIENT_APP
    response.headers["X-Client-Version"] = X_CLIENT_VERSION
    
    return response

@app.middleware("http")
async def track_requests(request: Request, call_next):
    """Track API requests for monitoring."""
    start_time = time.time()
    
    # Extract client type from User-Agent or custom header
    user_agent = request.headers.get("user-agent", "").lower()
    client_type = "unknown"
    if "mobile" in user_agent or "expo" in user_agent:
        client_type = "mobile"
    elif "mozilla" in user_agent or "chrome" in user_agent or "safari" in user_agent:
        client_type = "web"
    
    response = await call_next(request)
    
    # Calculate response time
    response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
    
    # Track the API call
    track_api_call(
        endpoint=request.url.path,
        method=request.method,
        response_time=response_time,
        status_code=response.status_code
    )
    
    # Track version usage if this is a version endpoint
    if request.url.path == "/api/v1/version":
        version_info = load_version_info()
        track_version_usage(version_info.get("api", "1.0.0"), client_type)
    
    # Track errors
    if response.status_code >= 400:
        error_type = "client_error" if response.status_code < 500 else "server_error"
        track_error(error_type, request.url.path)
    
    return response

# Database configuration from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Fallback to individual environment variables
    POSTGRES_USER = os.getenv("POSTGRES_USER")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
    POSTGRES_DB = os.getenv("POSTGRES_DB")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT")
    
    if not all([POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT]):
        raise ValueError("Database configuration incomplete. Set DATABASE_URL or all individual POSTGRES_* environment variables")
    
    DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
security = HTTPBearer()

def get_conn():
    # psycopg 3 connection
    return psycopg.connect(DATABASE_URL)

def create_admin_user():
    """Create admin user from environment variables if it doesn't exist."""
    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")
    
    if not admin_username or not admin_password:
        raise ValueError("ADMIN_USERNAME and ADMIN_PASSWORD environment variables must be set")
    
    # Hash the password
    password_hash = hashpw(admin_password.encode('utf-8'), gensalt()).decode('utf-8')
    
    try:
        with get_conn() as conn, conn.cursor() as cur:
            # Check if admin user exists
            cur.execute("SELECT id FROM admin_users WHERE username = %s", (admin_username,))
            existing_user = cur.fetchone()
            
            if existing_user:
                # Update existing user's password
                cur.execute(
                    "UPDATE admin_users SET password_hash = %s, updated_at = NOW() WHERE username = %s",
                    (password_hash, admin_username)
                )
                print(f"Updated admin user '{admin_username}' password")
            else:
                # Create new admin user
                cur.execute(
                    "INSERT INTO admin_users (username, password_hash) VALUES (%s, %s)",
                    (admin_username, password_hash)
                )
                print(f"Created admin user '{admin_username}'")
            
            conn.commit()
            print("Admin user initialization completed successfully")
            
    except Exception as e:
        print(f"ERROR: Failed to initialize admin user: {e}")

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
    """Health check endpoint with version information."""
    version_info = load_version_info()
    version_metrics = get_version_metrics()
    
    return {
        "status": "healthy",
        "api_version": version_info.get("api", "1.0.0"),
        "schema_version": version_info.get("db_schema", "20250909_2026_complete_database_schema"),
        "system_release": version_info.get("system_release", "2025.09.R1"),
        "uptime_seconds": version_metrics["uptime_seconds"],
        "total_api_calls": version_metrics["total_api_calls"],
        "total_errors": version_metrics["total_errors"],
        "last_deployment": version_metrics["last_deployment"]
    }

@app.get("/api/v1/version")
def get_version():
    """Get API version information for client compatibility checking."""
    version_info = load_version_info()
    
    return {
        "api_version": version_info.get("api", "1.0.0"),
        "api_path_major": version_info.get("api_path_major", "v1"),
        "schema_version": version_info.get("db_schema", "20250909_2026_complete_database_schema"),
        "system_release": version_info.get("system_release", "2025.09.R1"),
        "web_version": version_info.get("web", "1.0.0"),
        "mobile_version": version_info.get("mobile", "1.0.0"),
        "deprecated": False,
        "sunset_date": None,
        "min_supported_api_major": version_info.get("compatibility", {}).get("min_supported_api_major", 1),
        "min_supported_clients": {
            "mobile": "1.0.0+",
            "web": "1.0.0+"
        }
    }

@app.get("/api/v1/monitoring/version-metrics")
def get_version_metrics_endpoint():
    """Get version usage metrics for monitoring."""
    return get_version_metrics()

@app.get("/api/v1/monitoring/performance")
def get_performance_metrics_endpoint():
    """Get performance metrics for monitoring."""
    return get_performance_metrics()

@app.get("/api/v1/monitoring/health-detailed")
def get_detailed_health():
    """Get detailed health information including metrics."""
    version_info = load_version_info()
    version_metrics = get_version_metrics()
    performance_metrics = get_performance_metrics()
    
    return {
        "status": "healthy",
        "api_version": version_info.get("api", "1.0.0"),
        "schema_version": version_info.get("db_schema", "20250909_2026_complete_database_schema"),
        "system_release": version_info.get("system_release", "2025.09.R1"),
        "web_version": version_info.get("web", "1.0.0"),
        "mobile_version": version_info.get("mobile", "1.0.0"),
        "uptime_seconds": version_metrics["uptime_seconds"],
        "total_api_calls": version_metrics["total_api_calls"],
        "total_errors": version_metrics["total_errors"],
        "average_response_time_ms": performance_metrics["average_response_time"],
        "last_deployment": version_metrics["last_deployment"],
        "version_usage": version_metrics["version_usage"],
        "error_breakdown": dict(metrics["error_counts"]),
        "api_call_breakdown": dict(metrics["api_calls"])
    }

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
async def create_race(request: Request, current_admin: dict = Depends(get_current_admin)):
    """Create or update a race (admin only)."""
    
    try:
        # Try to parse the request body into RaceCreate model
        body = await request.json()
        
        # Validate with Pydantic
        race_data = RaceCreate(**body)
        
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
        
        # Include operation type in response body
        result_with_operation = {
            **result,
            "operation_type": operation_type
        }
        
        return JSONResponse(content=result_with_operation)
    except Exception as e:
        print(f"Error creating race: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create race: {e}")

@app.put("/races/{race_id}", response_model=RaceResponse)
def update_race(race_id: int, race_data: RaceUpdate, request: Request, current_admin: dict = Depends(get_current_admin)):
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
def delete_race(race_id: int, request: Request, current_admin: dict = Depends(get_current_admin)):
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
        cur.execute("SELECT id, club_name, location, website_url, description FROM clubs ORDER BY club_name ASC")
        rows = cur.fetchall()
        return [ClubResponse(id=r[0], club_name=r[1], location=r[2], website_url=r[3], description=r[4]) for r in rows]


@app.get("/admin/clubs", response_model=list[ClubResponse])
def admin_list_clubs(request: Request, current_admin: dict = Depends(get_current_admin)):
    """List all clubs (admin only)."""
    
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT id, club_name, location, website_url, description FROM clubs ORDER BY club_name ASC")
        rows = cur.fetchall()
        return [ClubResponse(id=r[0], club_name=r[1], location=r[2], website_url=r[3], description=r[4]) for r in rows]


@app.post("/admin/clubs/validate-ids")
def validate_club_ids(request: Request, club_ids: list[int], current_admin: dict = Depends(get_current_admin)):
    """Validate which club IDs exist in the database (admin only)."""
    if not club_ids:
        return {"existing_ids": [], "missing_ids": []}
    
    with get_conn() as conn, conn.cursor() as cur:
        # Convert list to tuple for SQL IN clause
        ids_tuple = tuple(club_ids)
        cur.execute(f"SELECT id FROM clubs WHERE id IN {ids_tuple}")
        existing_ids = [row[0] for row in cur.fetchall()]
        missing_ids = [id for id in club_ids if id not in existing_ids]
        
        return {
            "existing_ids": existing_ids,
            "missing_ids": missing_ids
        }


@app.post("/admin/races/validate-ids")
def validate_race_ids(request: Request, race_ids: list[int], current_admin: dict = Depends(get_current_admin)):
    """Validate which race IDs exist in the database (admin only)."""
    if not race_ids:
        return {"existing_ids": [], "missing_ids": []}
    
    with get_conn() as conn, conn.cursor() as cur:
        # Convert list to tuple for SQL IN clause
        if len(race_ids) == 1:
            # Handle single ID case
            cur.execute("SELECT id FROM races WHERE id = %s", (race_ids[0],))
        else:
            # Handle multiple IDs case
            ids_tuple = tuple(race_ids)
            cur.execute(f"SELECT id FROM races WHERE id IN {ids_tuple}")
        existing_ids = [row[0] for row in cur.fetchall()]
        missing_ids = [id for id in race_ids if id not in existing_ids]
        
        return {
            "existing_ids": existing_ids,
            "missing_ids": missing_ids
        }


@app.post("/admin/race_reports/validate-ids")
def validate_race_report_ids(request: Request, report_ids: list[int], current_admin: dict = Depends(get_current_admin)):
    """Validate which race report IDs exist in the database (admin only)."""
    if not report_ids:
        return {"existing_ids": [], "missing_ids": []}
    
    with get_conn() as conn, conn.cursor() as cur:
        # Convert list to tuple for SQL IN clause
        ids_tuple = tuple(report_ids)
        cur.execute(f"SELECT id FROM race_reports WHERE id IN {ids_tuple}")
        existing_ids = [row[0] for row in cur.fetchall()]
        missing_ids = [id for id in report_ids if id not in existing_ids]
        
        return {
            "existing_ids": existing_ids,
            "missing_ids": missing_ids
        }


@app.post("/clubs", response_model=ClubResponse)
def create_club(club: ClubCreate, request: Request, current_admin: dict = Depends(get_current_admin)):
    """Create a new club (admin only)."""
    
    try:
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO clubs (club_name, location, website_url, description) VALUES (%s, %s, %s, %s) RETURNING id, club_name, location, website_url, description",
                (club.club_name, club.location, club.website_url, club.description)
            )
            row = cur.fetchone()
            conn.commit()
            return ClubResponse(id=row[0], club_name=row[1], location=row[2], website_url=row[3], description=row[4])
    except psycopg.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="Club already exists")


@app.put("/clubs/{club_id}", response_model=ClubResponse)
def update_club(club_id: int, club_data: ClubUpdate, request: Request, current_admin: dict = Depends(get_current_admin)):
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
    if club_data.description is not None:
        update_fields.append("description = %s")
        values.append(club_data.description)
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Add club_id to values for WHERE clause
    values.append(club_id)
    
    sql = f"""
        UPDATE clubs 
        SET {', '.join(update_fields)}
        WHERE id = %s
        RETURNING id, club_name, location, website_url, description
    """
    
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, values)
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Club not found")
        conn.commit()
    
    return ClubResponse(id=row[0], club_name=row[1], location=row[2], website_url=row[3], description=row[4])


@app.delete("/clubs/{club_id}")
def delete_club(club_id: int, request: Request, current_admin: dict = Depends(get_current_admin)):
    """Delete a club (admin only)."""
    
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM clubs WHERE id = %s RETURNING id", (club_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Club not found")
        conn.commit()
    
    return {"message": "Club deleted successfully"}


@app.get("/admin/clubs/export-csv")
def export_clubs_csv(request: Request, current_admin: dict = Depends(get_current_admin)):
    """Export clubs to CSV."""
    
    try:
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute("SELECT id, club_name, location, website_url, description FROM clubs ORDER BY club_name")
            rows = cur.fetchall()
            
        # Create CSV content with all fields including ID
        csv_content = "id,club_name,location,website_url,description\n"
        for row in rows:
            csv_content += f'"{row[0]}","{row[1]}","{row[2] or ""}","{row[3] or ""}","{row[4] or ""}"\n'
        
        return StreamingResponse(
            iter([csv_content]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=clubs.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/clubs/import-csv")
def import_clubs_csv(
    request: Request,
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
                description = row[4].strip() if len(row) > 4 and row[4].strip() else None
                
                print(f"Parsed values: id='{club_id}', name='{club_name}', location='{location}', website='{website_url}', description='{description}'")
                
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
                
                if description and len(description) > 500:
                    errors.append(f"Line {line_num}: Description too long ({len(description)} chars, max 500)")
                    continue
                
                # Debug logging for constraint violations
                print(f"Processing line {line_num}: id='{club_id}', name='{club_name}', location='{location}', website='{website_url}', description='{description}'")
                
                if club_name:
                    processed_data.append({
                        'line_num': line_num,
                        'club_id': club_id,
                        'club_name': club_name,
                        'location': location,
                        'website_url': website_url,
                        'description': description
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
                description = data['description']
                
                print(f"Processing database operation: id='{club_id}', name='{club_name}', location='{location}', website='{website_url}', description='{description}'")
                
                # Check if ID exists and is not blank
                if club_id and club_id.strip() and club_id != 'null' and club_id != '':
                    try:
                        club_id_int = int(club_id)
                        print(f"Attempting UPDATE for ID {club_id_int}")
                        # Try to update existing club by ID
                        cur.execute("""
                            UPDATE clubs 
                            SET club_name = %s, location = %s, website_url = %s, description = %s
                            WHERE id = %s
                        """, (club_name, location, website_url, description, club_id_int))
                        
                        if cur.rowcount > 0:
                            updated_count += 1
                            print(f"UPDATE successful for ID {club_id_int}")
                        else:
                            print(f"ID {club_id_int} not found, skipping this row")
                            # ID not found, skip this row (don't create new club)
                            failed_count += 1
                    except ValueError:
                        print(f"Invalid ID '{club_id}', skipping this row")
                        # Invalid ID, skip this row
                        failed_count += 1
                else:
                    print(f"No ID provided, creating new club")
                    # No ID or blank ID, create new club
                    cur.execute("""
                        INSERT INTO clubs (club_name, location, website_url, description) 
                        VALUES (%s, %s, %s, %s)
                    """, (club_name, location, website_url, description))
                    imported_count += 1
                    print(f"INSERT successful for new club (no ID)")
            
            print(f"Database operations completed. Committing transaction...")
            # Commit all changes at once
            conn.commit()
            print(f"Transaction committed successfully")
        
        return {
            "message": f"Import completed successfully: {imported_count} new clubs created, {updated_count} existing clubs updated",
            "total": len(processed_data),
            "succeeded": imported_count + updated_count,
            "created": imported_count,
            "updated": updated_count
        }
        
    except Exception as e:
        print(f"Import error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


# Race Reports API Endpoints



@app.get("/race_reports", response_model=dict)
def list_race_reports(
    race_id: Optional[int] = None,
    q: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    order_by: str = "created_at",
    limit: int = 20,
    offset: int = 0,
    include_race: bool = False
):
    """List race reports with optional filtering and ordering."""
    if limit > 100:
        limit = 100
    
    if order_by not in ["created_at", "race_date"]:
        order_by = "created_at"
    
    # Build base query
    base_sql = """
        SELECT rr.id, rr.race_id, rr.race_name, rr.race_date, rr.title, rr.author_name, 
               rr.content_md, rr.photos, rr.created_at, rr.updated_at
    """
    
    if include_race:
        base_sql += """,
               r.id as race_id_detail, r.name as race_name, r.date as race_date_detail,
               r.city, r.state, r.surface, r.latitude, r.longitude, r.official_website_url
        """
    
    base_sql += """
        FROM race_reports rr
    """
    
    if include_race:
        base_sql += " LEFT JOIN races r ON rr.race_id = r.id"
    
    # Build WHERE clause
    where_conditions = []
    params = []
    param_count = 0
    
    if race_id:
        param_count += 1
        where_conditions.append(f"rr.race_id = %s")
        params.append(race_id)
    
    if q:
        param_count += 1
        search_sql = f"""
            (rr.title ILIKE %s OR rr.content_md ILIKE %s OR 
             COALESCE(rr.author_name, '') ILIKE %s)
        """
        where_conditions.append(search_sql)
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])
    
    if date_from:
        param_count += 1
        where_conditions.append(f"rr.race_date >= %s")
        params.append(date_from)
    
    if date_to:
        param_count += 1
        where_conditions.append(f"rr.race_date <= %s")
        params.append(date_to)
    
    if where_conditions:
        base_sql += " WHERE " + " AND ".join(where_conditions)
    
    # Add ordering
    base_sql += f" ORDER BY rr.{order_by} DESC, rr.created_at DESC"
    
    # Add pagination
    base_sql += " LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    
    # Get total count
    count_sql = """
        SELECT COUNT(*) FROM race_reports rr
    """
    if where_conditions:
        count_sql += " WHERE " + " AND ".join(where_conditions)
    
    with get_conn() as conn, conn.cursor() as cur:
        # Get total count
        cur.execute(count_sql, params[:-2] if len(params) > 2 else [])
        total = cur.fetchone()[0]
        
        # Get reports
        cur.execute(base_sql, params)
        rows = cur.fetchall()
    
    # Process results
    reports = []
    for row in rows:
        if include_race:
            report = {
                "id": str(row[0]),
                "race_id": row[1],
                "race_name": row[2],
                "race_date": row[3].isoformat() if row[3] else None,
                "title": row[4],
                "author_name": row[5],
                "content_md": row[6],
                "photos": row[7] if row[7] else [],
                "created_at": row[8].isoformat() if row[8] else None,
                "updated_at": row[9].isoformat() if row[9] else None,
                "race": {
                    "id": row[10],
                    "name": row[11],
                    "date": row[12].isoformat() if row[12] else None,
                    "city": row[13],
                    "state": row[14],
                    "surface": row[15],
                    "latitude": row[16],
                    "longitude": row[17],
                    "official_website_url": row[18]
                } if row[10] is not None else None
            }
        else:
            report = {
                "id": str(row[0]),
                "race_id": row[1],
                "race_name": row[2],
                "race_date": row[3].isoformat() if row[3] else None,
                "title": row[4],
                "author_name": row[5],
                "content_md": row[6],
                "photos": row[7] if row[7] else [],
                "created_at": row[8].isoformat() if row[8] else None,
                "updated_at": row[9].isoformat() if row[9] else None
            }
        reports.append(report)
    
    return {
        "items": reports,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@app.get("/race_reports/export.csv")
def export_race_reports_csv(
    request: Request,
    race_id: Optional[int] = None,
    q: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """Export race reports to CSV (admin only)."""
    
    # Build query similar to list endpoint
    base_sql = """
        SELECT rr.id, rr.race_id, r.name as race_name, rr.race_date, rr.title, 
               rr.author_name, rr.content_md, rr.photos
        FROM race_reports rr
        LEFT JOIN races r ON rr.race_id = r.id
    """
    
    where_conditions = []
    params = []
    
    if race_id:
        where_conditions.append("rr.race_id = %s")
        params.append(race_id)
    
    if q:
        search_sql = """
            (rr.title ILIKE %s OR rr.content_md ILIKE %s OR 
             COALESCE(rr.author_name, '') ILIKE %s)
        """
        where_conditions.append(search_sql)
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])
    
    if date_from:
        where_conditions.append("rr.race_date >= %s")
        params.append(date_from)
    
    if date_to:
        where_conditions.append("rr.race_date <= %s")
        params.append(date_to)
    
    if where_conditions:
        base_sql += " WHERE " + " AND ".join(where_conditions)
    
    base_sql += " ORDER BY rr.race_date DESC, rr.created_at DESC"
    
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(base_sql, params)
        rows = cur.fetchall()
    
    # Generate CSV content
    csv_content = "id,race_id,race_name,race_date,title,author_name,content_md,photos\n"
    
    for row in rows:
        id, race_id, race_name, race_date, title, author_name, content_md, photos = row
        
        # Escape CSV fields
        def escape_csv_field(field):
            if field is None:
                return ""
            field_str = str(field)
            if '"' in field_str or ',' in field_str or '\n' in field_str:
                # Escape double quotes by doubling them
                escaped_field = field_str.replace('"', '""')
                return f'"{escaped_field}"'
            return field_str
        
        # Convert photos array to semicolon-separated string
        photos_str = ";".join(photos) if photos else ""
        
        csv_content += f"{escape_csv_field(id)},{escape_csv_field(race_id)},{escape_csv_field(race_name)},{escape_csv_field(race_date)},{escape_csv_field(title)},{escape_csv_field(author_name)},{escape_csv_field(content_md)},{escape_csv_field(photos_str)}\n"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=race_reports.csv"}
    )

@app.get("/race_reports/{report_id}", response_model=dict)
def get_race_report(report_id: str, include_race: bool = False):
    """Get a single race report by ID."""
    base_sql = """
        SELECT rr.id, rr.race_id, rr.race_name, rr.race_date, rr.title, rr.author_name, 
               rr.content_md, rr.photos, rr.created_at, rr.updated_at
    """
    
    if include_race:
        base_sql += """,
               r.id as race_id_detail, r.name as race_name, r.date as race_date_detail,
               r.city, r.state, r.surface, r.latitude, r.longitude, r.official_website_url
        """
    
    base_sql += """
        FROM race_reports rr
    """
    
    if include_race:
        base_sql += " LEFT JOIN races r ON rr.race_id = r.id"
    
    base_sql += " WHERE rr.id = %s"
    
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(base_sql, (report_id,))
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Race report not found")
    
    # Process result
    if include_race:
        report = {
            "id": str(row[0]),
            "race_id": row[1],
            "race_name": row[2],
            "race_date": row[3].isoformat() if row[3] else None,
            "title": row[4],
            "author_name": row[5],
            "content_md": row[6],
            "photos": row[7] if row[7] else [],
            "created_at": row[8].isoformat() if row[8] else None,
            "updated_at": row[9].isoformat() if row[9] else None,
            "race": {
                "id": row[10],
                "name": row[11],
                "date": row[12].isoformat() if row[12] else None,
                "city": row[13],
                "state": row[14],
                "surface": row[15],
                "latitude": row[16],
                "longitude": row[17],
                "official_website_url": row[18]
            } if row[10] is not None else None
        }
    else:
        report = {
            "id": str(row[0]),
            "race_id": row[1],
            "race_name": row[2],
            "race_date": row[3].isoformat() if row[3] else None,
            "title": row[4],
            "author_name": row[5],
            "content_md": row[6],
            "photos": row[7] if row[7] else [],
            "created_at": row[8].isoformat() if row[8] else None,
            "updated_at": row[9].isoformat() if row[9] else None
        }
    
    return report

@app.post("/race_reports", response_model=dict, status_code=201)
async def create_race_report(request: Request, current_admin: dict = Depends(get_current_admin)):
    """Create a new race report (admin only)."""
    
    try:
        # Parse the request body
        body = await request.json()
        
        # Convert string date to Python date object if needed
        if 'race_date' in body and isinstance(body['race_date'], str):
            body['race_date'] = date.fromisoformat(body['race_date'])
        
        # Validate with Pydantic
        report = RaceReportCreate(**body)
        
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    
    # Handle race_id validation
    if report.race_id is not None:
        # Validate that the referenced race exists
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute("SELECT date, name FROM races WHERE id = %s", (report.race_id,))
            race_result = cur.fetchone()
            
            if not race_result:
                raise HTTPException(status_code=400, detail=f"Referenced race ID {report.race_id} not found")
            
            # Auto-populate race_name from linked race if not provided
            if not report.race_name or report.race_name.strip() == '':
                report.race_name = race_result[1]
    
    # Insert the report
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("""
            INSERT INTO race_reports (race_id, race_name, race_date, title, author_name, content_md, photos)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at, updated_at
        """, (
            report.race_id, report.race_name, report.race_date, report.title, report.author_name,
            report.content_md, report.photos
        ))
        
        result = cur.fetchone()
        conn.commit()
    
    return {
        "id": str(result[0]),
        "race_id": report.race_id,
        "race_name": report.race_name,
        "race_date": report.race_date.isoformat(),
        "title": report.title,
        "author_name": report.author_name,
        "content_md": report.content_md,
        "photos": report.photos,
        "created_at": result[1].isoformat(),
        "updated_at": result[2].isoformat()
    }

@app.put("/race_reports/{report_id}", response_model=dict)
def update_race_report(report_id: str, report: RaceReportUpdate, request: Request, current_admin: dict = Depends(get_current_admin)):
    """Update a race report (admin only)."""
    
    with get_conn() as conn, conn.cursor() as cur:
        # Check if report exists
        cur.execute("SELECT id, race_id FROM race_reports WHERE id = %s", (report_id,))
        existing = cur.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Race report not found")
        
        current_race_id = existing[1]
        new_race_id = report.race_id if report.race_id is not None else current_race_id
        
        # Handle race_id validation
        if new_race_id is not None:
            # Validate that the referenced race exists
            cur.execute("SELECT date, name FROM races WHERE id = %s", (new_race_id,))
            race_result = cur.fetchone()
            
            if not race_result:
                raise HTTPException(status_code=400, detail=f"Referenced race ID {new_race_id} not found")
            
            # Auto-populate race_name from linked race if race_id is changing and race_name not provided
            if new_race_id != current_race_id and (report.race_name is None or report.race_name.strip() == ''):
                report.race_name = race_result[1]
        
        # Build update query
        update_fields = []
        params = []
        
        if report.race_id is not None:
            update_fields.append("race_id = %s")
            params.append(report.race_id)
        elif report.race_id is None and current_race_id is not None:
            # Setting race_id to null (orphaning the report)
            update_fields.append("race_id = NULL")
        
        if report.race_name is not None:
            update_fields.append("race_name = %s")
            params.append(report.race_name)
        
        if report.race_date is not None:
            update_fields.append("race_date = %s")
            params.append(report.race_date)
        
        if report.title is not None:
            update_fields.append("title = %s")
            params.append(report.title)
        
        if report.author_name is not None:
            update_fields.append("author_name = %s")
            params.append(report.author_name)
        
        if report.content_md is not None:
            update_fields.append("content_md = %s")
            params.append(report.content_md)
        
        if report.photos is not None:
            update_fields.append("photos = %s")
            params.append(report.photos)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add report_id to params
        params.append(report_id)
        
        # Execute update
        update_sql = f"""
            UPDATE race_reports 
            SET {', '.join(update_fields)}, updated_at = now()
            WHERE id = %s
            RETURNING id, race_id, race_date, title, author_name, content_md, photos, created_at, updated_at
        """
        
        cur.execute(update_sql, params)
        result = cur.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Race report not found")
        
        conn.commit()
    
    return {
        "id": str(result[0]),
        "race_id": result[1],
        "race_date": result[2].isoformat() if result[2] else None,
        "title": result[3],
        "author_name": result[4],
        "content_md": result[5],
        "photos": result[6] if result[6] else [],
        "created_at": result[7].isoformat() if result[7] else None,
        "updated_at": result[8].isoformat() if result[8] else None
    }

@app.delete("/race_reports/{report_id}")
def delete_race_report(report_id: str, request: Request, current_admin: dict = Depends(get_current_admin)):
    """Delete a race report (admin only)."""
    
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM race_reports WHERE id = %s", (report_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Race report not found")
        conn.commit()
    
    return {"message": "Race report deleted successfully"}



@app.post("/admin/race_reports/import")
def import_race_reports_csv(
    request: Request,
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin)
):
    """Import race reports from CSV (admin only)."""
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    if file.size and file.size > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    try:
        import csv
        from io import StringIO
        from datetime import datetime
        content = file.file.read().decode('utf-8')
        
        # Use csv module to parse the entire file properly
        csv_reader = csv.reader(StringIO(content))
        rows = list(csv_reader)
        
        if len(rows) < 2:  # Need header + at least one data row
            raise HTTPException(status_code=400, detail="CSV must have header and at least one data row")
        
        if len(rows) > 2002:  # Header + 2000 rows max
            raise HTTPException(status_code=400, detail="CSV cannot exceed 2000 rows")
        
        # Parse header and clean up any trailing whitespace
        header = [h.strip() for h in rows[0]]
        expected_headers = ['id', 'race_id', 'race_name', 'race_date', 'title', 'author_name', 'content_md', 'photos']
        
        if header != expected_headers:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid CSV headers. Expected: {expected_headers}, got: {header}"
            )
        
        # Process data rows
        processed_data = []
        errors = []
        
        for line_num, row in enumerate(rows[1:], 2):
            if not row or not any(row):  # Skip empty rows
                continue
            
            if len(row) != 8:
                errors.append(f"Line {line_num}: Expected 8 columns, got {len(row)}")
                continue
            
            id, race_id, race_name, race_date, title, author_name, content_md, photos_str = row
            
            # Validate required fields
            if not title.strip():
                errors.append(f"Line {line_num}: Title is required and cannot be empty")
                continue
            
            if not content_md.strip():
                errors.append(f"Line {line_num}: Content is required and cannot be empty")
                continue
            
            # Validate title length
            if len(title.strip()) < 3 or len(title.strip()) > 120:
                errors.append(f"Line {line_num}: Title must be 3-120 characters (current: {len(title.strip())} chars)")
                continue
            
            # Validate content length
            if len(content_md.strip()) < 1 or len(content_md.strip()) > 20000:
                errors.append(f"Line {line_num}: Content must be 1-20,000 characters (current: {len(content_md.strip())} chars)")
                continue
            
            # Validate author name if provided
            if author_name.strip() and (len(author_name.strip()) < 2 or len(author_name.strip()) > 80):
                errors.append(f"Line {line_num}: Author name must be 2-80 characters if provided (current: {len(author_name.strip())} chars)")
                continue
            
            # Parse photos (semicolon-separated)
            photos = [p.strip() for p in photos_str.split(';') if p.strip()]
            for photo in photos:
                if not photo.startswith(('http://', 'https://')):
                    errors.append(f"Line {line_num}: Photo URL '{photo}' must be absolute (start with http:// or https://)")
                    continue
            
            # Validate race_id or resolve by race_name + race_date
            resolved_race_id = None
            parsed_race_date = None
            
            # Parse race_date first
            if race_date.strip():
                try:
                    # Try various date formats
                    date_formats = [
                        '%Y-%m-%d',      # 2025-08-19
                        '%m/%d/%Y',      # 8/19/2025
                        '%m/%d/%y',      # 8/19/25
                        '%d/%m/%Y',      # 19/8/2025
                        '%d/%m/%y',      # 19/8/25
                        '%Y/%m/%d',      # 2025/08/19
                        '%m-%d-%Y',      # 8-19-2025
                        '%d-%m-%Y',      # 19-8-2025
                    ]
                    
                    for fmt in date_formats:
                        try:
                            parsed_race_date = datetime.strptime(race_date.strip(), fmt)
                            break
                        except ValueError:
                            continue
                    
                    if not parsed_race_date:
                        errors.append(f"Line {line_num}: Invalid race_date format '{race_date.strip()}'. Supported formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, etc.")
                        continue
                except Exception as e:
                    errors.append(f"Line {line_num}: Error parsing race_date: {str(e)}")
                    continue
            else:
                errors.append(f"Line {line_num}: race_date is required and cannot be empty")
                continue
            
            # Note: race_id can be null (orphaned report) - no error needed
            
            # Validate race_id if provided
            if race_id.strip() and race_id.strip().lower() != 'null':
                try:
                    resolved_race_id = int(race_id.strip())
                    if resolved_race_id <= 0:
                        errors.append(f"Line {line_num}: race_id must be a positive number, got {resolved_race_id}")
                        continue
                except ValueError:
                    errors.append(f"Line {line_num}: Invalid race_id format - must be a number")
                    continue
            
            # Check if race exists and get race name (only if race_id is provided)
            final_race_name = race_name.strip()
            if resolved_race_id is not None:
                try:
                    with get_conn() as conn, conn.cursor() as cur:
                        cur.execute("SELECT name, date FROM races WHERE id = %s", (resolved_race_id,))
                        race_result = cur.fetchone()
                        if not race_result or not race_result[0]:
                            errors.append(f"Line {line_num}: Race ID {resolved_race_id} not found in database")
                            continue
                        if not race_result[1]:
                            errors.append(f"Line {line_num}: Race ID {resolved_race_id} has no date")
                            continue
                        # Use database race name instead of CSV race name
                        final_race_name = race_result[0]
                except Exception as e:
                    errors.append(f"Line {line_num}: Error checking race: {str(e)}")
                    continue
            
            processed_data.append({
                'line_num': line_num,
                'csv_id': id.strip(),
                'race_id': resolved_race_id,
                'race_name': final_race_name,
                'race_date': parsed_race_date.date(),
                'title': title.strip(),
                'author_name': author_name.strip() if author_name.strip() else None,
                'content_md': content_md.strip(),
                'photos': photos
            })
        
        if errors:
            return {
                "message": "Import validation failed",
                "errors": errors
            }
        
        # Process import
        imported_count = 0
        updated_count = 0
        
        with get_conn() as conn, conn.cursor() as cur:
            for data in processed_data:
                # Check if we have an ID from CSV for upsert logic
                csv_id = data.get('csv_id')
                
                if csv_id and csv_id.strip() and csv_id.strip().lower() != 'null':
                    # Try to update existing report by ID
                    try:
                        csv_id_int = int(csv_id.strip())
                        cur.execute("""
                            UPDATE race_reports 
                            SET race_id = %s, race_name = %s, race_date = %s, title = %s, author_name = %s, content_md = %s, 
                                photos = %s, updated_at = now()
                            WHERE id = %s
                        """, (
                            data['race_id'], data['race_name'], data['race_date'], data['title'], data['author_name'],
                            data['content_md'], data['photos'], csv_id_int
                        ))
                        
                        if cur.rowcount > 0:
                            updated_count += 1
                        else:
                            # ID doesn't exist, create new
                            cur.execute("""
                                INSERT INTO race_reports (id, race_id, race_name, race_date, title, author_name, content_md, photos)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            """, (
                                csv_id_int, data['race_id'], data['race_name'], data['race_date'], data['title'], 
                                data['author_name'], data['content_md'], data['photos']
                            ))
                            imported_count += 1
                    except ValueError:
                        # Invalid ID format, create new
                        cur.execute("""
                            INSERT INTO race_reports (race_id, race_name, race_date, title, author_name, content_md, photos)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (
                            data['race_id'], data['race_name'], data['race_date'], data['title'], 
                            data['author_name'], data['content_md'], data['photos']
                        ))
                        imported_count += 1
                else:
                    # No ID provided, create new report
                    cur.execute("""
                        INSERT INTO race_reports (race_id, race_name, race_date, title, author_name, content_md, photos)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (
                        data['race_id'], data['race_name'], data['race_date'], data['title'], 
                        data['author_name'], data['content_md'], data['photos']
                    ))
                    imported_count += 1
            
            conn.commit()
        
        return {
            "message": f"Import completed successfully: {imported_count} new reports created, {updated_count} existing reports updated"
        }
        
    except Exception as e:
        import traceback
        error_details = f"Import failed: {str(e)}\nTraceback: {traceback.format_exc()}"
        print(f"Race Reports Import Error: {error_details}")  # Log to console for debugging
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
