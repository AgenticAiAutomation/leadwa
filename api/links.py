"""
Links CRUD with Cloudflare KV sync.
"""
import json
import os
import random
import re
from datetime import datetime
from typing import Optional, List
from collections import defaultdict
from time import time

import httpx
import psycopg
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, field_validator

from auth import get_current_user_id


# Config
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/leadwa")
CF_ACCOUNT_ID = os.getenv("CF_ACCOUNT_ID", "")
CF_KV_NAMESPACE_ID = os.getenv("CF_KV_NAMESPACE_ID", "")
CF_API_TOKEN = os.getenv("CF_API_TOKEN", "")

# Base58 alphabet (no 0, O, I, l for readability)
BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

# Simple in-memory rate limiter for anonymous links
# Format: {ip: [(timestamp, count), ...]}
_rate_limit_store: dict = defaultdict(list)
RATE_LIMIT_MAX = 20  # Max links per IP per hour
RATE_LIMIT_WINDOW = 3600  # 1 hour in seconds

router = APIRouter(prefix="/links", tags=["links"])


# Models
class LinkCreate(BaseModel):
    title: str
    dest_number: str
    prefill_text: Optional[str] = None
    source_tag: Optional[str] = None
    slug: Optional[str] = None

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v):
        if v is not None:
            if not re.match(r"^[a-z0-9-]{3,32}$", v):
                raise ValueError("Slug must be 3-32 chars, lowercase letters, numbers, and hyphens only")
        return v


class LinkUpdate(BaseModel):
    title: Optional[str] = None
    dest_number: Optional[str] = None
    prefill_text: Optional[str] = None
    source_tag: Optional[str] = None


class LinkResponse(BaseModel):
    id: str
    slug: str
    title: str
    dest_number: str
    prefill_text: Optional[str]
    source_tag: Optional[str]
    active: bool
    created_at: str
    updated_at: str


class AnonymousLinkCreate(BaseModel):
    dest_number: str
    prefill_text: Optional[str] = None
    title: Optional[str] = None


class AnonymousLinkResponse(BaseModel):
    slug: str
    short_url: str


# Helpers
def generate_slug() -> str:
    """Generate a 6-character base58 slug."""
    return "".join(random.choices(BASE58_ALPHABET, k=6))


def check_rate_limit(ip: str) -> bool:
    """Check if IP has exceeded rate limit. Returns True if allowed, False if rate limited."""
    now = time()
    cutoff = now - RATE_LIMIT_WINDOW

    # Clean old entries for this IP
    _rate_limit_store[ip] = [(ts, count) for ts, count in _rate_limit_store[ip] if ts > cutoff]

    # Count total links in the window
    total = sum(count for _, count in _rate_limit_store[ip])

    if total >= RATE_LIMIT_MAX:
        return False

    # Add this request
    _rate_limit_store[ip].append((now, 1))
    return True


async def sync_to_kv(slug: str, link_id: str, dest_number: str, prefill_text: Optional[str], active: bool):
    """Push link data to Cloudflare KV."""
    if not all([CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, CF_API_TOKEN]):
        # Skip KV sync if not configured (dev/test mode)
        return

    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/storage/kv/namespaces/{CF_KV_NAMESPACE_ID}/values/{slug}"
    headers = {
        "Authorization": f"Bearer {CF_API_TOKEN}",
        "Content-Type": "application/json"
    }

    value = {
        "n": dest_number,
        "t": prefill_text or "",
        "a": active,
        "l": link_id
    }

    async with httpx.AsyncClient() as client:
        response = await client.put(url, headers=headers, content=json.dumps(value))
        if response.status_code not in (200, 201):
            # Log but don't fail the request
            print(f"KV sync failed: {response.status_code} {response.text}")


