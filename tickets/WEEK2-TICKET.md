# Week 2 — Missed-Call Bridge + Outcome Attribution + Slug UX + Design Pass

Run these in order. Install the design skill FIRST, once, before any UI work.

---

## STEP 0 — Install UI/UX Pro Max skill (one-time)

Run in Claude Code terminal:
```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```
Verify it's active — it auto-activates on any UI/UX request, no further command needed.

---

## STEP 1 — Paste this full prompt as one message:

```
Use the ui-ux-pro-max skill for all UI work below. Stack: Next.js + Tailwind (existing web/ setup). This is a WhatsApp lead-capture SaaS for Indian SMEs — style should match the existing "honest ledger" design system already in place (warm paper #FAF7F2, ink #1C1917, terracotta #C2410C for loss/before, bottle green #166534 for recovery/after, Fraunces headlines, Instrument Sans body). Do NOT switch to a generic SaaS dark theme — stay in this design system, just execute it with better polish, spacing, and micro-interactions.

PART A — Slug availability UX (like Twitter/Instagram username check):
- On the free-link generator and the dashboard "create link" form, add a live slug/custom-URL input field.
- On every keystroke (debounced 400ms), call a new GET /links/check-slug?slug=xxx endpoint.
- Show a green checkmark + "leadwa.link/xxx is available" when free.
- Show a red X + "Already taken, try another" when unavailable, and auto-suggest 3 alternatives (append short random suffix or numbers).
- Add a separate "Title" field above/below it labeled "What should we call this link?" (e.g. "Instagram Bio Link", "Diwali Hoarding") — this is just a friendly nickname, stored separately from the slug, shown in the dashboard link list instead of the raw slug so the owner recognizes their links at a glance.
- Backend: add GET /links/check-slug endpoint in api/links.py, querying the links table for slug existence (works for both authenticated and anonymous slugs), rate-limited per IP.

PART B — Missed-call bridge (the game-changing feature):
- New DB table: missed_calls (id, user_id, caller_number, called_at, sms_sent bool, converted_to_lead_id nullable fk to links or a new leads table, created_at).
- New table: leads (id, user_id, source enum['link_click','missed_call','manual'], contact_number, link_id nullable fk, status enum['new','contacted','quoted','won','lost'] default 'new', value_inr nullable integer, notes text, created_at, updated_at). This becomes the outcome ledger for Part C too.
- API endpoint: POST /webhooks/missed-call (shared-secret header) — accepts {caller_number, called_at}, inserts into missed_calls, creates a leads row with source='missed_call', sends a transactional SMS via a pluggable SMS provider interface (stub the actual send behind an SMS_PROVIDER env flag — implement using MSG91 or Twilio REST API, whichever has simpler India DLT setup; if uncertain, stub with a TODO and a clear interface so it's swappable) with message: "Sorry we missed your call! Message us here: https://leadwa.link/{user's default slug}".
- Dashboard: new "Missed Calls" tab in the sidebar showing the leads table filtered to source='missed_call', with the same status dropdown as Part C.
- Write a README section in api/README.md titled "MacroDroid Missed-Call Setup" explaining: install MacroDroid on the business phone, create a trigger on missed call, macro sends an HTTP POST to https://api.leadwa.co/webhooks/missed-call with the caller number and timestamp, include the exact MacroDroid macro JSON export structure if you can reasonably infer it, otherwise describe the manual macro setup steps clearly enough for a non-technical user to follow.

PART C — Outcome-based lead ledger + source attribution (uses the leads table from Part B):
- Every link click event (from the existing clicks table) should be capable of being promoted to a lead: add a "Convert to lead" button on the dashboard's per-link click history, which creates a leads row with source='link_click', link_id set.
- Dashboard: new "Leads" tab — a simple table: contact number, source (icon: link/call/manual), status (dropdown: new/contacted/quoted/won/lost, inline-editable, no page reload), value in ₹ (editable inline), created date. Five-tap simple, no CRM complexity.
- New dashboard widget on the main overview page: "This month" — total leads, won count, total ₹ value won, and a small bar chart (use recharts, already available) showing leads by source (link clicks vs missed calls vs manual) so the owner sees which channel produces real wins, not just clicks.
- API: GET /leads (list, filterable by status/source), PATCH /leads/{id} (update status/value/notes), POST /leads (manual add).

PART D — Design polish pass (apply ui-ux-pro-max checklist to existing pages):
- Run the pre-delivery checklist from the skill against the existing dashboard and landing page: no emoji-as-icons (use lucide-react, already available), cursor-pointer on all clickable elements, hover states with 150-300ms transitions, focus states visible for keyboard nav, WCAG AA contrast, responsive at 375/768/1024/1440px, prefers-reduced-motion respected.
- Do not change the color palette or fonts — only polish spacing, shadows, transitions, and consistency.

Run all migrations, commit as "feat: slug availability UX, missed-call bridge, outcome ledger, design polish" and push.
```

## STEP 2 — After it finishes:
```powershell
git push
```
Then on VPS:
```bash
cd /var/www/leadwa && git pull origin main
cd api && pip install -r requirements.txt --break-system-packages
python3 migrate.py
systemctl restart leadwa-api
```

## STEP 3 — Test:
1. Try creating a link, type a slug that exists — see red X
2. Type a free slug — see green check
3. Add a title, save
4. Open the new Leads tab, manually add a lead, change its status
5. Check the "This month" widget shows the count
