"""
Webhooks for external integrations.
"""
import os
from datetime import datetime
from typing import Optional

import psycopg
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel

# Config
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/leadwa")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "changeme_in_production")
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "stub")  # stub | msg91 | twilio

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


# Models
class MissedCallPayload(BaseModel):
    caller_number: str
    called_at: str  # ISO 8601 timestamp
    business_phone: str  # The phone that received the missed call


class MissedCallResponse(BaseModel):
    ok: bool
    lead_id: Optional[str] = None
    sms_sent: bool


# SMS interface
async def send_sms(to_number: str, message: str) -> bool:
    """
    Send SMS via configured provider.
    Returns True if sent successfully, False otherwise.
    """
    if SMS_PROVIDER == "stub":
        # Stub implementation for development
        print(f"[SMS STUB] To: {to_number}, Message: {message}")
        return True
    elif SMS_PROVIDER == "msg91":
        # TODO: Implement MSG91 SMS sending
        # https://docs.msg91.com/p/tf9GTextN/e/EKk95cwVq/MSG91
        print(f"[SMS MSG91 TODO] To: {to_number}, Message: {message}")
        return False
    elif SMS_PROVIDER == "twilio":
        # TODO: Implement Twilio SMS sending
        # https://www.twilio.com/docs/sms/api
        print(f"[SMS TWILIO TODO] To: {to_number}, Message: {message}")
        return False
    else:
        print(f"[SMS ERROR] Unknown provider: {SMS_PROVIDER}")
        return False


@router.post("/missed-call", response_model=MissedCallResponse)
async def receive_missed_call(payload: MissedCallPayload, x_webhook_secret: Optional[str] = Header(None)):
    """
    Receive missed call webhook from MacroDroid.
    Creates a lead and sends an SMS with the user's default link.
    """
    # Verify webhook secret
    if x_webhook_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # Find user by business phone number
            cur.execute(
                "SELECT id FROM users WHERE whatsapp_number = %s",
                (payload.business_phone,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"No user found with phone {payload.business_phone}")

            user_id = row[0]

            # Get user's default link (most recently created active link)
            cur.execute(
                """
                SELECT slug FROM links
                WHERE user_id = %s AND active = true
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (user_id,)
            )
            link_row = cur.fetchone()
            if not link_row:
                raise HTTPException(status_code=404, detail="No active link found for this user")

            default_slug = link_row[0]

            # Create lead
            cur.execute(
                """
                INSERT INTO leads (user_id, source, contact_number, status)
                VALUES (%s, 'missed_call', %s, 'new')
                RETURNING id
                """,
                (user_id, payload.caller_number)
            )
            lead_id = cur.fetchone()[0]

            # Insert missed call record
            called_at = datetime.fromisoformat(payload.called_at.replace('Z', '+00:00'))
            cur.execute(
                """
                INSERT INTO missed_calls (user_id, caller_number, called_at, lead_id, sms_sent)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, payload.caller_number, called_at, lead_id, False)
            )
            missed_call_id = cur.fetchone()[0]

            conn.commit()

            # Send SMS
            sms_message = f"Sorry we missed your call! Message us here: https://leadwa.link/{default_slug}"
            sms_sent = await send_sms(payload.caller_number, sms_message)

            # Update missed call record with SMS status
            if sms_sent:
                cur.execute(
                    "UPDATE missed_calls SET sms_sent = true WHERE id = %s",
                    (missed_call_id,)
                )
                conn.commit()

            return MissedCallResponse(
                ok=True,
                lead_id=str(lead_id),
                sms_sent=sms_sent
            )