# Endpoints
@router.post("/anonymous", response_model=AnonymousLinkResponse, status_code=201)
async def create_anonymous_link(link: AnonymousLinkCreate, request: Request):
    """Create an anonymous link without authentication."""
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Max 20 links per hour.")

    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # Generate unique slug
            slug = None
            for _ in range(10):
                candidate = generate_slug()
                cur.execute("SELECT id FROM links WHERE slug = %s", (candidate,))
                if not cur.fetchone():
                    slug = candidate
                    break

            if not slug:
                raise HTTPException(status_code=500, detail="Failed to generate unique slug")

            # Create link with user_id = NULL
            cur.execute(
                """
                INSERT INTO links (user_id, slug, title, dest_number, prefill_text)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (None, slug, link.title or "Anonymous Link", link.dest_number, link.prefill_text)
            )
            link_id = cur.fetchone()[0]
            conn.commit()

            # Sync to KV
            await sync_to_kv(slug, str(link_id), link.dest_number, link.prefill_text, True)

            short_url = f"https://leadwa.link/{slug}"
            return AnonymousLinkResponse(slug=slug, short_url=short_url)


@router.post("", response_model=LinkResponse, status_code=201)
async def create_link(link: LinkCreate, user_id: str = Depends(get_current_user_id)):
    """Create a new link."""
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # Generate or validate slug
            slug = link.slug
            if not slug:
                # Generate unique slug
                for _ in range(10):
                    slug = generate_slug()
                    cur.execute("SELECT id FROM links WHERE slug = %s", (slug,))
                    if not cur.fetchone():
                        break
                else:
                    raise HTTPException(status_code=500, detail="Failed to generate unique slug")
            else:
                # Check custom slug is unique
                cur.execute("SELECT id FROM links WHERE slug = %s", (slug,))
                if cur.fetchone():
                    raise HTTPException(status_code=409, detail="Slug already taken")

            # Create link
            cur.execute(
                """
                INSERT INTO links (user_id, slug, title, dest_number, prefill_text, source_tag)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, slug, title, dest_number, prefill_text, source_tag, active, created_at, updated_at
                """,
                (user_id, slug, link.title, link.dest_number, link.prefill_text, link.source_tag)
            )
            row = cur.fetchone()
            conn.commit()

            link_id, slug, title, dest_number, prefill_text, source_tag, active, created_at, updated_at = row

            # Sync to KV
            await sync_to_kv(slug, str(link_id), dest_number, prefill_text, active)

            return LinkResponse(
                id=str(link_id),
                slug=slug,
                title=title,
                dest_number=dest_number,
                prefill_text=prefill_text,
                source_tag=source_tag,
                active=active,
                created_at=created_at.isoformat(),
                updated_at=updated_at.isoformat()
            )


@router.get("", response_model=List[LinkResponse])
async def get_links(user_id: str = Depends(get_current_user_id)):
    """Get all links for the authenticated user."""
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, slug, title, dest_number, prefill_text, source_tag, active, created_at, updated_at
                FROM links
                WHERE user_id = %s
                ORDER BY created_at DESC
                """,
                (user_id,)
            )
            rows = cur.fetchall()

            return [
                LinkResponse(
                    id=str(row[0]),
                    slug=row[1],
                    title=row[2],
                    dest_number=row[3],
                    prefill_text=row[4],
                    source_tag=row[5],
                    active=row[6],
                    created_at=row[7].isoformat(),
                    updated_at=row[8].isoformat()
                )
                for row in rows
            ]


@router.patch("/{link_id}", response_model=LinkResponse)
async def update_link(link_id: str, update: LinkUpdate, user_id: str = Depends(get_current_user_id)):
    """Update a link."""
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # Check ownership
            cur.execute(
                "SELECT user_id, slug, dest_number, prefill_text, active FROM links WHERE id = %s",
                (link_id,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Link not found")
            if row[0] != user_id:
                raise HTTPException(status_code=403, detail="Not authorized")

            owner_id, slug, current_dest, current_prefill, active = row

            # Build update query
            fields = []
            values = []
            if update.title is not None:
                fields.append("title = %s")
                values.append(update.title)
            if update.dest_number is not None:
                fields.append("dest_number = %s")
                values.append(update.dest_number)
            if update.prefill_text is not None:
                fields.append("prefill_text = %s")
                values.append(update.prefill_text)
            if update.source_tag is not None:
                fields.append("source_tag = %s")
                values.append(update.source_tag)

            if not fields:
                raise HTTPException(status_code=400, detail="No fields to update")

            fields.append("updated_at = NOW()")
            values.append(link_id)

            cur.execute(
                f"""
                UPDATE links
                SET {", ".join(fields)}
                WHERE id = %s
                RETURNING id, slug, title, dest_number, prefill_text, source_tag, active, created_at, updated_at
                """,
                values
            )
            row = cur.fetchone()
            conn.commit()

            link_id, slug, title, dest_number, prefill_text, source_tag, active, created_at, updated_at = row

            # Sync to KV
            await sync_to_kv(slug, str(link_id), dest_number, prefill_text, active)

            return LinkResponse(
                id=str(link_id),
                slug=slug,
                title=title,
                dest_number=dest_number,
                prefill_text=prefill_text,
                source_tag=source_tag,
                active=active,
                created_at=created_at.isoformat(),
                updated_at=updated_at.isoformat()
            )


@router.delete("/{link_id}")
async def delete_link(link_id: str, user_id: str = Depends(get_current_user_id)):
    """Soft delete a link (set active=false)."""
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # Check ownership
            cur.execute(
                "SELECT user_id, slug, dest_number, prefill_text FROM links WHERE id = %s",
                (link_id,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Link not found")
            if row[0] != user_id:
                raise HTTPException(status_code=403, detail="Not authorized")

            owner_id, slug, dest_number, prefill_text = row

            # Soft delete
            cur.execute(
                "UPDATE links SET active = false, updated_at = NOW() WHERE id = %s",
                (link_id,)
            )
            conn.commit()

            # Sync to KV (mark as inactive)
            await sync_to_kv(slug, link_id, dest_number, prefill_text, False)

            return {"ok": True}
