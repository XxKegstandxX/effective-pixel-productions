# Effective Pixel Productions

A modern, dark-themed commercial photography studio website built with Next.js, Tailwind CSS, and deployed on Vercel.

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/effective-pixel-productions.git
cd effective-pixel-productions
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

---

## 📁 Content Management

All content is managed through simple JSON files and image folders. No CMS required.

### Team/Vendor Information

Edit this file to update all team member information:

```
content/team/vendors.json
```

**Structure:**

```json
{
  "studioLead": {
    "id": "your-id",
    "name": "Your Name",
    "title": "Your Title",
    "bio": "Your bio...",
    "photo": "your-photo.jpg"
  },
  "categories": [
    {
      "id": "photographers",
      "title": "Photographers",
      "vendors": [
        {
          "id": "john-doe",
          "name": "John Doe",
          "bio": "Bio here...",
          "photo": "john-doe.jpg"
        }
      ]
    }
  ],
  "clients": [
    { "name": "Hasbro", "logo": "hasbro.png" }
  ]
}
```

### Images

Drop your images in these folders:

| Folder | Purpose | Naming Convention |
|--------|---------|-------------------|
| `public/images/headshots/` | Team member photos | Match the `photo` field in vendors.json (e.g., `john-doe.jpg`) |
| `public/images/clients/` | Client logos | Match the `logo` field in vendors.json (e.g., `hasbro.png`) |
| `public/images/portfolio/` | Work samples | Any descriptive name |

**Image Recommendations:**
- Headshots: Square or 4:5 aspect ratio, minimum 400x400px
- Client logos: PNG with transparency, ~200px wide (will display in grayscale/muted)
- Portfolio images: 1200-1600px on the long edge

---

## 🌐 Deployment to Vercel

### First-Time Setup

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Connect Your Domain:**
   - In Vercel dashboard, go to Project Settings → Domains
   - Add `effectivepixelproductions.com`
   - Vercel will provide DNS settings
   - Update your domain's DNS at your registrar:
     - Add an `A` record pointing to `76.76.21.21`
     - Or add a `CNAME` record pointing to `cname.vercel-dns.com`

### Updating the Site

Any push to the `main` branch will automatically redeploy:

```bash
git add .
git commit -m "Update team bios"
git push origin main
```

---

## 📧 Contact Form Setup

The contact form is ready to connect to an email service. We recommend **Formspree** for simplicity:

1. Sign up at [formspree.io](https://formspree.io)
2. Create a new form and get your form ID
3. Update `src/components/ContactForm.tsx`:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setStatus('submitting')
  
  const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
  
  if (response.ok) {
    setFormData({ name: '', email: '', company: '', message: '' })
    setStatus('success')
  } else {
    setStatus('error')
  }
}
```

---

## 🎨 Design System

### Colors (Dark Theme)

| Token | Hex | Usage |
|-------|-----|-------|
| `ep-black` | #0c0c0c | Background |
| `ep-charcoal` | #161616 | Cards, elevated surfaces |
| `ep-slate` | #1e1e1e | Image placeholders |
| `ep-graphite` | #2a2a2a | Borders |
| `ep-gray` | #525252 | Muted text |
| `ep-silver` | #9a9a9a | Body text |
| `ep-white` | #fafaf9 | Headlines |
| `ep-accent` | #7d8c7a | Accent (sage green) |

### Fonts

- **Syne** - Bold, geometric display font for headlines
- **Outfit** - Clean, modern sans-serif for body text

To change fonts, update `src/app/layout.tsx`.

---

## 📋 Checklist Before Launch

- [ ] Update `vendors.json` with all real team information
- [ ] Add all headshot photos to `public/images/headshots/`
- [ ] Add client logos to `public/images/clients/`
- [ ] Update contact email in Footer component
- [ ] Connect contact form to email service
- [ ] Update meta description in `src/app/layout.tsx`
- [ ] Test on mobile devices
- [ ] Connect domain in Vercel

---

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Fonts:** Google Fonts (Syne, Outfit)
- **Deployment:** Vercel
- **Language:** TypeScript

---

## Need Help?

Common fixes:

1. **Images not showing:** Make sure filenames in `vendors.json` exactly match the files in `public/images/`
2. **Styling issues:** Run `npm run build` to check for any TypeScript errors
3. **Deployment fails:** Check the Vercel build logs for specific errors

Good luck with the launch! 🚀

---

## 📅 Headshot Booking (`/headshots`)

Paid slot booking backed by Supabase (data + realtime) and Stripe Checkout (payment).

### Setup

1. **Supabase** — create a project, open *SQL Editor*, paste and run [`supabase/schema.sql`](supabase/schema.sql). It creates `events`, `slots`, `bookings`, RLS policies, the `hold_slot()` / `generate_slots()` functions, enables realtime on `slots`, and seeds the 10/10/2026 event with its 32 slots. The final query should report `slot_count = 32`.
2. **Env vars** — copy `.env.example` to `.env.local` and fill in the Supabase and Stripe keys (same names in Vercel).
3. **Stripe webhook** — in the Stripe dashboard (*Developers → Webhooks*) add an endpoint for `https://<your-domain>/api/stripe/webhook` with events:
   `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.
   Put the signing secret in `STRIPE_WEBHOOK_SECRET`. For local dev:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Already have the base schema? Also run the files in [`supabase/migrations/`](supabase/migrations/) in date order.
5. `npm run dev` and open [http://localhost:3000/headshots](http://localhost:3000/headshots).

### Adding the next event

```sql
insert into events (name, event_date, start_time, end_time, slot_minutes, price_cents, timezone)
values ('November Headshots', '2026-11-14', '09:00', '17:00', 15, 8500, 'America/New_York');

select generate_slots(id) from events where event_date = '2026-11-14';
```

`/headshots` shows the next upcoming event automatically.

### How a booking flows

| Step | Where | What happens |
|---|---|---|
| Pick slot + submit form | `POST /api/checkout` | `hold_slot()` atomically marks the slot `held` for 30 min, a `pending` booking is created, Stripe Checkout session is created with a dynamic amount |
| Pay | Stripe | Session expires after 30 min (Stripe minimum); the slot's `held_until` is synced to that exact expiry |
| Payment succeeds | `POST /api/stripe/webhook` → `confirmBooking()` | booking → `confirmed`, slot → `booked` (also run from `/headshots/success` as a fallback if the webhook is slow) |
| Customer backs out | `GET /api/checkout/cancel` | booking → `cancelled`, slot → `open` |
| Customer just closes the tab | nothing | hold lapses; the grid treats expired holds as open (lazy expiry) and the next `hold_slot()` takes it over and expires the stale Stripe session |
| Customer opens `/headshots/manage/<bookingId>` | server-rendered, service role | Shows slot/status. Reschedule + Cancel only while `status = confirmed` **and** now < event start − 24h (`event_starts_at()`) |
| Reschedule | `POST /api/manage/<id>/reschedule` → `reschedule_booking()` | One transaction: claim new slot (open or lapsed hold) → move booking → release old slot. Race → `SLOT_UNAVAILABLE` → customer picks again |
| Cancel & refund | `POST /api/manage/<id>/cancel` → `cancelBookingWithRefund()` | Reads the real Stripe fee from the charge's balance transaction, refunds `amount − fee`, then booking → `cancelled`, slot → `open`. Refund failure leaves everything untouched |
| Paid after losing the slot (last-resort safety net; shouldn't happen now that hold = session lifetime) | `confirmBooking()` | booking → `cancelled`, automatic Stripe refund, customer sees a "slot was taken" page |
