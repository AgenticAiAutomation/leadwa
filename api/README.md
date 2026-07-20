# Leadwa API

FastAPI backend for Leadwa.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb leadwa

# Set connection string (or use .env file)
export DATABASE_URL='postgresql://user:pass@localhost:5432/leadwa'

# Run migrations
python migrate.py
```

3. Run the API:
```bash
uvicorn main:app --host 127.0.0.1 --port 5002
```

## Migrations

- Migration files live in `migrations/` as numbered SQL files (e.g., `001_init.sql`)
- Run `python migrate.py` to apply unapplied migrations
- Applied migrations are tracked in the `schema_migrations` table
- Running migrations multiple times is safe (idempotent)

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5432/leadwa`)
- `SECRET_KEY` - JWT signing secret (default: `dev-secret-change-in-production` - **must change in production**)
- `CF_ACCOUNT_ID` - Cloudflare account ID (required for KV sync)
- `CF_KV_NAMESPACE_ID` - Cloudflare KV namespace ID for `LINKS` (required for KV sync)
- `CF_API_TOKEN` - Cloudflare API token with KV write permissions (required for KV sync)
- `BEACON_SECRET` - Shared secret for worker click beacon authentication (default: `dev-beacon-secret`)
- `WEBHOOK_SECRET` - Shared secret for webhook authentication (default: `changeme_in_production`)
- `SMS_PROVIDER` - SMS provider to use: `stub` (logs only, default), `msg91`, or `twilio`

## API Endpoints

### Health
- `GET /healthz` - Health check endpoint

### Auth
- `POST /auth/signup` - Create new user account (returns JWT in httpOnly cookie)
- `POST /auth/login` - Login with email/password (returns JWT in httpOnly cookie)
- `POST /auth/logout` - Clear auth cookie
- `GET /auth/me` - Get current user info (requires auth cookie)

### Links (all require authentication)
- `POST /links` - Create a new link (auto-generates 6-char base58 slug or accepts custom slug)
- `GET /links` - List all links for authenticated user
- `PATCH /links/{id}` - Update a link (title, dest_number, prefill_text, source_tag)
- `DELETE /links/{id}` - Soft delete a link (sets active=false)

All link create/update/delete operations automatically sync to Cloudflare KV with key=slug, value=JSON.

### Events (beacon only, shared secret auth)
- `POST /events/click` - Ingest click event from worker (requires `x-beacon-secret` header)

### Stats (require authentication)
- `GET /links/{id}/stats` - Get link statistics (total clicks, last 7 days per day, top country, mobile/desktop split)

### Webhooks
- `POST /webhooks/missed-call` - Receive missed call from MacroDroid (requires `x-webhook-secret` header)

### Leads (require authentication)
- `GET /leads` - Get all leads (optionally filter by `source` or `status` query params)
- `POST /leads` - Manually create a lead
- `PATCH /leads/{id}` - Update lead status, value, or notes

## MacroDroid Missed-Call Setup

The missed-call bridge feature automatically sends an SMS with your WhatsApp link when someone calls your business phone but you can't answer. This requires installing **MacroDroid** (Android automation app) on your business phone.

### Prerequisites
- Android phone (your business phone that receives customer calls)
- MacroDroid app (free from Google Play Store)
- Your business WhatsApp number registered in your Leadwa account

### Step-by-Step Setup

#### 1. Install MacroDroid
1. Open **Google Play Store** on your business phone
2. Search for **"MacroDroid"**
3. Install the app (the free version is sufficient)
4. Open MacroDroid and grant required permissions:
   - Phone (to detect missed calls)
   - SMS (to send messages, optional if using webhook only)
   - Internet access

#### 2. Create the Macro

1. Open MacroDroid
2. Tap the **+ (Add Macro)** button
3. Give it a name: **"Leadwa Missed Call"**

#### 3. Add the Trigger

1. Tap **"Triggers"**
2. Select **"Phone" → "Missed Call"**
3. Choose **"Any Number"** (or select specific contacts if preferred)
4. Tap **"OK"**

#### 4. Add the Action (HTTP Request)

1. Tap **"Actions"**
2. Select **"Connectivity" → "HTTP Request"**
3. Configure the request:
   - **Method**: `POST`
   - **URL**: `https://api.leadwa.co/webhooks/missed-call`
   - **Content Type**: `application/json`
   - **Request Body**:
     ```json
     {
       "caller_number": "{lv=call_number}",
       "called_at": "{lv=date_time_now_ISO8601}",
       "business_phone": "919876543210"
     }
     ```
     ⚠️ **Replace `919876543210` with your actual business WhatsApp number** (the one you registered in Leadwa). This must match exactly.
   
   - **Custom Headers**: Tap "Add" and set:
     - **Header Name**: `x-webhook-secret`
     - **Header Value**: Get this from your server admin (production secret)
     - **Header Name**: `Content-Type`
     - **Header Value**: `application/json`

4. Tap **"OK"**

#### 5. Add a Constraint (Optional but Recommended)

To avoid triggering on spam or repeat calls within a short time:

1. Tap **"Constraints"**
2. Select **"Trigger Fired" → "Not in Last X Minutes"**
3. Set to **5 minutes** (prevents duplicate SMS if caller tries again immediately)
4. Tap **"OK"**

#### 6. Save and Test

1. Tap the **checkmark (✓)** at the top right to save the macro
2. Enable the macro (toggle should be ON/green)
3. **Test it**:
   - Call your business phone from another phone
   - Don't answer, let it go to missed call
   - Check the MacroDroid log (hamburger menu → "Log") to see if the HTTP request succeeded (status 200)
   - Check your Leadwa dashboard → **Missed Calls** tab to verify the lead was created
   - The caller should receive an SMS with your link (if SMS provider is configured)

### Troubleshooting

**Macro doesn't trigger:**
- Verify MacroDroid has Phone permission (Settings → Apps → MacroDroid → Permissions)
- Check that the macro is enabled (green toggle)
- Disable battery optimization for MacroDroid (Android may kill it in background)

**HTTP request fails (status 401):**
- The `x-webhook-secret` header value doesn't match the server's `WEBHOOK_SECRET` env variable
- Contact your server admin for the correct secret

**HTTP request fails (status 404):**
- The `business_phone` in the request body doesn't match any user in the database
- Double-check the phone number format: country code + number, no spaces or symbols (e.g., `919876543210` for India)
- Ensure your WhatsApp number is correctly saved in your Leadwa account

**Lead created but no SMS sent:**
- The server's `SMS_PROVIDER` env variable is set to `stub` (logs only, doesn't send real SMS)
- Ask your server admin to configure `msg91` or `twilio` and the required API credentials
- Check server logs for SMS errors

**Duplicate leads:**
- Add the "Trigger Fired → Not in Last 5 Minutes" constraint (see Step 5)

### How It Works

1. **Missed call detected** → MacroDroid captures the caller's phone number
2. **HTTP request sent** → MacroDroid POSTs the caller info to Leadwa's webhook
3. **Lead created** → Leadwa creates a lead record with source=`missed_call`
4. **SMS sent** → Leadwa sends an auto-reply SMS with your default link
5. **Dashboard updated** → The lead appears in your **Missed Calls** tab

Now every missed call becomes a tracked lead, and the caller gets an instant way to reach you via WhatsApp!
