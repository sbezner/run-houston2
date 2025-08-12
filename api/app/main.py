from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import psycopg

app = FastAPI(title="Run Houston API", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rh_user:rh_pass@db:5432/runhou")

def get_conn():
    # psycopg 3 connection
    return psycopg.connect(DATABASE_URL)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/races")
def list_races():
    sql = """
        SELECT id, name, date, start_time, city, state, latitude, longitude,
               surface, kid_run, official_website_url
        FROM races
        ORDER BY date ASC
        LIMIT 50
    """
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    cols = ["id","name","date","start_time","city","state","latitude","longitude",
            "surface","kid_run","official_website_url"]
    return [dict(zip(cols, r)) for r in rows]
