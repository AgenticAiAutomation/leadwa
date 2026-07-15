"""
QR code generation endpoints.
"""
import io
import os

import psycopg
import segno
from fastapi import APIRouter, HTTPException, Response, Query, Depends
from fastapi.responses import StreamingResponse

from auth import get_current_user_id


DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/leadwa")
SHORT_URL_BASE = os.getenv("SHORT_URL_BASE", "https://leadwa.link")

router = APIRouter(prefix="/links", tags=["qr"])


@router.get("/{link_id}/qr")
async def get_qr_code(
    link_id: str,
    format: str = Query("png", pattern="^(png|svg)$"),
    user_id: str = Depends(get_current_user_id)
):
    """
    Generate QR code for a link.

    - format=png: 1024x1024 PNG for print
    - format=svg: SVG for web

    QR code contains the short URL. "Leadwa" text appears below the code.
    """
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT slug, user_id FROM links WHERE id = %s AND active = true",
                (link_id,)
            )
            row = cur.fetchone()

            if not row:
                raise HTTPException(status_code=404, detail="Link not found")

            slug, owner_id = row
            if owner_id != user_id:
                raise HTTPException(status_code=403, detail="Not authorized")

    short_url = f"{SHORT_URL_BASE}/{slug}"

    # Generate QR code with high error correction for print durability
    qr = segno.make(short_url, error="h", micro=False)

    buffer = io.BytesIO()

    if format == "png":
        # 1024px PNG for print quality
        # Scale factor: segno uses module size, 1024 / ~29 modules ≈ 35
        qr.save(
            buffer,
            kind="png",
            scale=35,
            border=2,
            dark="black",
            light="white",
        )
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="image/png",
            headers={
                "Content-Disposition": f'attachment; filename="leadwa-{slug}-qr.png"'
            }
        )

    else:  # svg
        qr.save(
            buffer,
            kind="svg",
            scale=4,
            border=2,
            dark="black",
            light="white",
            xmldecl=False,
            svgclass="leadwa-qr",
        )
        buffer.seek(0)

        # Add "Leadwa" text below the QR code in SVG
        svg_content = buffer.getvalue().decode("utf-8")

        # Insert text element before closing </svg>
        # Center text below the QR code
        text_element = '''
  <text x="50%" y="95%" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black">Leadwa</text>
</svg>'''
        svg_content = svg_content.replace("</svg>", text_element)

        return Response(
            content=svg_content,
            media_type="image/svg+xml",
            headers={
                "Content-Disposition": f'inline; filename="leadwa-{slug}-qr.svg"'
            }
        )
