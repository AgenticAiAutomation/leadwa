# SEO + Content + UI Ticket — Leadwa

Run STEP 0 first (design skill), then paste the big prompt. Split into the four PARTS as separate `/clear`'d sessions if one run breaks — safer than one giant diff (last Week 2 run failed partly from being too big).

---

## STEP 0 — confirm design skill active
In Claude Code:
```
uipro init --ai claude
```
(if not already installed). It auto-activates on UI requests.

---

## THE PROMPT (paste as one message per PART)

### PART 1 — Programmatic SEO page SYSTEM (build machine, generate 6 only)

```
Use the ui-ux-pro-max skill. Stay in Leadwa's existing "honest ledger" design system (paper #FAF7F2, ink #1C1917, terracotta #C2410C, bottle green #166534, Fraunces headlines, Instrument Sans body). Static export must keep working (output: export).

Build a REUSABLE programmatic SEO page system in web/, driven by a data file — NOT hardcoded pages.

1. Create web/content/countries.ts — an array of country objects: {slug, country, currency, whatsappNote, localPainExample, priceLocal}. Populate ONLY these 6 for now: india, uae, singapore, usa, uk, australia. Structure it so adding more later = adding array entries.

2. Create a dynamic route web/app/whatsapp-link-generator/[country]/page.tsx that generateStaticParams from countries.ts, so each country builds a static page at /whatsapp-link-generator/{slug}. Each page:
   - H1: "Free WhatsApp Link Generator for {Country} Businesses"
   - The live free-link generator component (reuse existing FreeLinkGenerator)
   - A localized pain story (2-3 short sections) using localPainExample
   - Country-specific FAQ (5 Q&As, human voice)
   - Full SEO: unique meta title/description per country, OG tags, schema.org SoftwareApplication + FAQPage, canonical URL
   - All copy server-rendered (in view-source)

3. Generate sitemap.xml including all country pages. Update robots.txt to allow all + reference sitemap.

Do NOT generate more than these 6 countries. Commit as "feat: programmatic country SEO page system (6 launch markets)".
```

### PART 2 — Human-voice Q&A / pain-point pages (the "answer like a human" ask)

```
Use the ui-ux-pro-max skill, same design system.

Build an answers/help content section that reads like a real person answering, targeting real search + AI-crawler queries. Create web/content/questions.ts with these real-intent questions (sourced from how SME owners actually search on Google/Quora/Reddit for WhatsApp lead problems). For EACH: a slug, the question, and a genuinely helpful 200-400 word answer in warm human voice (NOT keyword-stuffed, NOT robotic — answer like an experienced person helping a friend, then naturally mention how Leadwa helps at the end):

- how-to-create-whatsapp-link-for-business
- whatsapp-link-with-prefilled-message
- how-to-know-which-ad-brought-whatsapp-lead
- missed-call-to-whatsapp-auto-reply
- why-am-i-losing-whatsapp-leads
- whatsapp-qr-code-for-shop-counter
- how-to-follow-up-whatsapp-leads-without-being-spammy
- whatsapp-link-for-instagram-bio
- track-whatsapp-clicks-free
- whatsapp-business-app-vs-api-for-small-business
- best-way-to-get-leads-on-whatsapp-india
- how-to-stop-whatsapp-number-getting-banned

Build a dynamic route web/app/answers/[slug]/page.tsx generating a static page per question. Each page:
- H1 = the question
- The human answer, well-formatted, scannable
- 2-3 related questions linked at the bottom (internal linking)
- schema.org QAPage + FAQPage markup
- A soft CTA to the free tool
- Full unique meta, server-rendered

Also build an /answers index page listing all questions grouped by theme (Getting started / Tracking / Follow-up / Avoiding bans).

Commit as "feat: human-voice answers section for search + AI crawlers".
```

### PART 3 — llms.txt + AI-search optimization

```
Create web/public/llms.txt following the emerging llms.txt convention: a markdown file that helps AI crawlers (GPT, Claude, Perplexity, Gemini) understand and cite the site. Include:
- # Leadwa — one-line description (WhatsApp lead-capture for small businesses)
- ## What it does (3-4 bullets, plain language)
- ## Key pages (list the free tool, the answers pages, the country pages with URLs)
- ## Who it's for (small businesses, coaching institutes, clinics, shops, agencies)
- ## Pricing summary (free tier, paid tiers, no hidden fees)
Also create llms-full.txt with the full text of the top 6 answer pages inline, so AI engines can cite complete answers.
Ensure both are served as static files at the domain root (leadwa.co/llms.txt).
Commit as "feat: llms.txt for AI search engines".
```

### PART 4 — UI/UX top-notch polish pass (the design fix)

```
Use the ui-ux-pro-max skill. Run its pre-delivery checklist against the ENTIRE site (landing, dashboard, all new SEO/answer pages). Stay strictly in the honest-ledger palette and Fraunces/Instrument Sans fonts — do not restyle to a generic theme.

Fix to top-notch standard:
- Consistent spacing scale, generous whitespace (the site currently feels cramped/plain)
- All icons via lucide-react (no emoji), 150-300ms hover transitions, cursor-pointer on everything clickable
- Focus rings on all inputs (ring-2 ring-bottle-green)
- Mobile-first: verify 375/768/1024/1440px — the primary user is on a phone
- The free-link generator (hero) should feel premium and obvious — it's the conversion point
- Dashboard: clean tab navigation, readable data tables, the per-link stats view (source/city/device/click-trends) must be clearly visible and well-designed
- Add a date-range filter (Last 7 days / 30 days / All time) to the dashboard link-stats and leads views — this was missing
- prefers-reduced-motion respected, WCAG AA contrast throughout

Commit as "feat: top-notch UI polish + dashboard date filters".
```

---

## AFTER EACH PART
```
git push
```
Then VPS (only needed if API changed — Parts 1-4 are mostly frontend, but run anyway to be safe):
```bash
cd /var/www/leadwa && git pull origin main
cd api && python3 migrate.py   # (export DATABASE_URL first if it complains)
systemctl restart leadwa-api
```
Cloudflare auto-rebuilds frontend. Check Deployments shows the NEW commit + Success before testing.

## WHERE TO CHECK YOUR DATA (your direct question)
- Lead status → dashboard "Leads" tab
- Source / city / device / click trends → dashboard "Links" tab → click an individual link → its stats view
- These only show data AFTER real clicks happen. Test: open your link from a phone on mobile data, then refresh the stats.
