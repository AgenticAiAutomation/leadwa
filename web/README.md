# Leadwa Web - Dashboard MVP

## Running Locally

### Prerequisites
- Node.js 18+
- API server running on http://localhost:5002
- PostgreSQL database with migrations applied

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5002
```

3. Start dev server:
```bash
npm run dev
```

4. Open http://localhost:3000

## Routes

- `/` - Landing page placeholder
- `/signup` - Create account
- `/login` - Sign in
- `/dashboard` - Links management

## Testing the Full Flow

1. **Signup**: Go to http://localhost:3000/signup
   - Enter email, password, optional business name and WhatsApp number
   - Automatically logs you in and redirects to dashboard

2. **Create Link**: In dashboard, click "+ Create Link"
   - Title: "Test Link"
   - WhatsApp Number: 919876543210
   - Prefill Text: "Hello from Leadwa!"
   - Source Tag: Instagram
   - Custom Slug (optional): test-link
   - Click Create

3. **Copy Short URL**: Click the "leadwa.link/xxx" link to copy

4. **Visit Link**: Open https://leadwa.link/xxx (or run worker locally)
   - Should redirect to WhatsApp with prefill text

5. **See Clicks**: Refresh dashboard
   - Click count updates
   - Sparkline shows 7-day trend

## Mobile-First Design

The dashboard is optimized for mobile viewing:
- Responsive table layout
- Touch-friendly buttons
- Modal forms work on small screens
- Owner uses a phone, not a laptop

## Features

- ✅ Login/signup with JWT httpOnly cookies
- ✅ Links table with title, short URL, source tag, clicks
- ✅ Inline SVG sparkline for 7-day click trends (no chart libraries)
- ✅ Create/edit modal with all fields
- ✅ Copy short URL to clipboard
- ✅ Real-time stats from API
- ✅ Delete links (soft delete, sets active=false)
- ✅ Mobile-first responsive design
