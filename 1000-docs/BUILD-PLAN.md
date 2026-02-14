# SalyBGone Launch Build Plan

**Goal:** By end of night (Feb 13, 2026), someone can pay $100/month and get full access to SalyBGone.  
**Starting point:** Code is built, rebranded, and pushed to `lfgcj/SALYbgone`. Domain `salybgone.com` is on Cloudflare.

---

## Phase 1: Stripe Setup (30 min)

Everything flows through Stripe — do this first since other steps depend on it.

### 1.1 Create the Product & Price

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) (use **live mode**, not test)
2. Navigate to **Product Catalog** → **+ Add Product**
3. Fill in:
   - **Name:** `SalyBGone Pro`
   - **Description:** `Full access to all SalyBGone automation tools`
4. Under **Pricing:**
   - **Model:** Standard pricing
   - **Price:** `$100.00`
   - **Billing period:** `Monthly` (recurring)
   - **Currency:** USD
5. Click **Save product**
6. Copy the **Price ID** (starts with `price_`) — you'll need this for env vars

### 1.2 Get API Keys

1. Go to **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`) — click "Reveal live key"
3. Save both somewhere secure (you'll paste them into Vercel shortly)

### 1.3 Enable Customer Portal

This lets subscribers manage their own billing (cancel, update card, etc.)

1. Go to **Settings** → **Billing** → **Customer portal**
2. Toggle ON:
   - ✅ Customers can update payment methods
   - ✅ Customers can cancel subscriptions
   - ✅ Customers can view invoice history
3. Under cancellation:
   - Set to "Cancel at end of billing period" (so they keep access through what they paid for)
4. Click **Save**

### 1.4 Create Webhook Endpoint

> **Note:** You need the Vercel URL first. Come back to this step after Phase 2.  
> If you want to set it up now with the final domain, use `https://salybgone.com/api/stripe/webhook`

1. Go to **Developers** → **Webhooks** → **+ Add endpoint**
2. **Endpoint URL:** `https://salybgone.com/api/stripe/webhook`
3. **Events to listen for** (click "+ Select events"):
   - `checkout.session.completed` — fires when someone pays
   - `customer.subscription.updated` — fires on status changes (cancel, past_due, etc.)
   - `customer.subscription.deleted` — fires when subscription is fully removed
   - `invoice.payment_failed` — fires when a renewal charge fails
4. Click **Add endpoint**
5. On the webhook detail page, click **Reveal** under "Signing secret"
6. Copy the **Webhook Secret** (starts with `whsec_`)

---

## Phase 2: Deploy to Vercel (15 min)

### 2.1 Import the Repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select `lfgcj/SALYbgone`
4. Framework Preset will auto-detect **Next.js** — leave it
5. **Don't deploy yet** — configure env vars first (next step)

### 2.2 Add Environment Variables

Before clicking "Deploy", add these in the **Environment Variables** section:

| Variable | Value | Where to get it |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe Dashboard → Developers → API keys |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Same page |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe → Webhooks → your endpoint → Signing secret |
| `STRIPE_PRICE_ID` | `price_...` | Stripe → Product Catalog → your product → Price ID |
| `NEXTAUTH_SECRET` | *(generate a random 64-char string)* | Run: `openssl rand -base64 48` or use a password generator |
| `NEXT_PUBLIC_URL` | `https://salybgone.com` | Your domain |
| `RESEND_API_KEY` | `re_...` | Resend dashboard (see Phase 3) |

> **Tip:** You can deploy now with a placeholder for `RESEND_API_KEY` and update it after Phase 3. Everything except magic link emails will work.

### 2.3 Deploy

1. Click **Deploy**
2. Wait for build to complete (~2 min)
3. Vercel gives you a `.vercel.app` URL — test it to make sure the landing page loads
4. The build script automatically runs `tsx scripts/build-registry.ts` before `next build`, so your tools are compiled

---

## Phase 3: Resend Email Setup (15 min)

