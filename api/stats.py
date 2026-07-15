"""
Link statistics endpoints.
"""
import os
from datetime import datetime, timedelta
from typing import List, Optional

import psycopg
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from auth import get_current_user_id


# Config
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/leadwa")

router = APIRouter(tags=["stats"])


# Models
class DayClick(BaseModel):
    date: str
    clicks: int


class LinkStats(BaseModel):
    total_clicks: int
    clicks_last_7_days: List[DayClick]
    top_country: Optional[str]
    mobile_count: int
    desktop_count: int


@router.get("/links/{link_id}/stats", response_model=LinkStats)
async def get_link_stats(link_id: str, user_id: str = Depends(get_current_user_id)):
    """Get click statistics for a link."""
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # Verify ownership
            cur.execute(
                "SELECT user_id FROM links WHERE id = %s",
                (link_id,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Link not found")
            if row[0] != user_id:
                raise HTTPException(status_code=403, detail="Not authorized")

            # Total clicks
            cur.execute(
                "SELECT COUNT(*) FROM clicks WHERE link_id = %s",
                (link_id,)
            )
            total_clicks = cur.fetchone()[0]

            # Clicks last 7 days (per day)
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            cur.execute(
                """
                SELECT DATE(ts), COUNT(*)
                FROM clicks
                WHERE link_id = %s AND ts >= %s
                GROUP BY DATE(ts)
                ORDER BY DATE(ts)
                """,
                (link_id, seven_days_ago)
            )
            day_clicks = [
                DayClick(date=row[0].isoformat(), clicks=row[1])
                for row in cur.fetchall()
            ]

            # Top country
            cur.execute(
                """
                SELECT country, COUNT(*) as cnt
                FROM clicks
                WHERE link_id = %s AND country IS NOT NULL
                GROUP BY country
                ORDER BY cnt DESC
                LIMIT 1
                """,
                (link_id,)
            )
            top_country_row = cur.fetchone()
            top_country = top_country_row[0] if top_country_row else None

            # Mobile/desktop split
            cur.execute(
                """
                SELECT
                    COUNT(*) FILTER (WHERE device = 'mobile') as mobile_count,
                    COUNT(*) FILTER (WHERE device = 'desktop') as desktop_count
                FROM clicks
                WHERE link_id = %s
                """,
                (link_id,)
            )
            device_row = cur.fetchone()
            mobile_count = device_row[0] or 0
            desktop_count = device_row[1] or 0

            return LinkStats(
                total_clicks=total_clicks,
                clicks_last_7_days=day_clicks,
                top_country=top_country,
                mobile_count=mobile_count,
                desktop_count=desktop_count
            )
