"""
Leads CRUD - Outcome-based lead management.
"""
import os
from typing import Optional, List
from datetime import datetime

import psycopg
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from auth import get_current_user_id

# Config
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/leadwa")

router = APIRouter(prefix="/leads", tags=["leads"])


# Models
class LeadCreate(BaseModel):
    contact_number: str
    notes: Optional[str] = None
    link_id: Optional[str] = None


class LeadUpdate(BaseModel):
    status: Optional[str] = None  # new, contacted, quoted, won, lost
    value_inr: Optional[int] = None
    notes: Optional[str] = None


class LeadResponse(BaseModel):
    id: str
    user_id: str
    source: str  # link_click, missed_call, manual
    contact_number: str
    link_id: Optional[str]
    link_title: Optional[str]  # Joined from links table
    status: str
    value_inr: Optional[int]
    notes: Optional[str]
    created_at: str
    updated_at: str


# Endpoints
@router.get("", response_model=List[LeadResponse])
async def get_leads(
    source: Optional[str] = None,
    status: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """Get all leads for the authenticated user, optionally filtered by source or status."""
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            query = """
                SELECT l.id, l.user_id, l.source, l.contact_number, l.link_id, ln.title as link_title,
                       l.status, l.value_inr, l.notes, l.created_at, l.updated_at
                FROM leads l
                LEFT JOIN links ln ON l.link_id = ln.id
                WHERE l.user_id = %s
            """
            params = [user_id]

            if source:
                query += " AND l.source = %s"
                params.append(source)

            if status:
                query += " AND l.status = %s"
                params.append(status)

            query += " ORDER BY l.created_at DESC"

            cur.execute(query, params)
            rows = cur.fetchall()

            return [
                LeadResponse(
                    id=str(row[0]),
                    user_id=str(row[1]),
                    source=row[2],
                    contact_number=row[3],
                    link_id=str(row[4]) if row[4] else None,
                    link_title=row[5],
                    status=row[6],
                    value_inr=row[7],
                    notes=row[8],
                    created_at=row[9].isoformat(),
                    updated_at=row[10].isoformat()
                )
                for row in rows
            ]


@router.post("", response_model=LeadResponse, status_code=201)
async def create_lead(lead: LeadCreate, user_id: str = Depends(get_current_user_id)):
    """Manually create a lead."""
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # Validate link_id if provided
            if lead.link_id:
                cur.execute(
                    "SELECT id FROM links WHERE id = %s AND user_id = %s",
                    (lead.link_id, user_id)
                )
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Link not found or not authorized")

            # Create lead
            cur.execute(
                """
                INSERT INTO leads (user_id, source, contact_number, link_id, notes, status)
                VALUES (%s, 'manual', %s, %s, %s, 'new')
                RETURNING id, user_id, source, contact_number, link_id, status, value_inr, notes, created_at, updated_at
                """,
                (user_id, lead.contact_number, lead.link_id, lead.notes)
            )
            row = cur.fetchone()
            conn.commit()

            # Get link title if link_id exists
            link_title = None
            if row[4]:
                cur.execute("SELECT title FROM links WHERE id = %s", (row[4],))
                link_row = cur.fetchone()
                if link_row:
                    link_title = link_row[0]

            return LeadResponse(
                id=str(row[0]),
                user_id=str(row[1]),
                source=row[2],
                contact_number=row[3],
                link_id=str(row[4]) if row[4] else None,
                link_title=link_title,
                status=row[5],
                value_inr=row[6],
                notes=row[7],
                created_at=row[8].isoformat(),
                updated_at=row[9].isoformat()
            )


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(lead_id: str, update: LeadUpdate, user_id: str = Depends(get_current_user_id)):
    """Update a lead (status, value, notes)."""
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # Check ownership
            cur.execute(
                "SELECT user_id FROM leads WHERE id = %s",
                (lead_id,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Lead not found")
            if row[0] != user_id:
                raise HTTPException(status_code=403, detail="Not authorized")

            # Build update query
            fields = []
            values = []
            if update.status is not None:
                if update.status not in ['new', 'contacted', 'quoted', 'won', 'lost']:
                    raise HTTPException(status_code=400, detail="Invalid status")
                fields.append("status = %s")
                values.append(update.status)
            if update.value_inr is not None:
                fields.append("value_inr = %s")
                values.append(update.value_inr)
            if update.notes is not None:
                fields.append("notes = %s")
                values.append(update.notes)

            if not fields:
                raise HTTPException(status_code=400, detail="No fields to update")

            fields.append("updated_at = NOW()")
            values.append(lead_id)

            cur.execute(
                f"""
                UPDATE leads
                SET {", ".join(fields)}
                WHERE id = %s
                RETURNING id, user_id, source, contact_number, link_id, status, value_inr, notes, created_at, updated_at
                """,
                values
            )
            row = cur.fetchone()
            conn.commit()

            # Get link title if link_id exists
            link_title = None
            if row[4]:
                cur.execute("SELECT title FROM links WHERE id = %s", (row[4],))
                link_row = cur.fetchone()
                if link_row:
                    link_title = link_row[0]

            return LeadResponse(
                id=str(row[0]),
                user_id=str(row[1]),
                source=row[2],
                contact_number=row[3],
                link_id=str(row[4]) if row[4] else None,
                link_title=link_title,
                status=row[5],
                value_inr=row[6],
                notes=row[7],
                created_at=row[8].isoformat(),
                updated_at=row[9].isoformat()
            )