Magic link login requires sending emails. Resend handles this.

### 3.1 Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Navigate to **API Keys** → **Create API Key**
   - **Name:** `salybgone-production`
   - **Permission:** Sending access
   - **Domain:** All domains (or restrict to your domain after verifying)
3. Copy the API key (starts with `re_`)
4. Go back to Vercel → **Settings** → **Environment Variables** → add/update `RESEND_API_KEY`

### 3.2 Verify Your Sending Domain

Without this, emails go to spam or get rejected.

1. In Resend, go to **Domains** → **Add Domain**
2. Enter `salybgone.com`
3. Resend gives you DNS records to add (MX, TXT/SPF, DKIM)
4. Go to **Cloudflare** → DNS for salybgone.com → add the records Resend tells you to
5. Back in Resend, click **Verify** — may take a few minutes for DNS to propagate
6. Once verified, emails from `noreply@salybgone.com` will land in inboxes

### 3.3 Redeploy After Adding API Key

1. Go to Vercel → your project → **Deployments**
2. Click the "..." on the latest deployment → **Redeploy**
3. This picks up the new `RESEND_API_KEY` env var

---

## Phase 4: Connect Domain via Cloudflare (10 min)

You already have `salybgone.com` on Cloudflare (Free plan, Full DNS setup). Now point it at Vercel.

### 4.1 Add Domain in Vercel

1. In Vercel, go to your project → **Settings** → **Domains**
2. Add `salybgone.com`
3. Also add `www.salybgone.com` (redirect to apex, or vice versa)
4. Vercel will tell you what DNS records to create

### 4.2 Configure DNS in Cloudflare

