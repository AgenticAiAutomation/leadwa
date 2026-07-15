"""
Click event ingestion endpoint.
"""
import os

import psycopg
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional


# Config
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/leadwa")
BEACON_SECRET = os.getenv("BEACON_SECRET", "dev-beacon-secret")

router = APIRouter(prefix="/events", tags=["events"])


# Models
class ClickEvent(BaseModel):
    l: str  # link_id
    country: Optional[str] = None
    device: str
    ref: Optional[str] = None


@router.post("/click", status_code=204)
async def ingest_click(
    event: ClickEvent,
    x_beacon_secret: Optional[str] = Header(None)
):
    """Ingest a click event from the worker."""
    # Verify shared secret
    if x_beacon_secret != BEACON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid beacon secret")

    # Insert click
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO clicks (link_id, country, device, referrer)
                VALUES (%s, %s, %s, %s)
                """,
                (event.l, event.country, event.device, event.ref)
            )
            conn.commit()

    return None  # 204 No Content