1. Go to Cloudflare → DNS → salybgone.com
2. Add the records Vercel provides. Typically:
   - **A Record:** `@` → `76.76.21.21` (Vercel's IP)
   - **CNAME:** `www` → `cname.vercel-dns.com`
3. **Important Cloudflare settings for each record:**
   - Set the proxy status to **DNS only** (grey cloud, not orange) — Vercel handles its own SSL
   - Or if you want Cloudflare proxy (orange cloud), go to **SSL/TLS** → set mode to **Full (strict)**

### 4.3 SSL/TLS Config in Cloudflare

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. Vercel auto-provisions an SSL cert once DNS is pointed

### 4.4 Verify Domain

1. After DNS changes propagate (usually 1-5 min with Cloudflare):
   - Visit `https://salybgone.com` — should load your landing page
   - Check Vercel domain settings — should show a green checkmark
2. Test `https://www.salybgone.com` redirects properly

---

## Phase 5: End-to-End Testing (20 min)

Test every step of the user journey on your live domain.

### 5.1 Landing Page

- [ ] `https://salybgone.com` loads the landing page
- [ ] Brand shows "SalyBGone" everywhere
- [ ] "Get Access" button is visible
- [ ] "See the Tools" anchor link scrolls to tool grid
- [ ] Tool cards render (3 tools from the registry)
- [ ] Footer links work (Log in, Contact email)

### 5.2 Stripe Checkout Flow

- [ ] Click "Get Access — $100/month"
- [ ] Redirected to Stripe Checkout page
- [ ] Stripe shows "SalyBGone Pro — $100.00/month"
- [ ] Complete payment with a real card (you'll refund it right after)
- [ ] After payment, redirected back to `/api/auth/verify?checkout_session=...`
- [ ] Auto-logged in and redirected to `/dashboard`
- [ ] Session cookie is set (`salybgone_session`)

### 5.3 Dashboard

- [ ] Dashboard loads with all 3 tools listed
- [ ] Search bar filters tools
- [ ] Category filter works
- [ ] Clicking a tool card goes to `/tools/[slug]`

### 5.4 Tool Detail & Download

- [ ] Tool detail page loads with full description
- [ ] "Download" button triggers a `.zip` download
- [ ] Zip contains the correct files
- [ ] Back to Dashboard link works

### 5.5 Magic Link Login (Re-login)

- [ ] Log out from dashboard
- [ ] Go to `/login`
- [ ] Enter the email you subscribed with
- [ ] Check your email for the magic link from `noreply@salybgone.com`
- [ ] Click the magic link
- [ ] Redirected to `/dashboard` with a valid session

### 5.6 Billing Management

- [ ] From dashboard, click "Manage Billing"
- [ ] Redirected to Stripe Customer Portal
- [ ] Can see invoice, update payment method, cancel
- [ ] Cancelling shows subscription ends at period end

### 5.7 Edge Cases

- [ ] Visit `/tools` without logging in → redirected to `/login`
- [ ] Visit `/dashboard` without logging in → redirected to `/login`
- [ ] Cancel subscription in Stripe → webhook fires → status updated
- [ ] Try to access `/dashboard` after cancellation → redirected to `/expired`
- [ ] `/expired` page shows "Resubscribe" button

### 5.8 Refund Your Test Payment

1. Go to Stripe Dashboard → **Payments**
2. Find your test payment → **Refund**
3. Full refund — your test subscription is cancelled

---

## Phase 6: Post-Launch Cleanup (10 min)

### 6.1 Remove Dev Login

Once you've confirmed everything works with real auth:

- Delete `app/api/auth/dev-login/route.ts`
- Remove the "Dev Login" button from `app/login/page.tsx`
- Commit & push → Vercel auto-redeploys

### 6.2 Verify Webhook is Firing

1. Go to Stripe → Webhooks → your endpoint
2. Check the "Attempts" tab — you should see successful deliveries from your test checkout
3. All should show `200` response

### 6.3 robots.txt & SEO

- Verify `https://salybgone.com/robots.txt` is accessible
- Verify `https://salybgone.com/sitemap.xml` returns valid XML

---

## Quick Reference: The Full User Journey

```
Visitor hits salybgone.com
    → Sees landing page with tools preview
    → Clicks "Get Access — $100/month"
    → Stripe Checkout (enters email + card)
    → Payment succeeds
    → Stripe webhook fires → subscriber added to data/subscribers.json
    → Redirected back → session JWT created → cookie set
    → Lands on /dashboard
    → Browse tools, download zips
    → Later: returns to salybgone.com/login
    → Enters email → magic link sent via Resend
    → Clicks link → session created → back to /dashboard
    → Manage billing via Stripe Customer Portal
```

---

## Total Estimated Time: ~1.5 hours

| Phase | Time | Dependency |
|-------|------|------------|
| 1. Stripe Setup | 30 min | None |
| 2. Vercel Deploy | 15 min | Stripe keys |
| 3. Resend Setup | 15 min | None (can parallel with Phase 2) |
| 4. Domain Connect | 10 min | Vercel deployed |
| 5. E2E Testing | 20 min | Everything above |
| 6. Cleanup | 10 min | Testing passed |

**Critical path:** Stripe → Vercel → Domain → Test  
**Parallel:** Resend setup can happen while Vercel deploys

---

## Files That Reference Config (For Debugging)

| Config | Used in |
|--------|---------|
| `STRIPE_SECRET_KEY` | `lib/stripe.ts` |
| `STRIPE_PRICE_ID` | `app/api/stripe/checkout/route.ts` |
| `STRIPE_WEBHOOK_SECRET` | `lib/stripe.ts` → `getStripeWebhookSecret()` |
| `NEXTAUTH_SECRET` | `lib/auth.ts`, `middleware.ts` |
| `NEXT_PUBLIC_URL` | `lib/email.ts`, `app/api/stripe/checkout/route.ts`, `app/api/auth/verify/route.ts`, `app/api/stripe/portal/route.ts`, `app/sitemap.ts` |
| `RESEND_API_KEY` | `lib/email.ts` |
| Session cookie name | `salybgone_session` in `middleware.ts`, `lib/auth.ts`, `app/api/auth/verify/route.ts`, `app/api/auth/dev-login/route.ts` |
